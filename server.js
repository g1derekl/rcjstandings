var express = require("express")
  , schedule = require("node-schedule")
  , fs = require("fs")
  , crawler = require("./crawler.js")
  , model = require("./model.js")
  , leaderboard = require("./leaderboard.js")
  , PORT = 3000
  , app = express();

var rule = new schedule.RecurrenceRule();
rule.hour = 10;
rule.minute = 0;

/* Set crawler to run every day at 10 AM ET */
var j = schedule.scheduleJob(rule, function(){
  crawler.buildTeamList(function(message) {
    console.log("Updated team list");
    
    crawler.advanceDay();
    
    crawler.compileStats(function(error, data) {
      if (error) {
        console.log("Stats update error");
      }
      else if (data) {
        console.log(data);
        leaderboard.buildLeaderboard(function(error, html) {
          if (error) {
            console.log(error);
          }
          else {
            fs.writeFile("index.html", html, function(error, data) {
              if (error) {
                console.log(error);
              }
            });
          }
        });
      }
      else {
        console.log("Couldn't update stats");
      }
    });
  });
});

app.use(express.static(__dirname));
  
app.get("/", function(request, response){
  response.redirect("/index.html");
});

/* For development only; remove on deployment */

/*
app.get("/update", function(request, response) {
  crawler.compileStats(function(error, data) {
    if (error) {
      response.send("Stats update error");
    }
    else if (data) {
      response.send(data);
    }
    else {
      response.send("Couldn't update stats");
    }
  });
});


app.get("/leaderboard", function(request, response) {
  leaderboard.buildLeaderboard(function(error, html) {
    if (error) {
      console.log(error);
    }
    else {
      fs.writeFile("index.html", html, function(error, data) {
        if (error) {
          console.log(error);
        }
        else {
          response.send("Created standings page");
        }
      });
    }
  });
});

app.get("/build", function(request, response) {
  crawler.buildTeamList(function(message) {
    response.send(message);
  });
}); */

app.listen(PORT);

console.log("Listening on port 3000");

/* Populate DB for multiple days at once, mostly for development */
var populateFG = function() {
  var numRunningQueries = 0;
  var days = [];
  for (var d=131; d <= 135; d++) {
    days.push(d);
  }
  var teams = {};
  
  model.query("SELECT team_id, league_id FROM teams", function(error, results) {
    if (error) {
      callback(error, null);
    }
    for (var r=0; r < results.length; r++) {
      teams[results[r]["team_id"].toString()] = results[r]["league_id"].toString();
    }
    
    days.forEach(function(day) {
      numRunningQueries++;
      
      crawler.getFGData(teams, day, function() {
        console.log(day);
        numRunningQueries--;
        if (numRunningQueries == 0) {
          console.log("populated FG data");
        }
      });
    });
  });
};

//populateFG();