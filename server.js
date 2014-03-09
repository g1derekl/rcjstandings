var express = require("express")
  , crawler = require("./crawler.js")
  , model = require("./model.js")
  , PORT = 3000
  , app = express();
  
app.get("/", function(request, response){
  crawler.compileStats(function(error, data) {
    if (error) {
      response.send(error);
    }
    else if (data) {
      response.send(data);
    }
    else {
      console.log("Failed to download data");
    }
  });
});

app.get("/update", function(request, response) {
  crawler.buildTeamList(function(message) {
    response.send(message);
  });
});

app.listen(PORT);

console.log("Listening on port 3000");

var populateFG = function() {
  var numRunningQueries = 0;
  var days = [];
  for (var d=1; d <= 131; d++) {
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
}

populateFG();