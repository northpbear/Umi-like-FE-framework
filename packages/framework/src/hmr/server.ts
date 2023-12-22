import { WebSocketServer } from "ws";
import { createServer } from "http";
import express from "express";
import { DEFAULT_HMR_PORT } from "../constants";

export function hmr(expressApp: ReturnType<typeof express>) {
  const server = createServer(expressApp);

  const wss = new WebSocketServer({
    noServer: true,
  });

  server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  server.listen(DEFAULT_HMR_PORT);

  return expressApp;
}