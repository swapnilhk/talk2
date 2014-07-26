var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
var server = require('http').Server(app);
var socket = require('socket.io')(server);
var url = require('url');

server.listen(8080);

app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/pages');
app.use(express.static(path.join(__dirname, 'public')));

app.configure(function(){
  app.use(express.bodyParser());
});
	
app.use(express.cookieParser());

app.use(express.session({
        secret : 'talk'
        //cookie: { secure: true },
        //cookie: { maxAge: 60000 }
}));

app.get('/', function(req, res){
    res.render('login',{server_message:''});
});


app.get('/login', function(req, res){
	res.render('login',{server_message:""});
});



app.get('/threads', function(req, res){
	if(req.session.uid != undefined){
		var mysql      = require('mysql');
		var connection = mysql.createConnection({
		    host     : 'localhost',
			user     : 'talkuser',
		   	password : 'password'
	   	});
	   	connection.connect(function(err){
			if(!err){
				/*Threads initiated by this user*/
				var query = connection.query('\
				SELECT uid, first_name, last_name, tid\
				FROM talk.user, talk.thread\
				WHERE user.uid = thread.responder\
				AND thread.initiator = ?'
				,[req.session.uid], function(err, result) {
					if(!err){
						console.log("Query Successful");
						/*Threads user responded to*/
						var query = connection.query('\
						SELECT uid, first_name, last_name, tid\
						FROM talk.user, talk.thread\
						WHERE user.uid = thread.initiator\
						AND thread.responder = ?'
						,[req.session.uid], function(err, result1) {
							if(!err){
								console.log("Query Successful");
								res.render('threads.ejs',{
									'result':result,
									'result1':result1
								});					
							}
							else{
								var serv_msg = "Something Wrong Happened";
								console.log(serv_msg+" : "+err);
								res.render('login',{server_message:serv_msg});								
							}
						});
						console.log(query.sql);
					}
					else{
						var serv_msg = "Something Wrong Happened";
						console.log(serv_msg+" : "+err);
						res.render('login',{server_message:serv_msg});
					}
				});
				console.log(query.sql);
			}
		});				
	}
	else{
		var serv_msg = "Session Expired";
	    console.log(serv_msg);
	    res.render('login',{server_message:serv_msg});
	}
});


app.get('/thread', function(req, res){
	if(req.session.uid != undefined){
		var mysql      = require('mysql');
		var connection = mysql.createConnection({
		    host     : 'localhost',
			user     : 'talkuser',
		   	password : 'password'
	   	});
	   	connection.connect(function(err){
			if(!err){
				var tid = (url.parse(req.url, true).query).tid;
				var fuid = (url.parse(req.url, true).query).uid;
				/**
				 * Safety check for get parameters. The URL might be tampered. So make sure that
				 * passed 'uid' and logged in user belong to thread with id 'tid'
				 */
				var query = connection.query('\
				SELECT initiator, responder\
				FROM talk.thread\
				WHERE tid = ?'
				,[tid], function(err, result) {
					if(!err){
						console.log("Query Successful");
						if(result == undefined || result.length ==0 || (result[0].initiator != req.session.uid && result[0].responder != req.session.uid)){
								
							var serv_msg = "You do not belong to this conversation";
							console.log(serv_msg);
							res.render('login',{server_message:serv_msg});
						}
						else{
							renderChat(req, res);			
						}
					}
					else{
						var serv_msg = "Something Wrong Happened";
						console.log(serv_msg+" : "+err);
						res.render('login',{server_message:serv_msg});
					}
				});
				console.log(query.sql);
			}
		});				
	}
	else{
		var serv_msg = "Session Expired";
	    console.log(serv_msg);
	    res.render('login',{server_message:serv_msg});
	}
});

app.get('/recieved_broadcasts', function(req, res){
	if(req.session.uid != undefined){
		console.log('Recieved Broadcasts: '+req.session.uid);
		var mysql      = require('mysql');
		var connection = mysql.createConnection({
	   	        host     : 'localhost',
		        user     : 'talkuser',
		       	password : 'password'
	   	});
	   	connection.connect(function(err){
			if(!err){
				var query = connection.query("\
				SELECT user.uid, first_name, last_name, thread.tid as tid, msg, msg.create_ts as ts\
				FROM talk.user, talk.thread, talk.thread_msg, talk.msg\
				WHERE user.uid = thread.initiator\
				AND thread.tid = thread_msg.tid\
				AND msg.msg_id = thread_msg.msg_id\
				AND broadcast_flag = 1\
				AND thread.responder = ?\
				ORDER BY ts DESC",[req.session.uid], function(err, result) {
					if(!err){
						console.log("Query Successful");
						res.render('recieved_broadcasts.ejs',{broadcasts:result});
					}
					else{
				   		var serv_msg = "Something Wrong Happened";
						console.log(serv_msg+" : "+err);
						res.render('login',{server_message:serv_msg});
					}
				});			
				console.log(query.sql);
			}
			else{
		   		var serv_msg = "Something Wrong Happened";
			    console.log(serv_msg+" : "+err);
			    res.render('login',{server_message:serv_msg});
			}
		});
	}
	else{
		var serv_msg = "Session Expired";
	    console.log(serv_msg);
	    res.render('login',{server_message:serv_msg});
	}
});

