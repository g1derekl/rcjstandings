var http = require("http")
, cheerio = require("cheerio")
, src = ["http://www.fleaflicker.com/nba/team?leagueId=11345&teamId=73630"
       , "http://www.fleaflicker.com/nba/team?leagueId=11345&teamId=73516"
       , "http://www.fleaflicker.com/nba/team?leagueId=11345&teamId=73667"
       , "http://www.fleaflicker.com/nba/team?leagueId=11345&teamId=73676"
       , "http://www.fleaflicker.com/nba/team?leagueId=11345&teamId=73660"
       , "http://www.fleaflicker.com/nba/team?leagueId=11345&teamId=72898"]; // For test purposes only; will load from database when ready

/* Download HTML from web page at URL */
var download = function(url, callback) {
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
}

/* Given HTML data of a player, parse field goal percentages */
var parseShooting = function(data) {
  var $ = cheerio.load(data);
  var stats = {};
  
  stats["fgm"] = parseInt($("#row_0_0_10 td").eq(16).text().split("-")[0]);
  stats["fga"] = parseInt($("#row_0_0_10 td").eq(16).text().split("-")[1]);
  stats["fg%"] = stats["fgm"] / stats["fga"];
  
  return stats;
}

/* Get field goal percentages from all players in league */
var getData = function(callback) {
  var numRunningQueries = 0;
  var shootingStats = [];
  
  src.forEach(function(player) {
    numRunningQueries++;
    
    download(player, function(data) {
      shootingStats.push(parseShooting(data));
      numRunningQueries--;
      
      if (numRunningQueries == 0) {
       callback(shootingStats);
      }
    });
  });
}

module.exports.getData = getData;