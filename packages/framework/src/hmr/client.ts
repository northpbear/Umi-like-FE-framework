function getSocketHost() {
  const url: any = location;
  const host = url.host;
  const isHttps = url.protocol === "https:";
  return `${isHttps ? "wss" : "ws"}://${host}`;
}

function clint() {
  if ("WebSocket" in window) {
    const socket = new window.WebSocket(getSocketHost(), "hmr");
    let pingTimer: NodeJS.Timeout | null = null;

    socket.addEventListener("message", async ({ data: _data }) => {
      const data = JSON.parse(_data);

      switch (data.Type) {
        case "reload":
          window.location.reload();
          break;
        case "connected":
          console.log(`[Umi-like] connected.`);

          pingTimer = setInterval(() => {
            socket.send("ping");
          }, 30 * 1000);
          break;
        default:
          break;
      }
    });
  }
}

clint();
