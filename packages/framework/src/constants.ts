export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_PORT = 8888;
export const DEFAULT_BUILD_PORT = 8889;
export const DEFAULT_OUTPUT_DIR = "www";
export const DEFAULT_ENTRY_POINT = "src/index.tsx";

export const htmlTemplate = (port: number) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Umi-like</title>
  </head>

  <body>
    <div id="root">
      <span>loading...</span>
    </div>
    <script src="/${DEFAULT_OUTPUT_DIR}/index.js"></script>
    <script src="/umi-like/hmr.js"></script>
    <script>
  </script>
  </body>
</html>
`;
