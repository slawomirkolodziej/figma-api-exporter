# Figma API Exporter

Allows you to export assets from Figma files automatically and use it in your project.

## Features:
- download all components as SVGs from Figma file or Frame

## Examples

```js
const figmaApiExporter = require('figma-api-exporter').default;

const exporter = figmaApiExporter(YOUR_FIGMA_API_TOKEN);

exporter
  .getSvgs({
    fileId: YOUR_FIGMA_FILE_ID,
    canvas: 'Icons',
  })
  .then(svgsData =>
    exporter.downloadSvgs({
      saveDirectory: './svgsFiles',
      svgsData: svgsData.svgs,
      lastModified: svgsData.lastModified,
    })
  );
```