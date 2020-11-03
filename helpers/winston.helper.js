var winston = require('winston');

// Create a Winston logger that streams to Stackdriver Logging.
const { LoggingWinston } = require("@google-cloud/logging-winston");

const loggingWinston = new LoggingWinston({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

// instantiate a new Winston Logger with the settings defined above

var logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.Console(), loggingWinston,
    ],
    exitOnError: false, // do not exit on handled exceptions
});

module.exports = logger;