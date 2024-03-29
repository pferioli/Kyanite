/**
 * Module dependencies.
 */

const dotenv = require("dotenv").config();

var app = require("../app");
var http = require("http");
var debug = require('debug')('kyanite:server');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || "8080");
app.set("port", port);

/**
 * Create HTTP server.
 */

var httpServer = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

httpServer.listen(port);
httpServer.on("error", onError);
httpServer.on("listening", onListening);

/***
 * Enable HTTPS if running locally
 */

const WebSocketHelper = require('../helpers/websockets.helper'); var webSocket;

if (process.env.LOCAL_HTTPS_PORT) {

  var https = require("https");
  var fs = require("fs");
  var path = require("path");
  var sslOptions = {
    key: fs.readFileSync(
      path.join(__dirname, "..", "certs/server.key")
    ),
    cert: fs.readFileSync(
      path.join(__dirname, "..", "certs/server.cert")
    ),
  };

  const httpsServer = https.createServer(sslOptions, app)

  httpsServer.listen(normalizePort(process.env.LOCAL_HTTPS_PORT), function () {
    console.log(
      "server starting on https://localhost:" + process.env.LOCAL_HTTPS_PORT
    );
  });

  webSocket = new WebSocketHelper(httpsServer);

} else {
  webSocket = new WebSocketHelper(httpServer);
};

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = httpServer.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  console.log("Listening on " + bind);
}

module.exports = {
  webSocket,
  server: httpServer
};