var http = require("http")
  , cheerio = require("cheerio")
  , fs = require("fs");

var leagues = JSON.parse(fs.readFileSync("leagues.json"));

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

/* Build the data set of teams */
var buildTeamList = function(callback) {
  var numRunningQueries = 0;
  var teams = {};
  
  Object.keys(leagues).forEach(function(leagueID) {
    numRunningQueries++;
    var url = "http://www.fleaflicker.com/nba/league?leagueId=" + leagueID;
    
    download(url, function(data) {
      var $ = cheerio.load(data);
      var numTeams = $(".cell-row").length;
      
      for (var row=0; row < numTeams; row++) {
        var teamID = $("#row_0_0_" + row + " .league-name a").attr("href").substring(32, 37);
        teams[teamID] = {"leagueID": leagueID, "league": leagues[leagueID], "fgm": 0, "fga": 0};
      }
      
      numRunningQueries--;
      if (numRunningQueries == 0) {
        fs.writeFile("teams.json", JSON.stringify(teams), function() {callback("Update successful")});
      }
    });
  });
};

module.exports.buildTeamList = buildTeamList;