app.post('/broadcast', function(req, res){
	console.log('Broadcast: '+req.session.uid);
	console.log(req.body);
	var uid;
	for(uid in req.body.uid)
		console.log(uid);
	var mysql      = require('mysql');
	var connection = mysql.createConnection({
   	        host     : 'localhost',
            user     : 'talkuser',
           	password : 'password'
   	});
	connection.connect(function(err) {
		if(!err){
			console.log("Database connection successful");
			var query = connection.query('INSERT INTO talk.msg(msg,sender,broadcast_flag) VALUES(?,?,1)', [req.body.broadcast_message, req.session.uid], function(err, result) {
				if(!err){					
					var msg_id = result.insertId;
					console.log("Query Successful");
					for(var i in req.body.uid){
						console.log("---%%%%%%%%%%%%------->"+req.body.uid[i]);
					   	query = connection.query('INSERT INTO talk.thread(initiator, responder) VALUES(?,?)', [req.session.uid, req.body.uid[i]], function(err, result) {
							if(!err){
								console.log("Query Successful");
								query = connection.query('INSERT INTO talk.thread_msg(tid, msg_id) VALUES(?,?)', [result.insertId, msg_id], function(err, result) {
									if(!err){					
										console.log("Query Successful");					
								 		console.log("Broadcast by "+req.session.user+" successful");
										res.render('home.ejs', {
											user : req.session.user,
											users : req.session.users,
											server_message : "Broadcast Successful"
										});																			
										console.log(query.sql);
									}
								   	else{
								   		var serv_msg = "Something Wrong Happened";
										console.log(serv_msg+" : "+err);
										res.render('login',{server_message:serv_msg});
									}
								});
						   	}
						   	else{
						   		var serv_msg = "Something Wrong Happened";
								console.log(serv_msg+" : "+err);
								res.render('login',{server_message:serv_msg});
							}
						});						
						console.log(query.sql);
					}
				}	
				else{
			   		var serv_msg = "Something Wrong Happened";
			        console.log(serv_msg+" : "+err);
    			    res.render('login',{server_message:serv_msg});
				}
			});
			console.log(query.sql);
		}
		else{
	   		var serv_msg = "Something Wrong Happened";
	        console.log(serv_msg);
	        res.render('login',{server_message:serv_msg});
        }
	});
});

app.post('/authenticate', function(req, res){
	console.log("authenticate");
	var mysql      = require('mysql');
	var connection = mysql.createConnection({
		host     : 'localhost',
		user     : 'talkuser',
		password : 'password',
	});

	connection.connect(function(err) {
		if(!err){
			console.log("Database connection successful");
		  	connection.query('Select uid, password, first_name, last_name FROM talk.user WHERE username = ?', req.body.username, function(err, result) {
			if(!err){								
				if(result == ""){
					var serv_msg = "Incorrect username or password";
					console.log(err);
					res.render('login',{server_message:serv_msg});
				}
				else{
					connection.query('Select MD5(?) as passmd5', req.body.password, function(err, password) {
						if(!err){
							if(password[0].passmd5 == result[0].password){
								console.log("Authentic user: "+result[0].first_name + " " + result[0].last_name);						
								var ses = req.session
								ses.uid = result[0].uid;
								ses.user = result[0].first_name + " " + result[0].last_name;
								ses.username = req.body.username;
								console.log("------->"+ses.uid);//TODO:remove this debug line
								var query = connection.query('Select uid, first_name, last_name FROM talk.user WHERE username != ? ORDER BY first_name, last_name', ses.username, function(err, result) {
									if(!err){
										console.log(result);
										ses.users = result;
										res.render('home.ejs', {
											user : ses.user,
											users : ses.users,
											server_message : ""
										});
									}
									else
										console.log(err);
								});
								console.log(query.sql);
							}
							else{
								var serv_msg = "Incorrect username or password";
								console.log(serv_msg);
								res.render('login',{server_message:serv_msg});
							}
						}
						else{
							console.log(e);
							res.render('login',{server_message:e});
						}
					});
				}
			}
			else{
				var serv_msg = "Incorrect username or password";
				console.log(serv_msg);
				res.render('login',{server_message:serv_msg});
		  	}
		});
	}
	else
		console.log(err);
});
	
	 
});

app.get('/register', function(req, res){
	res.render('register');
});

