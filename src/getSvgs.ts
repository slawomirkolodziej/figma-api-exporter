import { ClientInterface, Node } from "figma-js";
import { processFile, ProcessedFile } from "figma-transformer";
import { pipe, filter, identity, map, prop, chain, isEmpty } from "ramda";
import TransformerNode from "./TransformerNode";

type CanvasFilterFunction = (canvas: TransformerNode) => boolean;
type CanvasFilterParam = string | CanvasFilterFunction;
type NodeFilterFunction = (node: Node) => boolean;
type NodeFilterParam = string | NodeFilterFunction;

export type SvgData = {
  id: string;
  url: string;
  name: string;
};

type GetSvgsReturn = {
  svgs: SvgData[];
  lastModified: string;
};

export type GetSvgsConfig = {
  fileId: string;
  canvas?: CanvasFilterParam;
  component?: NodeFilterParam;
};

const filterByCanvas = (canvasFilter: CanvasFilterParam) => (
  data: ProcessedFile
): TransformerNode[] | undefined => {
  const canvasList: TransformerNode[] = data.shortcuts
    .CANVAS as TransformerNode[];
  if (typeof canvasFilter === "string") {
    return filter((canvas: TransformerNode) => canvas.name === canvasFilter)(
      canvasList
    );
  }
  return filter(canvasFilter)(canvasList);
};

const filterByNode = (nodeFilter: NodeFilterParam) => (
  data: Node[]
): Node[] | undefined => {
  if (typeof nodeFilter === "string") {
    return filter((node: Node) => node.name === nodeFilter)(data);
  }
  return filter(nodeFilter)(data);
};

const getComponents = (transformerNode: TransformerNode[]) =>
  chain((node: TransformerNode) => node.shortcuts.COMPONENT)(transformerNode);

const getSvgDataFromImageData = (svgsUrls: Record<string, string>) => (
  node: TransformerNode
): SvgData => {
  return { id: node.id, url: svgsUrls[node.id], name: node.name };
};

export default (client: ClientInterface) => async (
  config: GetSvgsConfig
): Promise<GetSvgsReturn> => {
  const fileData = await client.file(config.fileId);
  const processedFile = processFile(fileData.data, config.fileId);
  const fileLastModified = fileData.data.lastModified;

  const optionallyFilterByCanvas = (config.canvas
    ? filterByCanvas(config.canvas)
    : identity) as (data: ProcessedFile) => TransformerNode[];

  const optionallyFilterByComponent = (config.component
    ? filterByNode(config.component)
    : identity) as (data: Node[]) => Node[];

  const componentsData = pipe(
    optionallyFilterByCanvas,
    getComponents,
    optionallyFilterByComponent
  )(processedFile) as TransformerNode[];

  if (isEmpty(componentsData)) {
    return { svgs: [], lastModified: fileLastModified };
  }

  const svgsIds = map(prop("id"))(componentsData);

  const svgsExportResponse = await client.fileImages(config.fileId, {
    format: "svg",
    ids: svgsIds
  });

  const svgsUrls = svgsExportResponse.data.images;

  const svgsData = map(getSvgDataFromImageData(svgsUrls))(componentsData);

  return { svgs: svgsData, lastModified: fileLastModified };
};
