import path from "node:path";
import { DEFAULT_ENTRY_POINT, DEFAULT_OUTPUT_DIR } from "./constants";

interface IOptions {
  cwd: string;
}
export interface IAppData {
  paths: {
    cwd: string; // 当前工作目录
    absSrcPath: string; // 源码目录的绝对路径
    absPagesPath: string; // 页面目录的绝对路径
    absTempPath: string; // 临时目录的绝对路径
    absOutputPath: string; // 输出目录的绝对路径
    absNodeModulesPath: string; // node_modules目录的绝对路径
    absEntrypointPath: string; // 入口文件的绝对路径
  };
  pkg: any; // package.json
}

export const getAppData = async ({ cwd }: IOptions): Promise<IAppData> => {
  const pkg = require(path.join(cwd, "package.json"));
  const absSrcPath = path.join(cwd, "src");
  const absPagesPath = path.join(absSrcPath, "pages");
  const absTempPath = path.join(absSrcPath, ".umi-like");
  const absEntrypointPath = path.join(absTempPath, DEFAULT_ENTRY_POINT);
  const absOutputPath = path.join(cwd, DEFAULT_OUTPUT_DIR);
  const absNodeModulesPath = path.join(cwd, "node_modules");

  return {
    paths: {
      cwd,
      absSrcPath,
      absPagesPath,
      absTempPath,
      absEntrypointPath,
      absOutputPath,
      absNodeModulesPath,
    },
    pkg,
  };
};
