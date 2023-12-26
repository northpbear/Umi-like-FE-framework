import fs from "node:fs";
import path from "node:path";
import { IAppData } from "./appData";
import { IUserConfig } from "./config";
import { DEFAULT_FRAMEWORK_NAME, DEFAULT_OUTPUT_DIR } from "./constants";

interface IGenerateHtmlParams {
  appData: IAppData;
  userConfig: IUserConfig;
  isProduction?: boolean;
}

export const generateHtml = async ({
  appData,
  userConfig,
  isProduction,
}: IGenerateHtmlParams) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <title>${
              userConfig?.title ?? appData.pkg.name ?? "Umi-like"
            }</title>
        </head>

        <body>
            <div id="root">
            <span>loading...</span>
            </div>
            <script src="${
              isProduction ? "" : `/${DEFAULT_OUTPUT_DIR}`
            }/${DEFAULT_FRAMEWORK_NAME}.js"></script>
            ${isProduction ? "" : '<script src="/umi-like/hmr.js"></script>'}
            <script>
        </script>
        </body>
    </html>
    `;

  try {
    const htmlPath = path.resolve(appData.paths.absOutputPath, "index.html");
    fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
    fs.writeFileSync(htmlPath, html, "utf-8");
  } catch (e: any) {
    throw new Error(e);
  }
};
