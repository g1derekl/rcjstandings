var http = require("http")
, cheerio = require("cheerio")
, DAYS = 122
, players = {"73516": {"league": 11345, "fgm": 0, "fga": 0}, "73630": {"league": 11345, "fgm": 0, "fga": 0}, "73493": {"league": 11346, "fgm": 0, "fga": 0}, "73618": {"league": 11346, "fgm": 0, "fga": 0}}; // For test purposes only; will load from database when ready

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
};

/* Given HTML data of a team, parse field goal percentages */
var parseShooting = function(team, data) {
  var $ = cheerio.load(data);
  
  players[team]["team"] = $("#top-bar .breadcrumb .active h1").text();
  players[team]["user"] = $(".user-name").text();
  
  var fgmTotal = 0, fgaTotal = 0;
  for (var row=0; row < 10; row++) {
    var fg = $("#row_0_0_" + row + " td").eq(16).text().split("-");
    var fgm = parseInt(fg[0]);
    var fga = parseInt(fg[1]);
    if (fgm >= 0) {
      players[team]["fgm"] += fgm;
      fgmTotal += fgm;
      players[team]["fga"] += fga;
      fgaTotal += fga;
    }
  }
};

/* Get field goal percentages from all teams in league */
var getFGData = function(callback) {
  var numRunningQueries = 0;
  
  Object.keys(players).forEach(function(playerID) {  
    for (var day=1; day <= DAYS; day++) {
      numRunningQueries++;
      var url = "http://www.fleaflicker.com/nba/team?leagueId=" + players[playerID]["league"] + "&teamId=" + playerID.toString() + "&week=" + day.toString() + "&statType=2";
      
      download(url, function(data) {
        parseShooting(playerID, data);
        players[playerID]["fg%"] = players[playerID]["fgm"] / players[playerID]["fga"];
        
        numRunningQueries--;
        if (numRunningQueries == 0) {
          callback(players);
        }
      });
    }
  });
};

var compileStats = function(callback) {
  
};

module.exports.getFGData = getFGData;