import * as Figma from "figma-js";

import getSvgs from "./getSvgs";
import downloadSvgs from "./downloadSvgs";

export default (token: string) => {
  const client = Figma.Client({
    personalAccessToken: token
  });

  return {
    getSvgs: getSvgs(client),
    downloadSvgs
  };
};
