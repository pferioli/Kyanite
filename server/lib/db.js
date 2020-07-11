const mysql = require("mysql");
const env = require("dotenv").config();
const ConfigDB = require("../config/configdb.json")

var settings = ConfigDB.development;

if (env.NODE_ENV === 'production')
  settings = ConfigDB.production;

var connection = mysql.createConnection(settings);

connection.connect(function (error) {
  if (!!error) {
    console.log(error);
  } else {
    console.log("Connected!:)");
  }
});

exports.connection = connection;
exports.settings = settings;
