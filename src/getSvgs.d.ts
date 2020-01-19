import { ClientInterface, Node } from "figma-js";
import TransformerNode from "./TransformerNode";
declare type CanvasFilterFunction = (canvas: TransformerNode) => boolean;
declare type CanvasFilterParam = string | CanvasFilterFunction;
declare type NodeFilterFunction = (node: Node) => boolean;
declare type NodeFilterParam = string | NodeFilterFunction;
export declare type SvgData = {
    id: string;
    url: string;
    name: string;
};
declare type GetSvgsReturn = {
    svgs: SvgData[];
    lastModified: string;
};
export declare type GetSvgsConfig = {
    fileId: string;
    canvas?: CanvasFilterParam;
    component?: NodeFilterParam;
};
declare const _default: (client: ClientInterface) => (config: GetSvgsConfig) => Promise<GetSvgsReturn>;
export default _default;
//# sourceMappingURL=getSvgs.d.ts.map