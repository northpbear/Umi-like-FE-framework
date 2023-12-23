import { Plugin } from "esbuild";
import { IHmrServer } from "../hmr-server";

type ILiveReloadArgs = {
  hmrWss: IHmrServer;
};

export default function ({ hmrWss }: ILiveReloadArgs): Plugin {
  return {
    name: "liveReload",
    setup(build) {
      build.onEnd(function (result) {
        if (result.errors.length) {
          console.log(`build ended with ${result.errors.length} errors`);
          return;
        }
        hmrWss.send(JSON.stringify({ type: "reload" }));
      });
    },
  };
}
