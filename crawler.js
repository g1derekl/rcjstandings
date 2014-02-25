var http = require("http")
, cheerio = require("cheerio")
, src = "http://www.fleaflicker.com/nba/league?leagueId=11345";

var download = function(url, callback) {
  http.get(url, function(res) {
    var data = "";
    res.on("data", function (chunk) {
      data += chunk;
    });
    res.on("end", function() {
      callback(data);
    });
  }).on("error", function() {
    callback(null);
  });
}

var parsePlayers = function(league) {
  
}

var parseShooting = function(data) {
  var $ = cheerio.load(data);
  var stats = {};
  
  stats["fgm"] = parseInt($("#row_0_0_10 td").eq(16).text().split("-")[0]);
  stats["fga"] = parseInt($("#row_0_0_10 td").eq(16).text().split("-")[1]);
  stats["fg%"] = stats["fgm"] / stats["fga"];
  
  console.log(JSON.stringify(stats));
  return stats;
}

var getData = function(callback) {
  players = [];
  download(src, function(league) {
    
  });
}

module.exports.getData = getData;