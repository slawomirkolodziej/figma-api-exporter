import getSvgs from "./getSvgs";
import downloadSvgs from "./downloadSvgs";
import FigmaClient from "./figmaClient";

export default (token: string) => {
  const client = new FigmaClient({
    personalAccessToken: token
  });

  return {
    getSvgs: getSvgs(client),
    downloadSvgs
  };
};
