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

  // Defaults to 100.
  batchSize?: number;
};

const filterByCanvas = (canvasFilter: CanvasFilterParam) => (
  data: ProcessedFile
): TransformerNode[] | undefined => {
  const pages = data.shortcuts
    .pages as TransformerNode[];
  if (typeof canvasFilter === "string") {
    return filter((canvas: TransformerNode) => canvas.name === canvasFilter)(
      pages
    );
  }
  return filter(canvasFilter)(pages);
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
  chain((node: TransformerNode) => node.shortcuts.components)(transformerNode);

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
  const batchSize = config.batchSize || 100;

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
  const batchCount = Math.ceil(svgsIds.length / batchSize);
  const promises = Array.from(Array(batchCount), (_, i) => client.fileImages(config.fileId, {
    format: "svg",
    ids: svgsIds.slice(i * batchSize, (i + 1) * batchSize)
  }))

  const svgsData = (await Promise.all(promises)).flatMap((response, index) => {
    const svgUrls = response.data.images;
    return map(getSvgDataFromImageData(svgUrls))(componentsData.slice(index * batchSize, (index + 1) * batchSize))
  })

  return { svgs: svgsData, lastModified: fileLastModified };
};
