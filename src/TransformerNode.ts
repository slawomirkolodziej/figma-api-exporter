import { Node } from "figma-js";
import { Shortcuts } from "figma-transformer";

type TransformerNode = Node & {
  shortcuts: Shortcuts;
};

export default TransformerNode;
