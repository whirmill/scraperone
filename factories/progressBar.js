const ProgressBar = require("progress");
function createProgressBar(dataSource) {
  return new ProgressBar("scraping [:bar] :percent :eta ms*req", {
    complete: "=",
    incomplete: " ",
    width: 40,
    total: dataSource.length,
  });
}

module.exports = createProgressBar;
