import path from "node:path";
import fs from "node:fs";
import express from "express";
import * as esbuild from "esbuild";
import portfinder from "portfinder";
import {
  DEFAULT_BUILD_PORT,
  DEFAULT_HOST,
  DEFAULT_OUTPUT_DIR,
  DEFAULT_PORT,
} from "./constants";
import { hmr, IHmrServer } from "./hmr-server";
import { createServer } from "http";
import type { Server as HttpServer } from "http";
import { liveReloadPlugin, stylePlugin } from "./esbuild-plugins";
import { getAppData, IAppData } from "./appData";
import { getRoutes } from "./routes";
import { generateEntry } from "./entry";
import { generateHtml } from "./html";
import { getUserConfig } from "./config";
import { reloadClient } from "./esbuild-plugins/live-reload";
import { createProxyMiddleware } from "http-proxy-middleware";

export class DevServe {
  expressApp: ReturnType<typeof express>;
  httpSever: HttpServer;
  hmrWss: IHmrServer;
  ctx: esbuild.BuildContext | null = null;
  appData: IAppData | null = null;
  private _port: number = DEFAULT_BUILD_PORT;

  /**
   * 当前devServe占用的端口号
   * @readonly
   * @memberof DevServe
   */
  get port() {
    return this._port;
  }

  constructor({ appData }: { appData: IAppData }) {
    this.expressApp = express();
    this.httpSever = createServer(this.expressApp);
    this.hmrWss = hmr(this.httpSever);
    this.appData = appData;
  }

  async create() {
    this._port = await this.getPort();
    const self = this;

    this.ctx = await esbuild.context({
      format: "iife",
      logLevel: "error",
      platform: "browser",
      outdir: this.appData?.paths.absOutputPath,
      bundle: true,
      entryPoints: [this.appData!.paths.absEntrypointPath],
      define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
      },
      plugins: [
        stylePlugin(),
        liveReloadPlugin({
          onRebuild: () => {
            reloadClient(self.hmrWss);
          },
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
    this.expressApp.get("/", (_, res, next) => {
      // see https://expressjs.com/en/api.html#res.set
      res.set("Content-Type", "text/html");

      const htmlPath = path.join(
        this.appData!.paths.absOutputPath,
        "index.html"
      );
      if (fs.existsSync(htmlPath)) {
        fs.createReadStream(htmlPath).on("error", next).pipe(res);
      } else {
        next();
      }
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
      servedir: this.appData?.paths.absOutputPath,
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
    // 框架生命周期
    // 获取项目元数据
    const appData = await getAppData({ cwd: process.cwd() });

    // 创建DevServe
    const devServe = new DevServe({
      appData,
    });

    async function buildMain({ appData }: { appData: IAppData }) {
      console.log("buildMain run");

      // 获取用户自定义配置
      const userConfig = await getUserConfig({
        appData,
        hmrWss: devServe.hmrWss,
        expressApp: devServe.expressApp,
      });
      // 生成 入口 html
      await generateHtml({ appData, userConfig });

      // 获取 约定式路由配置
      const routes = await getRoutes({ appData });

      // 生成项目 js 入口
      await generateEntry({
        appData,
        routes,
      });

      // 处理本地代理
      if (userConfig.proxy) {
        // see https://github.com/chimurai/http-proxy-middleware
        Object.entries(userConfig.proxy).forEach(([key, proxyConfig]) => {
          const target = proxyConfig.target;
          if (target) {
            devServe.expressApp.use(
              key,
              createProxyMiddleware(key, proxyConfig)
            );
          }
        });
      }
    }

    devServe.expressApp.on("rebuild", async () => {
      await buildMain({ appData });
    });

    await buildMain({ appData });

    // 执行构建
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
