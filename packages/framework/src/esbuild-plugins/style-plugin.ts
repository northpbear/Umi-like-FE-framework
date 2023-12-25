import { Plugin, build } from "esbuild";
import path from "node:path";

export default function (): Plugin {
  return {
    name: "style-plugin",
    setup({ onResolve, onLoad }) {
      // 解析到css时，添加一个namespace，让后续load时可以进行特殊处理，将css注入到页面中
      onResolve({ filter: /\.css$/, namespace: "file" }, (args) => {
        const cwd = process.cwd();
        const absPath = path.resolve(
          cwd,
          path.relative(cwd, args.resolveDir),
          args.path
        );
        return {
          path: absPath,
          namespace: "style-temp",
        };
      });

      // 加载css文件时，将css注入到页面中，其中injectStyle为自定义的注入函数，实际并不存在__umi_like_style_helper__文件路径
      // esbuild在编译时，会解析__umi_like_style_helper__，重新走onResolve流程
      // 先解析import { injectStyle } from "__umi_like_style_helper__";再解析import style from "${args.path}";
      onLoad({ filter: /\.*/, namespace: "style-temp" }, async (args) => {
        return {
          contents: `
                import { injectStyle } from "__umi_like_style_helper__";
                import style from "${args.path}";
                injectStyle(style);
            `,
        };
      });

      // 对上一个onLoad的返回的contents进行处理：

      // 1. 把__umi_like_style_helper__标记为style-helper，和css文件进行区分
      onResolve(
        { filter: /^__umi_like_style_helper__$/, namespace: "style-temp" },
        (args) => {
          return {
            path: args.path,
            namespace: "style-helper",
            sideEffects: false,
          };
        }
      );

      // 2. 生成虚拟的injectStyle函数，当解析到__umi_like_style_helper__时，返回该函数
      onLoad({ filter: /\.*/, namespace: "style-helper" }, async (args) => {
        return {
          contents: `
                export function injectStyle(style) {
                    if (typeof document !== 'undefined') {
                        const styleElement = document.createElement('style');
                        const styleText = document.createTextNode(style);
                        styleElement.appendChild(styleText);
                        document.head.appendChild(styleElement);
                    }
                }
            `,
        };
      });

      // 3. 解析到import style from "${args.path}"，修改一下namespace
      onResolve({ filter: /\.css$/, namespace: "style-temp" }, (args) => {
        return {
          path: args.path,
          namespace: "style-text",
        };
      });

      // 4. 解析上一步生成的css，打包并以字符形式返回，使import style from "${args.path}"时可以加载到css里的内容
      onLoad({ filter: /\.*/, namespace: "style-text" }, async (args) => {
        const { errors, warnings, outputFiles } = await build({
          entryPoints: [args.path],
          logLevel: "silent",
          bundle: true,
          write: false,
          charset: "utf8",
          minify: true,
          loader: {
            ".svg": "dataurl",
            ".ttf": "dataurl",
          },
        });
        return {
          errors,
          warnings,
          contents: outputFiles![0].text,
          loader: "text",
        };
      });
    },
  };
}
