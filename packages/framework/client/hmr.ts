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
      console.log("data:: ", data);

      switch (data.type) {
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

    socket.addEventListener("close", async () => {
      if (pingTimer) {
        clearTimeout(pingTimer);
      }
      console.log("Dev server disconnected. Polling for restart...");
      await waitSuccessfulPing();
      window.location.reload();
    });
  }
}

async function waitSuccessfulPing(ms = 5000) {
  while (true) {
    try {
      await fetch("/ping");
      break;
    } catch (e) {
      await new Promise((res) => setTimeout(res, ms));
    }
  }
}

clint();
