import { Plugin } from "esbuild";
import { DevServe } from "../dev";
import { IHmrServer } from "../hmr-server";

type ILiveReloadArgs = {
  onRebuild: () => void;
};

export default function ({ onRebuild }: ILiveReloadArgs): Plugin {
  let count = 0;
  return {
    name: "liveReload",
    setup(build) {
      build.onEnd(function (result) {
        if (result.errors.length) {
          console.log(`build ended with ${result.errors.length} errors`);
          return;
        }
        if (count >= 1) {
          onRebuild();
        }
        count++;
      });
    },
  };
}

export const reloadClient = (hmrWss: IHmrServer) =>
  hmrWss.send(JSON.stringify({ type: "reload" }));

export const reloadServer = (expressApp: DevServe["expressApp"]) =>
  expressApp.emit("rebuild");
