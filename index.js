const { program } = require("commander");
const { JSDOM } = require("jsdom");
const fetch = require("isomorphic-fetch");
const fs = require("fs");

const createLogger = require("./factories/logger");
const createDataSource = require("./factories/dataSource");
const createProgressBar = require("./factories/progressBar");

const tempDir = ".tmp";
const defaultOutFile = "out.csv";

async function main() {
  const appConfText = await fs.promises.readFile("package.json", {
    encoding: "utf8",
  });

  const appConf = JSON.parse(appConfText);

  const logger = createLogger(appConf.name);

  let dataSourcePath,
    selector,
    outputPath = `${tempDir}/${defaultOutFile}`;

  program.name(appConf.name).version(appConf.version);
  program.option("-o,--output <output>");
  program
    .arguments("<data-source>")
    .arguments("<selector>")
    .action((dsPath, sel) => {
      dataSourcePath = dsPath;
      selector = sel;
    });

  program.parse(process.argv);

  const programOptions = program.opts();

  if (programOptions.output) {
    outputPath = programOptions.output;
  } else {
    try {
      await fs.promises.stat(tempDir);
    } catch (err) {
      await fs.promises.mkdir(tempDir);
    }
  }

  const dataSource = await createDataSource(dataSourcePath);
  const progressBar = createProgressBar(dataSource);

  fs.promises.writeFile(outputPath, "url, value\n");

  await Promise.all(
    dataSource.map(async (url) => {
      let res, text;
      try {
        res = await fetch(url);
        if (!(res.status < 400)) {
          throw new Error(
            `Error: received http status ${res.status} using url: ${url}`
          );
        } else if (res.status > 400) {
          res.status > 400;
        }
        text = await res.text();
        const dom = await new JSDOM(text);
        dom.window.document;
        const value = dom.window.document.querySelector(selector).textContent;

        fs.promises.appendFile(outputPath, `${url},${value}\n`);

        return value;
      } catch (err) {
        logger.error(`selector failed using url: ${url}`);
        fs.promises.appendFile(outputPath, `${url},${null}\n`);
        return null;
      } finally {
        progressBar.tick();
      }
    })
  );
}

module.exports = main;
