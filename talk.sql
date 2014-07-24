CREATE DATABASE talk;
CREATE USER 'talkadmin'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON talk to 'talkadmin'@'localhost';

CREATE TABLE `talk`.`user` (
  `uid` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(60) NOT NULL,
  `password` VARCHAR(45) NOT NULL,  
  `first_name` VARCHAR(45) NOT NULL,
  `last_name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`uid`)
)

CREATE TABLE `talk`.`thread` (
	tid INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
	initiator INTEGER UNSIGNED NOT NULL,
	responder INTEGER UNSIGNED NOT NULL,
	create_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (tid),
	CONSTRAINT fk_thread_initiator FOREIGN KEY (initiator) REFERENCES user(uid) ON DELETE CASCADE ON UPDATE RESTRICT,
	CONSTRAINT fk_thread_responder FOREIGN KEY (responder) REFERENCES user(uid) ON DELETE CASCADE ON UPDATE RESTRICT
);

CREATE TABLE `talk`.`msg` (
	msg_id INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
	msg VARCHAR(500) NOT NULL,
	seen BOOLEAN NOT NULL DEFAULT 0,
	tid INTEGER UNSIGNED DEFAULT NULL,
	sender INTEGER UNSIGNED NOT NULL,	
	create_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (msg_id),
	CONSTRAINT fk_msg_sender FOREIGN KEY (sender) REFERENCES user(uid) ON DELETE CASCADE ON UPDATE RESTRICT,
	CONSTRAINT fk_msg_tid FOREIGN KEY (tid) REFERENCES thread(tid) ON DELETE CASCADE ON UPDATE RESTRICT	
);

CREATE TABLE `talk`.`shout` (
	msg_id INTEGER UNSIGNED NOT NULL,
	reciever INTEGER UNSIGNED NOT NULL,
	PRIMARY KEY (msg_id, reciever),
	CONSTRAINT fk_shout_msg_id FOREIGN KEY (msg_id) REFERENCES msg(msg_id) ON DELETE CASCADE ON UPDATE RESTRICT,
	CONSTRAINT fk_shout_reciever FOREIGN KEY (reciever) REFERENCES user(uid) ON DELETE CASCADE ON UPDATE RESTRICT
);

CREATE USER 'talkuser'@'localhost' IDENTIFIED BY 'password';
GRANT SELECT, INSERT ON talk.* to 'talkuser'@'localhost';
GRANT UPDATE(password) ON talk.user to 'talkuser'@'localhost';
CREATE USER 'talkuser'@'%' IDENTIFIED BY 'password';
GRANT SELECT, INSERT ON talk.* TO 'talkuser'@'%'
GRANT UPDATE(password) ON talk.user TO 'talkuser'@'%';

