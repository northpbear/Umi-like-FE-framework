import fs from "node:fs";
import path from "node:path";
import { IAppData } from "./appData";
import { DEFAULT_FRAMEWORK_NAME, DEFAULT_OUTPUT_DIR } from "./constants";

interface IGenerateHtmlParams {
  appData: IAppData;
}

export const generateHtml = async ({ appData }: IGenerateHtmlParams) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <title>${appData.pkg.name}</title>
        </head>

        <body>
            <div id="root">
            <span>loading...</span>
            </div>
            <script src="/${DEFAULT_OUTPUT_DIR}/${DEFAULT_FRAMEWORK_NAME}.js"></script>
            <script src="/umi-like/hmr.js"></script>
            <script>
        </script>
        </body>
    </html>
    `;

  try {
    const htmlPath = path.resolve(appData.paths.absOutputPath, "index.html");
    fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
    fs.writeFileSync(htmlPath, html, "utf-8");
  } catch (e) {
    throw new Error(e);
  }
};