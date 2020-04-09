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

      const dataSourceText = await fs.promises.readFile(path.resolve(dsPath), {
        encoding: "utf8",
      });

      const fullDatasource = JSON.parse(dataSourceText);

      const dataSource = [
        fullDatasource[0],
        fullDatasource[1],
        fullDatasource[2],
        fullDatasource[3],
      ];

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

      const emails = await Promise.all(
        dataSource.map(async (url) => {
          let res, text;
          try {
            res = await fetch(url);
            text = await res.text();
            const dom = await new JSDOM(text);
            const email = dom.window.document.querySelector(selector)
              .textContent;
            bar.tick();
            return email;
          } catch (err) {
            console.log("\n");
            console.error(`\nError: email not found using url: ${url}`);
            return null;
          }
        })
      );

      fs.promises.writeFile(`${tempDir}/out.json`, JSON.stringify(emails));
    });

  program.parse(process.argv);
}

module.exports = main;
