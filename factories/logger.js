const winston = require("winston");

function createLogger(service = "user-service") {
  return winston.createLogger({
    level: "info",
    format: winston.format.json(),
    defaultMeta: { service },
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log`
      // - Write all logs error (and below) to `error.log`.
      //
      new winston.transports.File({
        filename: `logs/error.log`,
        level: "error",
      }),
      new winston.transports.File({ filename: `logs/combined.log` }),
    ],
  });
}

module.exports = createLogger;
