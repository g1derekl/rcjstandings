var http = require("http")
  , cheerio = require("cheerio")
  , fs = require("fs")
  , mysql = require("mysql")
  , model = require("./model.js")
  , DAY = 132
  , leagues = JSON.parse(fs.readFileSync("leagues.json"))
  , leaguesList = Object.keys(leagues[1]);

/* Given HTML data of a team, parse field goal percentages */
var parseShooting = function(team, data) {
  var made = 0;
  var attempted = 0;
  var $ = cheerio.load(data);
  
  for (var row=0; row < 10; row++) {
    var fg = $("#row_0_0_" + row + " td").eq(16).text().split("-");
    var fgm = parseInt(fg[0]);
    var fga = parseInt(fg[1]);
    if (fgm >= 0) {
      made += fgm;
      attempted += fga;
    }
  }
  return [made.toString(), attempted.toString()];
};

/* Get field goal percentages from all teams in league */
var getFGData = function(teams, day, callback) {
  var numRunningQueries = 0;
  var preparePercentage = "INSERT INTO fg_percentage (fg_made, fg_attempted, num_day, team_id) VALUES (?, ?, ?, ?)"
    + " ON DUPLICATE KEY UPDATE fg_made = ?, fg_attempted = ?";
  
  Object.keys(teams).forEach(function(teamID) {
    var url = "http://www.fleaflicker.com/nba/team?leagueId=" + teams[teamID] + "&teamId=" + teamID.toString() + "&week=" + day.toString() + "&statType=2";
    numRunningQueries++;
    
    model.download(url, function(data) {
      var percentage = parseShooting(teamID, data);
      var insertPercentage = [percentage[0], percentage[1], day, teamID, percentage[0], percentage[1]];
      model.preparedStatement(preparePercentage, insertPercentage, function(error) {
        if (error) {
          console.log(error);
        }
      });        
      numRunningQueries--;
      if (numRunningQueries == 0) {
        callback();
      }
    });
  });
};

/* Take league page data and return stats for each player */
var teamStats = function(data) {
  var $ = cheerio.load(data);
  var numTeams = $(".cell-row").length;
  var prepareStats = "INSERT INTO STATS (team_id, ft_percent, three_pointers, rebounds, steals, blocks, assists, turnovers, points) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    + " ON DUPLICATE KEY UPDATE ft_percent = ?, three_pointers = ?, rebounds = ?, steals = ?, blocks = ?, assists = ?, turnovers = ?, points = ?";
  
  var teamID, ft, threes, reb, stl, blk, ast, tov, pts;
  
  for (var row=0; row < numTeams; row++) {
    teamID = $("#row_0_0_" + row + " .league-name a").attr("href").substring(32, 37);
    ft = $("#row_0_0_" + row + " td").eq(7).text();
    threes = $("#row_0_0_" + row + " td").eq(10).text().replace(/\,/g,'');
    reb = $("#row_0_0_" + row + " td").eq(13).text().replace(/\,/g,'');
    stl = $("#row_0_0_" + row + " td").eq(16).text().replace(/\,/g,'');
    blk = $("#row_0_0_" + row + " td").eq(19).text().replace(/\,/g,'');
    ast = $("#row_0_0_" + row + " td").eq(22).text().replace(/\,/g,'');
    tov = $("#row_0_0_" + row + " td").eq(25).text().replace(/\,/g,'');
    pts = $("#row_0_0_" + row + " td").eq(28).text().replace(/\,/g,'');
    
    var insertStats = [teamID.toString(), ft.toString(), threes.toString(), reb.toString(), stl.toString(), blk.toString(), ast.toString(),
      tov.toString(), pts.toString(), ft.toString(), threes.toString(), reb.toString(), stl.toString(), blk.toString(), ast.toString(), tov.toString(), pts.toString()];
    model.preparedStatement(prepareStats, insertStats, function(error) {
      if (error) {
        console.log(error);
      }
    });
  }
}

/* Populate DB with FG% data */
var populateFG = function(callback) {
  var teams = {};
  
  var d = DAY;

  model.query("SELECT team_id, league_id FROM teams", function(error, results) {
    if (error) {
      callback(error, null);
    }
    for (var r=0; r < results.length; r++) {
      teams[results[r]["team_id"].toString()] = results[r]["league_id"].toString();
    }
    
    var i = 2;
    function days() {
      setTimeout(function () {
        DAY = i;
        getFGData(teams, DAY, function() {});
        i++;
        if (i < 10) {
          days();
        }
        else {
          DAY = d;
          callback("success");
        }
      }, 30000)
    }
    
    days();
  });
}

var compileStats = function(callback) {
  var numRunningQueries = 0;
  var teams = {};
  
  model.query("SELECT team_id, league_id FROM teams", function(error, results) {
    if (error) {
      callback(error, null);
    }
    for (var r=0; r < results.length; r++) {
      teams[results[r]["team_id"].toString()] = results[r]["league_id"].toString();
    }

    getFGData(teams, DAY, function() {
      for (var leagueID=0; leagueID < leaguesList.length; leagueID++) {
        numRunningQueries++;
        var url = "http://www.fleaflicker.com/nba/league?leagueId=" + leaguesList[leagueID];
        
        model.download(url, function(data) {
          teamStats(data);
          
          numRunningQueries--;
          if (numRunningQueries == 0) {
            callback(null, "Success");
          }
        });
      }
    });
  });
};

/* Build the data set of teams */
var buildTeamList = function(callback) {
  var numRunningQueries = 0;
  var prepareLeagues = "INSERT INTO leagues (league_id, league_name, division) VALUES (?, ?, ?)"
    + " ON DUPLICATE KEY UPDATE league_name = ?";
  var prepareTeams = "INSERT INTO teams (team_id, team_name, player_name, league_id) VALUES (?, ?, ?, ?)"
    + " ON DUPLICATE KEY UPDATE team_name = ?, player_name = ?";
  // NOTE: important to update when duplicate key in case league and/or team changes names or is taken over by another user
  
  for (var division=0; division < leagues.length; division++) {
 
    Object.keys(leagues[division]).forEach(function(leagueID) {
      var insertLeagues = [leagueID, leagues[division][leagueID], division + 1, leagues[division][leagueID]];
      model.preparedStatement(prepareLeagues, insertLeagues, function(error) {
        if (error) {
          console.log(error);
        }
      });
      
      numRunningQueries++;
      var url = "http://www.fleaflicker.com/nba/league?leagueId=" + leagueID;
      
      model.download(url, function(data) {
        var $ = cheerio.load(data);
        var numTeams = $(".cell-row").length;
        
        for (var row=0; row < numTeams; row++) {
          var teamID = $("#row_0_0_" + row + " .league-name a").attr("href").substring(32, 37); // Get team ID from hyperlink on league page
          var teamName = $("#row_0_0_" + row + " .league-name a").text();
          var playerName = $("#row_0_0_" + row + " .right a").text();
          
          var insertTeams = [teamID, teamName, playerName, leagueID, teamName, playerName];
          model.preparedStatement(prepareTeams, insertTeams, function(error) {
            if (error) {
              console.log(error);
            }
          });
        }
        numRunningQueries--;
        
        if (numRunningQueries == 0) {
          model.closeConnection(function(error) {
            if (error) {
              callback(error);
            }
            else {
              callback("Update successful");
            }
          });
        }
      });
    });
  }
};

module.exports.compileStats = compileStats;
module.exports.buildTeamList = buildTeamList;
module.exports.populateFG = populateFG;
module.exports.getFGData = getFGData;