import express from "express";
import { DEFAULT_PORT, htmlTemplate } from "./constants";

export const dev = async () => {
  const app = express();

  app.get("/", (_, res) => {
    // see https://expressjs.com/en/api.html#res.set
    res.set("Content-Type", "text/html");
    res.send(htmlTemplate);
  });

  app.listen(DEFAULT_PORT, async () => {
    console.log(`Umi-like start at http://localhost:8888`);
  });
};
