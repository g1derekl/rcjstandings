var http = require("http")
  , cheerio = require("cheerio")
  , fs = require("fs")
  , mysql = require("mysql")
  , connection = mysql.createConnection({
      host     : "mysql://$OPENSHIFT_MYSQL_DB_HOST:$OPENSHIFT_MYSQL_DB_PORT/"
    , user     : "adminJbRPBbW"
    , password : "C-ppKyw1_N_p"
    , database : "rcjstandings"
    });

connection.connect();

/* Download HTML from web page at URL */
module.exports.download = function(url, callback) {
  http.get(url, function(response) {
    var data = "";
    response.on("data", function (chunk) {
      data += chunk;
    });
    response.on("end", function() {
      callback(data);
    });
  }).on("error", function() {
    callback(null);
  });
};

/* Run MySQL query and callback with results */
module.exports.query = function(statement, callback) {
  connection.query(statement, function(error, rows, columns) {
    callback(error, rows, columns);
  });
}

/* Prepare SQL statements then execute and callback */
module.exports.preparedStatement = function(statement, insert, callback) {
  var prepared = mysql.format(statement, insert);
  connection.query(prepared, function(error, rows, columns) {
    callback(error, rows, columns);
  });
}

/* Close the mySQL connection */
module.exports.closeConnection = function(callback) {
  connection.end(function(error) {
    if (error) {
      callback(error);
    }
    else {
      callback();
    }
  });
};