const mysql = require("mysql");
const winston = require('../helpers/winston.helper');

let db_settings = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
};

if (process.env.NODE_ENV === "production") {
  db_settings.socketPath = (process.env.DB_SOCKET_PATH || "/cloudsql") + '/' + process.env.INSTANCE_CONNECTION_NAME;
}
var connection = mysql.createConnection(db_settings);

connection.connect(function (error) {
  if (!!error) {
    console.log(error);
  } else {
    winston.info(`Connected to ${db_settings.database} db:)`);
  }
});

module.exports.connection = connection;
module.exports.settings = db_settings;