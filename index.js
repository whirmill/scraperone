const { program } = require("commander");
const path = require("path");
const { JSDOM } = require("jsdom");
const fetch = require("isomorphic-fetch");
const fs = require("fs");
const ProgressBar = require("progress");
const dataSourcesDir = ".dataSources";
const tempDir = ".tmp";

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

      const bar = new ProgressBar("scraping [:bar] :percent :eta s*req", {
        complete: "=",
        incomplete: " ",
        width: 40,
        total: dataSource.length,
      });

      const timer = setInterval(() => {
        if (bar.complete) {
          console.log("\nscraping completed successfully\n");
          console.log("\ncheck .tmp/out.json\n");
          clearInterval(timer);
        }
      }, 100);

      const values = await Promise.all(
        dataSource.map(async (url) => {
          let res, text;
          try {
            res = await fetch(url);
            text = await res.text();
            const dom = await new JSDOM(text);
            const value = dom.window.document.querySelector(selector)
              .textContent;
            bar.tick();
            return value;
          } catch (err) {
            console.log("\n");
            console.error(`\nError: selector failed using url: ${url}`);
            return null;
          }
        })
      );

      fs.promises.writeFile(`${tempDir}/out.json`, JSON.stringify(values));
    });

  program.parse(process.argv);
}

module.exports = main;
