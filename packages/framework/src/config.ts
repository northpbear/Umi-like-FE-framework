import path from "node:path";
import fs from "node:fs";
import { IAppData } from "./appData";
import { DEFAULT_CONFIG_FILE } from "./constants";
import esbuild from "esbuild";
import { liveReloadPlugin } from "./esbuild-plugins";
import { IHmrServer } from "./hmr-server";

interface IGetUserConfigParams {
  appData: IAppData;
  hmrWss: IHmrServer;
}

export interface IUserConfig {
  title?: string;
}

export const getUserConfig = async ({
  appData,
  hmrWss,
}: IGetUserConfigParams): Promise<IUserConfig> => {
  let config = {};
  const configFile = path.resolve(appData.paths.cwd, DEFAULT_CONFIG_FILE);

  if (fs.existsSync(configFile)) {
    const ctx = await esbuild.context({
      format: "cjs",
      logLevel: "error",
      platform: "browser",
      outdir: appData.paths.absTempPath,
      bundle: true,
      entryPoints: [configFile],
      define: {
        "process.env.NODE_ENV": JSON.stringify("development"),
      },
      plugins: [
        liveReloadPlugin({
          hmrWss,
        }),
      ],
    });
    await ctx.watch();

    try {
      config = require(path.resolve(
        appData.paths.absTempPath,
        "umi-like.config.js"
      )).default;
    } catch (e) {
      console.error("getUserConfig error", e);
    }
  }
  return config;
};
