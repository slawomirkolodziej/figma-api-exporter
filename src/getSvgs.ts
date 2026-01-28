import FigmaClient, { Node } from "./figmaClient";

type CanvasFilterParam = string | ((canvas: Node) => boolean);
type NodeFilterParam = string | ((node: Node) => boolean);

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

const canvasFilter = (canvasFilter?: CanvasFilterParam) => (canvas: Node): boolean => {
  if (!canvasFilter) return true

  if (typeof canvasFilter === "string") {
    return canvas.name === canvasFilter;
  }
  return canvasFilter(canvas);
};

const nodeFilter = (nodeFilter?: NodeFilterParam) => (node: Node): boolean => {
  if (!nodeFilter) return true

  if (typeof nodeFilter === "string") {
    return node.name === nodeFilter;
  }
  return nodeFilter(node);
};

function* walkNodes(root: Node, config: GetSvgsConfig) {
  const frontier: Node[] = [root]
  const includeCanvas = canvasFilter(config.canvas)
  const includeNode = nodeFilter(config.component)
  while (frontier.length) {
    const node = frontier.pop()!

    if (node?.type === 'CANVAS') {
      if (!includeCanvas(node)) continue;
    }

    if (!includeNode(node)) continue;

    if ('children' in node) {
      frontier.push(...node.children ?? []);
    }

    if (node.type === 'COMPONENT')
      yield node
  }
}

const getSvgDataFromImageData = (svgsUrls: Record<string, string>) => (
  node: Node
): SvgData => {
  return { id: node.id, url: svgsUrls[node.id], name: node.name };
};

export default (client: FigmaClient) => async (
  config: GetSvgsConfig
): Promise<GetSvgsReturn> => {
  const fileData = await client.file(config.fileId);

  const components = Array.from(walkNodes(fileData.document, config))

  const fileLastModified = fileData.lastModified;
  const batchSize = config.batchSize || 100;

  if (!components.length) {
    return { svgs: [], lastModified: fileLastModified };
  }

  const svgsIds = components.map(c => c.id)
  const batchCount = Math.ceil(svgsIds.length / batchSize);

  const svgsData: SvgData[] = [];
  for (let i = 0; i < batchCount; i++) {
    const data = await client.fileImages(config.fileId, {
      format: "svg",
      ids: svgsIds.slice(i * batchSize, (i + 1) * batchSize)
    })

    svgsData.push(...components.slice(i * batchSize, (i + 1) * batchSize).map(getSvgDataFromImageData(data.images)))
  }

  return { svgs: svgsData, lastModified: fileLastModified };
};
