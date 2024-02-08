const winston = require('winston');

const fileNamePrefix = (date) => {
  const dateToArray = date.toString().split(' ');
  const resultArray = [];

  Array.prototype.forEach.call(dateToArray, (child) => {
    if (dateToArray.indexOf(child) < 4) {
      resultArray.push(child);
    }
  });

  return resultArray.join('-');
};

// define the custom settings for each transport (file, console)
const options = {
  file: {
    level: 'info',
    filename: `${appRoot}/logs/${fileNamePrefix(new Date())}.log`,
    handleExceptions: true,
    json: true,
    maxsize: 20971520, // 20MB
    maxFiles: 10,
    colorize: false,
  },
  console: {
    name: 'console.info',
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

// instantiate a new Winston Logger with the settings defined above
const logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console),
  ],
  exitOnError: false, // do not exit on handled exceptions
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: (message) => {
    // use the 'info' log level so the output will be picked up by both transports
    logger.info(message);
  },
};

module.exports = logger;