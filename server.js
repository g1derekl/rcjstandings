var express = require("express")
, crawler = require("./crawler.js")
, app = express();

app.get('/', function(req, res){
  crawler.getFGData(function(data) {
    if (data) {
      res.send(data);
    }
    else {
      console.log("Failed to download data");
    }
  });
}).listen(3000);

console.log("Listening on port 3000");