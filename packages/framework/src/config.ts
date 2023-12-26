import path from "node:path";
import fs from "node:fs";
import { IAppData } from "./appData";
import { DEFAULT_CONFIG_FILE } from "./constants";
import esbuild from "esbuild";
import { liveReloadPlugin } from "./esbuild-plugins";
import { IHmrServer } from "./hmr-server";
import { DevServe } from "./dev";
import {
  ILiveReloadArgs,
  reloadClient,
  reloadServer,
} from "./esbuild-plugins/live-reload";
import type { Options as ProxyOptions } from "http-proxy-middleware";

interface IGetUserConfigParams {
  appData: IAppData;
  hmrWss: IHmrServer;
  expressApp: DevServe["expressApp"];
}

export interface IUserConfig {
  title?: string;
  proxy?: {
    [key: string]: ProxyOptions;
  };
}

interface IConfigDevServeParams {
  outdir: string;
  entryPoints: string[];
  onRebuild?: ILiveReloadArgs["onRebuild"];
}

class ConfigDevServe {
  private static _instance: ConfigDevServe | null = null;
  static async getInstance({
    outdir,
    entryPoints,
    onRebuild,
  }: IConfigDevServeParams) {
    if (!ConfigDevServe._instance) {
      ConfigDevServe._instance = new ConfigDevServe();
      await ConfigDevServe._instance.createServer({
        outdir,
        entryPoints,
        onRebuild,
      });
    }

    return ConfigDevServe._instance;
  }

  async createServer({
    outdir,
    entryPoints,
    onRebuild,
  }: IConfigDevServeParams) {
    const ctx = await esbuild.context({
      format: "cjs",
      logLevel: "error",
      platform: "browser",
      outdir,
      bundle: true,
      entryPoints,
      define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
      },
      plugins: [
        liveReloadPlugin({
          onRebuild,
        }),
      ],
    });
    await ctx.watch();
  }
}

export const getUserConfig = async ({
  appData,
  hmrWss,
  expressApp,
}: IGetUserConfigParams): Promise<IUserConfig> => {
  let config = {};
  const configFile = path.resolve(appData.paths.cwd, DEFAULT_CONFIG_FILE);

  if (fs.existsSync(configFile)) {
    await ConfigDevServe.getInstance({
      outdir: appData.paths.absTempPath,
      entryPoints: [configFile],
      onRebuild: () => {
        console.log("getUserConfig onRebuild run");

        reloadServer(expressApp);
        reloadClient(hmrWss);
      },
    });
    try {
      const configJsPath = path.resolve(
        appData.paths.absTempPath,
        "umi-like.config.js"
      );
      // FIXME 会导致内存泄漏 see https://zhuanlan.zhihu.com/p/34702356
      delete require.cache[configJsPath];

      config = require(configJsPath).default;
    } catch (e) {
      console.error("getUserConfig error", e);
    }
  }
  return config;
};
