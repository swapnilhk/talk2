var express = require('express');
var session = require('express-session');
var app = express();
var bodyParser = require('body-parser');

app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.set('views', __dirname + '/pages');
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
					console.log(e);
					res.render('login',{server_message:e});
				}
				else{
					connection.query('Select MD5(?) as passmd5', req.body.password, function(err, password) {
						if(!err){
							if(password[0].passmd5 == result[0].password){
								console.log("Authentic user");						
								var ses = req.session
								ses.user = result[0].first_name + " " + result[0].last_name;
								ses.username = req.body.username;
								console.log("sdfhskjhdfkjshkjfhkas-----"+ses.username);
								var query = connection.query('Select uid, first_name, last_name FROM talk.user WHERE username != ?', ses.username, function(err, result) {
									if(!err){
										console.log(result);
										res.render('home', {
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
	req.session.destroy(function(err){
		console.log(err);
	});
	res.render('login',{server_message:""});
});

app.listen(8090);
