var handlebars = require("handlebars")
  , fs = require("fs")
  , model = require("./model.js")
  , QUERY = "SELECT *, fg_score + ft_score + threes_score + reb_score + stl_score + blk_score + ast_score + tov_score + pts_score AS total_score FROM"
  + " (SELECT a.team_id, a.fg_percent, (SUM(a.fg_percent > b.fg_percent) + 1 + SUM(a.fg_percent >= b.fg_percent))/2 AS fg_score"
  + " FROM (SELECT team_id, SUM(fg_made) / SUM(fg_attempted) * 100 AS fg_percent"
  + " FROM fg_percentage"
  + " GROUP BY team_id) AS a"
  + " CROSS JOIN (SELECT team_id, SUM(fg_made) / SUM(fg_attempted) * 100 AS fg_percent"
	+ " FROM fg_percentage"
	+ " GROUP BY team_id) AS b"
  + " GROUP BY team_id) AS fg"
  + " NATURAL JOIN"
  + " (SELECT a.team_id, a.ft_percent, (SUM(a.ft_percent > b.ft_percent) + 1 + SUM(a.ft_percent >= b.ft_percent))/2 AS ft_score"
  + " FROM stats a"
  + " CROSS JOIN stats b"
  + " GROUP BY team_id) AS ft"
  + " NATURAL JOIN"
  + " (SELECT a.team_id, a.three_pointers, (SUM(a.three_pointers > b.three_pointers) + 1 + SUM(a.three_pointers >= b.three_pointers))/2 AS threes_score"
  + " FROM stats a"
  + " CROSS JOIN stats b"
  + " GROUP BY team_id) AS threes"
  + " NATURAL JOIN"
  + " (SELECT a.team_id, a.rebounds, (SUM(a.rebounds > b.rebounds) + 1 + SUM(a.rebounds >= b.rebounds))/2 AS reb_score"
  + " FROM stats a"
  + " CROSS JOIN stats b"
  + " GROUP BY team_id) AS reb"
  + " NATURAL JOIN"
  + " (SELECT a.team_id, a.steals, (SUM(a.steals > b.steals) + 1 + SUM(a.steals >= b.steals))/2 AS stl_score"
  + " FROM stats a"
  + " CROSS JOIN stats b"
  + " GROUP BY team_id) AS stl"
  + " NATURAL JOIN"
  + " (SELECT a.team_id, a.blocks, (SUM(a.blocks > b.blocks) + 1 + SUM(a.blocks >= b.blocks))/2 AS blk_score"
  + " FROM stats a"
  + " CROSS JOIN stats b"
  + " GROUP BY team_id) AS blk"
  + " NATURAL JOIN"
  + " (SELECT a.team_id, a.assists, (SUM(a.assists > b.assists) + 1 + SUM(a.assists >= b.assists))/2 AS ast_score"
  + " FROM stats a"
  + " CROSS JOIN stats b"
  + " GROUP BY team_id) AS ast"
  + " NATURAL JOIN"
  + " (SELECT a.team_id, a.turnovers, (SUM(a.turnovers < b.turnovers) + 1 + SUM(a.turnovers <= b.turnovers))/2 AS tov_score"
  + " FROM stats a"
  + " CROSS JOIN stats b"
  + " GROUP BY team_id) AS tov"
  + " NATURAL JOIN"
  + " (SELECT a.team_id, a.points, (SUM(a.points > b.points) + 1 + SUM(a.points >= b.points))/2 AS pts_score"
  + " FROM stats a"
  + " CROSS JOIN stats b"
  + " GROUP BY team_id) AS pts"
  + " NATURAL JOIN teams NATURAL JOIN leagues"
  + " ORDER BY total_score DESC;";
  
var buildLeaderboard = function(callback) {
  fs.readFile("./html/template.html", "utf-8", function(error, source) {
    if (error) {
      callback(error, null);
    }
    else {
      model.query(QUERY, function(error, result) {
        if (error) {
          callback(error, null);
        }
        else {
          var template = handlebars.compile(source);
          var data = {"teams": result};
          callback(null, template(data));;
        }
      });
    }
  });
};

module.exports.buildLeaderboard = buildLeaderboard;