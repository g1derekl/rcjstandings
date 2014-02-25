var http = require("http")
, cheerio = require("cheerio")
, url = "http://www.fleaflicker.com/nba/team?leagueId=11345&teamId=73630&week=118";

var download = function(callback) {
  http.get(url, function(res) {
    var data = "";
    res.on("data", function (chunk) {
      data += chunk;
    });
    res.on("end", function() {
      callback(parse(data));
    });
  }).on("error", function() {
    callback(null);
  });
}

function parse(data) {
  var $ = cheerio.load(data);
  var stats = {};
  
  stats["ft%"] = parseInt($("#row_0_0_10 td").eq(7).text());
  stats["3pt"] = parseInt($("#row_0_0_10 td").eq(8).text());
  stats["reb"] = parseInt($("#row_0_0_10 td").eq(9).text());
  stats["stl"] = parseInt($("#row_0_0_10 td").eq(10).text());
  stats["blk"] = parseInt($("#row_0_0_10 td").eq(11).text());
  stats["ast"] = parseInt($("#row_0_0_10 td").eq(12).text());
  stats["tov"] = parseInt($("#row_0_0_10 td").eq(13).text());
  stats["pts"] = parseInt($("#row_0_0_10 td").eq(14).text());
  stats["fgm"] = parseInt($("#row_0_0_10 td").eq(16).text().split("-")[0]);
  stats["fga"] = parseInt($("#row_0_0_10 td").eq(16).text().split("-")[1]);
  
  console.log(JSON.stringify(stats));
  return stats;
}

module.exports.download = download;