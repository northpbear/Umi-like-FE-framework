import express from "express";

export const dev = async () => {
  const app = express();

  app.listen(8888, async () => {
    console.log(`App listening at http://localhost:8888`);
  });
};
