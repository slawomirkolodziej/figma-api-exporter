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

## API
### getSvgs
Function which fetches urls of component exports as svgs.

Arguments:
- fileId (required) (string) - id of figma files you want to extract svgs from
- canvas (optional) (string|function) - filter exported components by Page name, you can use a custom filter function with additional information about page
- component (optional) (string|function) - filter by exported components by Component name, you can use a custom filter function with additional information about component

### downloadSvgs
Function which downloads svg files to your directory. It checks Figma File modification date and component ids to find out if your local copy is up to date before downloading everything. You can replace this function with your own script.

Arguments:
- saveDirectory (required) (string) - path to save svg files
- svgsData (required) (array) - '.svgs' values returned from `.getSvgs()`
- lastModified (required) (string) - `.lastModified` value returned from `.getSvgs()`, used to check if Figma file was modified and it should continue downloading
- clearDirectory (optional) (boolean) (defaults to: `false`) - change to `true` if you want to clear the `saveDirectory` before downloading files, it comes handy when you want to delete old icons, which don't exist in Figma anymore
