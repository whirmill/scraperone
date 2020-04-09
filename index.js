const { program } = require("commander");
const path = require("path");
const { JSDOM } = require("jsdom");
const fetch = require("isomorphic-fetch");
const fs = require("fs");
const ProgressBar = require("progress");
const winston = require("winston");

const dataSourcesDir = ".dataSources";
const tempDir = ".tmp";
const outFile = "out.csv";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "user-service" },
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({
      filename: `${tempDir}/error.log`,
      level: "error",
    }),
    new winston.transports.File({ filename: `${tempDir}/combined.log` }),
  ],
});

async function main() {
  const appConfText = await fs.promises.readFile("package.json", {
    encoding: "utf8",
  });

  const appConf = JSON.parse(appConfText);

  program
    .version(appConf.version)
    .arguments("<data-source>")
    .arguments("<selector>")
    .action(async (dsPath, selector) => {
      try {
        await fs.promises.stat(tempDir);
      } catch (err) {
        await fs.promises.mkdir(tempDir);
      }

      let dataSourceText = await fs.promises.readFile(path.resolve(dsPath), {
        encoding: "utf8",
      });

      if (dsPath.endsWith(".csv")) {
        dataSourceText = `[${dataSourceText.replace(/^(.+),?$/gm, '"$1",')}]`;
        dataSourceText = dataSourceText.replace(/,\]/, "]");
      }

      const dataSource = JSON.parse(dataSourceText);

      const bar = new ProgressBar("scraping [:bar] :percent :eta ms*req", {
        complete: "=",
        incomplete: " ",
        width: 40,
        total: dataSource.length,
      });

      fs.promises.writeFile(`${tempDir}/${outFile}`, "url, value\n");

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
            const value = dom.window.document.querySelector(selector)
              .textContent;

            fs.promises.appendFile(
              `${tempDir}/${outFile}`,
              `${url},${value}\n`
            );

            return value;
          } catch (err) {
            logger.error(`selector failed using url: ${url}`);
            fs.promises.appendFile(`${tempDir}/${outFile}`, `${url},${null}\n`);
            return null;
          } finally {
            bar.tick();
          }
        })
      );
    });

  program.parse(process.argv);
}

module.exports = main;
