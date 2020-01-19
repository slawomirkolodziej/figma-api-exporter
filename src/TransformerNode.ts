import { Node } from "figma-js";
import { Shortcut } from "figma-transformer";

type TransformerNode = Node & {
  shortcuts: Record<Shortcut, Node[]>;
};

export default TransformerNode;
