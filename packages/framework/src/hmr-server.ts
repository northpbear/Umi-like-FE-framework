import { WebSocketServer } from "ws";
import type { Server } from "http";

export interface IHmrServer extends WebSocketServer {
  send: (message: string) => void;
}

export function hmr(server: Server) {
  const wss: IHmrServer = new WebSocketServer({
    noServer: true,
  }) as IHmrServer;

  server.on("upgrade", (req, socket, head) => {
    if (req.headers["sec-websocket-protocol"] === "hmr") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws);
      });
    }
  });

  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "connected" }));
  });

  wss.on("error", (e: Error & { code: string }) => {
    if (e.code !== "EADDRINUSE") {
      console.error(`WebSocket server error:\n${e.stack || e.message}`);
    }
  });

  wss.send = (message: string) => {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(message);
      }
    });
  };

  return wss;
}