app.get('/logout', function(req, res){
	var ses = req.session;
	console.log("Session Object->"+ses.user);
	ses.destroy(function(err){
		console.log(err);
	});	
	res.render('login',{server_message:""});
});


app.get('/home', function(req, res){
	res.render('home.ejs', {
		user : req.session.user,
		users : req.session.users,
		server_message : ""
	});
});

function renderChat(req, res){
	if(req.session.uid != undefined){
		console.log("Chat connected to: "+req.session.username);
		var fuid = (url.parse(req.url, true).query).uid;
		var tid = (url.parse(req.url, true).query).tid;
		
		
		var mysql      = require('mysql');
		var connection = mysql.createConnection({
		    host     : 'localhost',
			user     : 'talkuser',
		   	password : 'password'
	   	});
	   	connection.connect(function(err){
			if(!err){
				var query = connection.query('\
				SELECT first_name, last_name\
				FROM talk.user\
				WHERE uid = ?'
				,[fuid], function(err, result){
					if(!err){
						console.log("Query Successful");
						var query = connection.query('\
						SELECT msg,first_name,last_name \
						FROM talk.msg, talk.thread_msg, talk.user\
						WHERE msg.msg_id = thread_msg.msg_id\
						AND msg.sender = user.uid\
						AND thread_msg.tid = ?\
						ORDER by create_ts'
						,[tid], function(err, result2) {
							if(!err){
								console.log("Query Successful");
								res.render('chat.ejs',{
									uid : req.session.uid,
							 		fname : result[0].first_name+" "+result[0].last_name,
							 		fuid : fuid,
							 		tid : tid,
							 		messages: result2
							 	});
							}
							else{
								var serv_msg = "Something Wrong Happened";
								console.log(serv_msg+" : "+err);
								res.render('login',{server_message:serv_msg});
							}
						});
						console.log(query.sql);
					}
					else{
						var serv_msg = "Something Wrong Happened";
						console.log(serv_msg+" : "+err);
						res.render('login',{server_message:serv_msg});
					}
				});
				console.log(query.sql);
			}
			else{
				var serv_msg = "Something Wrong Happened";
				console.log(serv_msg+" : "+err);
				res.render('login',{server_message:serv_msg});
			}
		});
	}
	else{
		var serv_msg = "Session Expired";
	    console.log(serv_msg);
	    res.render('login',{server_message:serv_msg});
	}
}

//----------Chat related code

socket.on('connection', function(client){	
	console.log("User connected to chat");
	//Register user
	
	var basket = {};


	socket.on("register", function(data) {
		basket[data.nickname] = socket.id;
	});
	
	
	client.on('message', function (data) {
		console.log("Data recieved from user");
		console.log(data);
			var mysql      = require('mysql');
			var connection = mysql.createConnection({
		   		host     : 'localhost',
				user     : 'talkuser',
			   	password : 'password'
		   	});
			connection.connect(function(err) {
				if(!err){
					console.log("Database connection successful");
					var query = connection.query('INSERT INTO talk.msg(msg,sender) VALUES(?,?)', [data.message, data.uid], function(err, result) {
						if(!err){	
							console.log("Query Successful");			
							var query = connection.query('INSERT INTO talk.thread_msg(tid,msg_id) VALUES(?,?)', [data.tid, result.insertId], function(err, result) {
								if(!err){
									console.log("Query Successful");
								}
								else{
					   				var serv_msg = "Something Wrong Happened";
					   				client.emit(serv_msg);
									console.log(serv_msg+": "+err);
								}
							});
							console.log(query.sql);
						}
						else{
					   		var serv_msg = "Something Wrong Happened";
					   		client.emit(serv_msg);
							console.log(serv_msg+": "+err);
						}	
					});
					console.log(query.sql);
				}
				else{
			   		var serv_msg = "Something Wrong Happened";
			   		client.emit(serv_msg);
					console.log(serv_msg+": "+err);
				}	
			});
		
  	});
});

app.post('/register', function(req, res){
	var mysql      = require('mysql');
	var connection = mysql.createConnection({
	    host     : 'localhost',
		user     : 'talkuser',
	   	password : 'password'
   	});
   	connection.connect(function(err){
		if(!err){
			/*Threads initiated by this user*/
			var query = connection.query('\
			INSERT INTO talk.user(username, first_name, last_name, password)\
			VALUES (?,?,?,MD5(?))',
			[req.body.username, req.body.first_name, req.body.last_name, req.body.password], function(err, result) {
				if(!err){
					console.log("Query Successful");
					var serv_msg = "Regestration Successful. Please login with your credentials";
					res.render('login',{server_message:serv_msg});
				}
				else{
					var serv_msg = "Something Wrong Happened";
					console.log(serv_msg+" : "+err);
					res.render('login',{server_message:serv_msg});
				}
			});
			console.log(query.sql);
		}
	});		
});


