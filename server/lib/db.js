const mysql = require("mysql");

module.exports = function (settings) {
  let connection = mysql.createConnection(settings);

  connection.connect(function (error) {
    if (!!error) {
      console.log(error);
    } else {
      console.log(`Connected to ${settings.database} db:)`);
    }
  });

  exports.connection;
};
