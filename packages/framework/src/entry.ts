import fs from "node:fs";
import path from "node:path";
import { IAppData } from "./appData";
import { IRoute } from "./routes";

let count = 1;
function getRouteJsx(routes?: IRoute[]): { jsx: string; imports: string } {
  if (!routes?.length)
    return {
      jsx: "",
      imports: "",
    };

  let imports = "";
  const jsx = routes
    .map((route) => {
      const { jsx: subJsx, imports: subImports } = getRouteJsx(route.routes);
      imports += subImports;
      imports += `import Element${count} from "${route.element}";\n`;
      return `
        <Route path=${JSON.stringify(
          route.path
        )} element={<Element${count++} />}>
        ${subJsx}
        </Route>
        `;
    })
    .join("");
  return {
    jsx,
    imports,
  };
}

interface IGenerateEntryPatams {
  appData: IAppData;
  routes: IRoute[];
}
export const generateEntry = async ({
  appData,
  routes,
}: IGenerateEntryPatams) => {
  const { imports, jsx } = getRouteJsx(routes);
  const entryCode = `
  import React from "react";
  import ReactDOM from "react-dom/client";
  import { HashRouter, Route, Routes } from "react-router-dom";
  ${imports}
  
  const App = () => {
    return (
      <>
        <HashRouter>
          <Routes>
          ${jsx}
          </Routes>
        </HashRouter>
      </>
    );
  };
  
  const root = ReactDOM.createRoot(document.getElementById("root")!);
  root.render(React.createElement(App));
  
  `;

  try {
    fs.mkdirSync(path.dirname(appData.paths.absEntrypointPath), {
      recursive: true,
    });
    fs.writeFileSync(appData.paths.absEntrypointPath, entryCode, "utf-8");
  } catch (e: any) {
    throw new Error(e);
  }
};
