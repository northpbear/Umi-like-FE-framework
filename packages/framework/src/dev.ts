import path from "node:path";
import express from "express";
import * as esbuild from "esbuild";
import {
  DEFAULT_BUILD_PORT,
  DEFAULT_ENTRY_POINTS,
  DEFAULT_HOST,
  DEFAULT_OUTPUT_DIR,
  DEFAULT_PORT,
  htmlTemplate,
} from "./constants";

class DevServe {
  ctx: esbuild.BuildContext | null = null;

  async create() {
    this.ctx = await esbuild.context({
      format: "iife",
      logLevel: "error",
      platform: "browser",
      outdir: DEFAULT_OUTPUT_DIR,
      bundle: true,
      entryPoints: [path.resolve(process.cwd(), DEFAULT_ENTRY_POINTS)],
      define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
      },
    });
  }

  async serve() {
    return await this.ctx?.serve({
      port: DEFAULT_BUILD_PORT,
      host: DEFAULT_HOST,
      servedir: DEFAULT_OUTPUT_DIR,
      onRequest: (args) => {
        if (args.timeInMS) {
          console.log(`${args.method}: ${args.path} ${args.timeInMS} ms`);
        }
      },
    });
  }

  cancel() {
    this.ctx?.cancel();
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
    const app = express();

    app.get("/", (_, res) => {
      // see https://expressjs.com/en/api.html#res.set
      res.set("Content-Type", "text/html");
      res.send(htmlTemplate);
    });

    app.listen(DEFAULT_PORT, async () => {
      devServe.serve();
      console.log(`Umi-like start at ${DEFAULT_HOST}:${DEFAULT_PORT}`);
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
