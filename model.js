var http = require("http")
  , cheerio = require("cheerio")
  , fs = require("fs")
  , leagues = JSON.parse(fs.readFileSync("leagues.json"))
  , mysql = require("mysql")
  , connection = mysql.createConnection({
      host     : "localhost"
    , user     : "user"
    , password : "998544151"
    , database : "rcjstandings_fg"
    });

connection.connect();

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
  var prepareLeagues = "INSERT INTO leagues (league_id, league_name) VALUES (?, ?)"
    + "ON DUPLICATE KEY UPDATE league_id = ?, league_name = ?";
  var prepareTeams = "INSERT INTO teams (team_id, team_name, player_name, league_id) VALUES (?, ?, ?, ?)"
    + "ON DUPLICATE KEY UPDATE team_name = ?, player_name = ?";
  // NOTE: important to update when duplicate key in case league and/or team changes names or is taken over by another user
  
  Object.keys(leagues).forEach(function(leagueID) {
    var insertLeagues = [leagueID, leagues[leagueID], leagueID, leagues[leagueID]];
    var preparedLeagues = mysql.format(prepareLeagues, insertLeagues);
    connection.query(preparedLeagues, function(error) {
      if (error) console.log(error);
    });
    
    numRunningQueries++;
    var url = "http://www.fleaflicker.com/nba/league?leagueId=" + leagueID;
    
    download(url, function(data) {
      var $ = cheerio.load(data);
      var numTeams = $(".cell-row").length;
      
      for (var row=0; row < numTeams; row++) {
        var teamID = $("#row_0_0_" + row + " .league-name a").attr("href").substring(32, 37); // Get team ID from hyperlink on league page
        var teamName = $("#row_0_0_" + row + " .league-name a").text();
        var playerName = $("#row_0_0_" + row + " .right a").text();
        
        var insertTeams = [teamID, teamName, playerName, leagueID, teamName, playerName];
        var preparedTeams = mysql.format(prepareTeams, insertTeams);
        connection.query(preparedTeams, function(error) {
          if (error) console.log(error);
        });
      }
      numRunningQueries--;
      
      if (numRunningQueries == 0) {
        connection.end(function(error) {
          if (error) callback(error);
          else {
            callback("Update successful");
          }
        });
      }
    });
  });
};

/* Take SQL query and send back results */
var getData = function(callback) {
  
};

module.exports.buildTeamList = buildTeamList;