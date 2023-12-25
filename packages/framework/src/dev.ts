import path from "node:path";
import express from "express";
import * as esbuild from "esbuild";
import portfinder from "portfinder";
import {
  DEFAULT_BUILD_PORT,
  DEFAULT_ENTRY_POINT,
  DEFAULT_HOST,
  DEFAULT_OUTPUT_DIR,
  DEFAULT_PORT,
  htmlTemplate,
} from "./constants";
import { hmr, IHmrServer } from "./hmr-server";
import { createServer } from "http";
import type { Server as HttpServer } from "http";
import { liveReloadPlugin, stylePlugin } from "./esbuild-plugins";

class DevServe {
  expressApp: ReturnType<typeof express>;
  httpSever: HttpServer;
  hmrWss: IHmrServer;
  ctx: esbuild.BuildContext | null = null;
  private _port: number = DEFAULT_BUILD_PORT;

  /**
   * 当前devServe占用的端口号
   * @readonly
   * @memberof DevServe
   */
  get port() {
    return this._port;
  }

  constructor() {
    this.expressApp = express();
    this.httpSever = createServer(this.expressApp);
    this.hmrWss = hmr(this.httpSever);
  }

  async create() {
    this._port = await this.getPort();
    const self = this;

    this.ctx = await esbuild.context({
      format: "iife",
      logLevel: "error",
      platform: "browser",
      outdir: DEFAULT_OUTPUT_DIR,
      bundle: true,
      entryPoints: [path.resolve(process.cwd(), DEFAULT_ENTRY_POINT)],
      define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
      },
      plugins: [
        stylePlugin(),
        liveReloadPlugin({
          hmrWss: self.hmrWss,
        }),
      ],
    });
  }

  severStatic() {
    const esbuildOutput = path.resolve(process.cwd(), DEFAULT_OUTPUT_DIR);
    this.expressApp.use(
      `/${DEFAULT_OUTPUT_DIR}`,
      express.static(esbuildOutput)
    );
    this.expressApp.use(
      `/umi-like`,
      express.static(path.resolve(__dirname, "client"))
    );
  }

  makeIndexHtml() {
    this.expressApp.get("/", (_, res) => {
      // see https://expressjs.com/en/api.html#res.set
      res.set("Content-Type", "text/html");
      res.send(htmlTemplate(this.port));
    });
  }

  heartbeat() {
    this.expressApp.get("/ping", (_, res) => {
      // see https://expressjs.com/en/api.html#res.set
      res.set("Content-Type", "text/html");
      res.send("pong");
    });
  }

  async serve(port = DEFAULT_PORT) {
    await this.ctx?.watch();
    await this.ctx?.serve({
      port: this.port,
      host: DEFAULT_HOST,
      servedir: DEFAULT_OUTPUT_DIR,
      onRequest: (args) => {
        if (args.timeInMS) {
          console.log(`${args.method}: ${args.path} ${args.timeInMS} ms`);
        }
      },
    });

    this.severStatic();
    this.heartbeat();
    this.makeIndexHtml();

    this.httpSever.listen(port, async () => {
      console.log(`Umi-like start at ${DEFAULT_HOST}:${port}`);
      console.log(`Umi-like start at localhost:${port}`);
    });
  }

  cancel() {
    this.ctx?.cancel();
  }

  /**
   * 获取一个可用的端口号
   */
  private async getPort() {
    return await portfinder.getPortPromise({
      port: DEFAULT_BUILD_PORT,
    });
  }
}

export const dev = async () => {
  try {
    const devServe = new DevServe();
    await devServe.create();

    process.on("SIGINT", () => {
      devServe.cancel();
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      devServe.cancel();
      process.exit(1);
    });

    devServe.serve();
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
