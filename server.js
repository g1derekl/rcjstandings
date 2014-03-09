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