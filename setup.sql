CREATE TABLE leagues (
	league_id INT NOT NULL,
	league_name VARCHAR(80) NOT NULL,
	PRIMARY KEY (league_id)
);

CREATE TABLE teams (
	team_id INT NOT NULL,
	player_name VARCHAR(40) NOT NULL,
	league_id INT NOT NULL,
	PRIMARY KEY (team_id),
	FOREIGN KEY (league_id) REFERENCES leagues(league_id)
);

CREATE TABLE fg_percentage (
	fg_percent INT NOT NULL,
	team_id INT NOT NULL,
	PRIMARY KEY (team_id),
	FOREIGN KEY (team_id) REFERENCES teams(team_id)
);