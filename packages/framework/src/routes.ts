import fs from "node:fs";
import path from "node:path";
import { IAppData } from "./appData";
import { DEFAULT_LAYOUT_PATH } from "./constants";

function isTsOrTsx(file: string) {
  return /\.tsx?/.test(file);
}

/**
 * 获取可以生成路由的文件列表, 默认使用index.tsx作为入口文件
 *
 * e.g:
 * pages
 *   - Foo
 *      - index.tsx     √
 *   - Bar
 *      - index.ts      √
 *   - Aaa
 *      - template.ts   ×
 *   - Xxx.tsx          ×
 *
 *  ==> [Foo, Bar]
 *
 * FIXME 暂时只支持单层目录
 * FIXME 没有判断不该生成路由的约定文件名
 * FIXME 没有支持自定义配置文件名作为入口
 */
function getFiles(root: string) {
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs.readdirSync(root).filter((file) => {
    const absFile = path.join(root, file);
    const stats = fs.statSync(absFile);
    if (stats.isDirectory()) {
      return fs.readdirSync(absFile).some((childFile) => {
        const absChildFile = path.join(absFile, childFile);
        const stats = fs.statSync(absChildFile);
        const isFile = stats.isFile();
        if (isFile) {
          return isTsOrTsx(childFile);
        }
        return false;
      });
    }
    return isTsOrTsx(file);
  });
}

function filesToRoutes(files: string[], pagesPath: string): IRoute[] {
  return files.map((file) => {
    const absFile = path.join(pagesPath, file, "index");

    const pagePath = file.toLowerCase();
    return {
      path: pagePath === "home" ? "/" : `/${pagePath}`,
      element: absFile,
    };
  });
}

interface IGetRoutesPatams {
  appData: IAppData;
}

export interface IRoute {
  element: any;
  path: string;
  routes?: IRoute[];
}

export async function getRoutes({ appData }: IGetRoutesPatams) {
  const {
    paths: { absPagesPath, absSrcPath },
  } = appData;
  const files = getFiles(absPagesPath);
  const routes = filesToRoutes(files, absPagesPath);
  const layoutPath = path.resolve(absSrcPath, DEFAULT_LAYOUT_PATH);

  if (
    !fs.existsSync(layoutPath + ".tsx") &&
    !fs.existsSync(layoutPath + ".ts")
  ) {
    return routes;
  } else {
    return [
      {
        path: "/",
        element: layoutPath,
        routes,
      },
    ];
  }
}
