import { build as esbuild } from "esbuild";
import { getAppData } from "./appData";
import { getUserConfig } from "./config";
import { getRoutes } from "./routes";
import { generateEntry } from "./entry";
import { generateHtml } from "./html";
import { stylePlugin } from "./esbuild-plugins";

export const build = async () => {
  const cwd = process.cwd();

  // 生命周期
  // 获取项目元信息
  const appData = await getAppData({
    cwd,
  });
  // 获取用户数据
  const userConfig = await getUserConfig({
    appData,
    isProduction: true,
  });
  // 获取 routes 配置
  const routes = await getRoutes({ appData });

  // 生成项目主入口
  await generateEntry({ appData, routes });
  // 生成 Html
  await generateHtml({ appData, userConfig, isProduction: true });
  // 执行构建
  await esbuild({
    format: "iife",
    logLevel: "error",
    outdir: appData.paths.absOutputPath,
    platform: "browser",
    bundle: true,
    minify: true,
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    external: ["esbuild"],
    plugins: [stylePlugin()],
    entryPoints: [appData.paths.absEntrypointPath],
  });
  console.log("build end");
};
