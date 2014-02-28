var http = require("http")
  , cheerio = require("cheerio")
  , fs = require("fs")
  , DAYS = 1
  , players = JSON.parse(fs.readFileSync("teams.json"))
  , leagues = Object.keys(JSON.parse(fs.readFileSync("leagues.json")));

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
  
  for (var row=0; row < 10; row++) {
    var fg = $("#row_0_0_" + row + " td").eq(16).text().split("-");
    var fgm = parseInt(fg[0]);
    var fga = parseInt(fg[1]);
    if (fgm >= 0) {
      players[team]["fgm"] += fgm;
      players[team]["fga"] += fga;
    }
  }
};

/* Take league page data and return stats for each player */
var teamStats = function(data) {
  var $ = cheerio.load(data);
  
  var numTeams = $(".cell-row").length;
  
  for (var row=0; row < numTeams; row++) {
    var teamID = $("#row_0_0_" + row + " .league-name a").attr("href").substring(32, 37);
    players[teamID]["ft%"] = $("#row_0_0_" + row + " td").eq(7).text();
    players[teamID]["3pt"] = $("#row_0_0_" + row + " td").eq(10).text().replace(/\,/g,'');
    players[teamID]["reb"] = $("#row_0_0_" + row + " td").eq(13).text().replace(/\,/g,'');
    players[teamID]["stl"] = $("#row_0_0_" + row + " td").eq(16).text().replace(/\,/g,'');
    players[teamID]["blk"] = $("#row_0_0_" + row + " td").eq(19).text().replace(/\,/g,'');
    players[teamID]["ast"] = $("#row_0_0_" + row + " td").eq(22).text().replace(/\,/g,'');
    players[teamID]["tov"] = $("#row_0_0_" + row + " td").eq(25).text().replace(/\,/g,'');
    players[teamID]["pts"] = $("#row_0_0_" + row + " td").eq(28).text().replace(/\,/g,'');
    
    console.log(players[teamID]);
  }
}

/* Get field goal percentages from all teams in league */
var getFGData = function(callback) {
  var numRunningQueries = 0;
  
  Object.keys(players).forEach(function(playerID) {
    console.log(playerID);
    for (var day=1; day <= DAYS; day++) {
      numRunningQueries++;
      var url = "http://www.fleaflicker.com/nba/team?leagueId=" + players[playerID]["leagueID"] + "&teamId=" + playerID.toString() + "&week=" + day.toString() + "&statType=2";
      
      download(url, function(data) {
        parseShooting(playerID, data);
        players[playerID]["fg%"] = players[playerID]["fgm"] / players[playerID]["fga"];
        
        numRunningQueries--;
        if (numRunningQueries == 0) {
          callback();
        }
      });
    }
  });
};

var compileStats = function(callback) {
  var numRunningQueries = 0;
  
  getFGData(function() {
    for (var leagueID=0; leagueID < leagues.length; leagueID++) {
      numRunningQueries++;
      var url = "http://www.fleaflicker.com/nba/league?leagueId=" + leagues[leagueID];
      
      download(url, function(data) {
        teamStats(data);
        
        numRunningQueries--;
        if (numRunningQueries == 0) {
          callback(players);
        }
      });
    }
  });
};

module.exports.compileStats = compileStats;