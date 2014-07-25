var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();
var server = require('http').Server(app);
var socket = require('socket.io')(server);

server.listen(8080);

app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/pages');
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
	secret : 'talk',
	cookie: { secure: true }
}));

app.configure(function(){
  app.use(express.bodyParser());
});
	
app.get('/', function(req, res){
    res.render('index',{firstname:'swapnil', lastname: 'kharabe'});
});

app.get('/login', function(req, res){
	res.render('login',{server_message:""});
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
		  	connection.query('Select password, first_name, last_name FROM talk.user WHERE username = ?', req.body.username, function(err, result) {
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
								ses.user = result[0].first_name + " " + result[0].last_name;
								ses.username = req.body.username;
								var query = connection.query('Select uid, first_name, last_name FROM talk.user WHERE username != ? ORDER BY first_name, last_name', ses.username, function(err, result) {
									if(!err){
										console.log(result);
										res.render('home.ejs', {
											user : req.session.user,
											users : result
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
	console.log("sdgdfsgs->"+req.session.username);
	req.session.destroy(function(err){
		console.log(err);
	});
	res.render('login',{server_message:""});
});

app.get('/chat', function(req, res){
	var ses = req.session;
	console.log("99999999999->"+ses.username);
	if(session.username == null || session.username == ""){
		res.render('login', {server_message:'Session expired, please Log in'});
	}
	else	
		res.render('chat');
});

//----------Chat related code

socket.on('connection', function(client){	
	var ses = req.session;
	console.log("Connection Successful with " + ses.user);
	socket.on('message', function (data) {
	    console.log(data);
  });
});

