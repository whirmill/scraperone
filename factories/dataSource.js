const fs = require("fs");
const path = require("path");

/**
 * Data source factory
 * @param {String} dataSourcePath
 * @async
 */
async function createDataSource(dataSourcePath) {
  let dataSourceText = await fs.promises.readFile(
    path.resolve(dataSourcePath),
    {
      encoding: "utf8",
    }
  );

  if (dataSourcePath.endsWith(".csv")) {
    dataSourceText = `[${dataSourceText.replace(/^(.+),?$/gm, '"$1",')}]`;
    dataSourceText = dataSourceText.replace(/,\]/, "]");
  }

  const dataSource = JSON.parse(dataSourceText);
  return dataSource;
}

module.exports = createDataSource;
