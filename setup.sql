CREATE TABLE leagues (
	league_id INT NOT NULL,
	league_name VARCHAR(80) NOT NULL,
	division INT NOT NULL,
	PRIMARY KEY (league_id)
);

CREATE TABLE teams (
	team_id INT NOT NULL,
	team_name VARCHAR(80) NOT NULL,
	player_name VARCHAR(80) NOT NULL,
	league_id INT NOT NULL,
	PRIMARY KEY (team_id),
	FOREIGN KEY (league_id) REFERENCES leagues(league_id) ON DELETE CASCADE
);

CREATE TABLE fg_percentage (
	fg_made INT NOT NULL,
	fg_attempted INT NOT NULL,
	num_day INT NOT NULL,
	team_id INT NOT NULL,
	PRIMARY KEY (team_id, num_day),
	FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

CREATE TABLE stats (
	team_id INT NOT NULL,
	ft_percent FLOAT NOT NULL,
	three_pointers INT NOT NULL,
	rebounds INT NOT NULL,
	steals INT NOT NULL,
	blocks INT NOT NULL,
	assists INT NOT NULL,
	turnovers INT NOT NULL,
	points INT NOT NULL,
	PRIMARY KEY (team_id),
	FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);