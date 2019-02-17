var JSONDB = require ('simple-json-db');
var jdb = new JSONDB('db.json');

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var https = require('https');
var http = require('http');
var request = require('request');

var randtoken = require('rand-token');

var fs = require('fs');
var dbFile = __dirname + '/.data/sqlite.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

var tokens = jdb.JSON().tokens || {};
var doc = jdb.JSON().doc || {};

var passstring = require('./password.json');

var exportCommits = require('./export.js');

function updateDb() {
   var d = jdb.JSON();
   d.doc = doc
   d.tokens = tokens
   jdb.JSON(d);
   jdb.sync()
}

app.use(bodyParser.json({limit: '22mb'}));

//a little helper function to create IDs 
function makeId(tableName) {
  var id = Date.now().toString(36);
  var discriminatorNumber = 0;
  db.each('SELECT id FROM '+tableName+' WHERE id = ?', [id], function(err) {
    discriminatorNumber++ 
  });
  id = id + '-' + discriminatorNumber.toString(36);
  return id;
}
db.serialize(function(){
  if (!exists) {
    db.run('CREATE TABLE Users (id VARCHAR(20), token VARCHAR(40), type TINYINT, googleid TEXT, googletoken TEXT, emailid CHAR(6), candycredit INT, role TINYINT, miscdata TEXT)');
    db.run('CREATE TABLE Commits (id VARCHAR(20), creator VARCHAR(20), type TINYINT, isonteam TINYINT(2), humannames TEXT, creationDate INT, problem TEXT, challenges TEXT, didsolve TINYINT(1), solution TEXT, picture1 BLOB, picture2 BLOB, picture3 BLOB, picture4 BLOB, mimetypes TEXT, miscdata TEXT)');
    console.log('Database created, loaded!');
  }
  else {
    console.log('Database loaded!');
  }
  //console.log('database serialization completed');
});

app.get('/', function(req,res) {
    res.sendFile(__dirname + '/index.html');
});
app.use(express.static('public'));

app.get('/image/:commit_id/:image_index', function (req, resp) {
	db.get('SELECT id, picture1, picture2, picture3, picture4, mimetypes FROM Commits WHERE id = ? AND ? IS NOT NULL', [req.params.commit_id,'picture' + req.params.image_index], function(err, data) {
		if(!data) return req.sendStatus(404);
		var buffer = data['picture' + req.params.image_index];
		var mime = JSON.parse(data.mimetypes)['b' + req.params.image_index].split(/:|;/)[1]
		
		resp.type(mime);
		return resp.end(buffer);
	})
});

app.post('/api/createUser', function (req, resp) {
    if(!req.body) { return resp.sendStatus(500) }
    if(typeof req.body.type !== 'number') { return resp.status(400).send('Invalid account type') }
    request('https://www.googleapis.com/oauth2/v3/tokeninfo?id_token='+encodeURIComponent(req.body.token), function(err, res, body) {
      
      //if there was an error in requesting, tell the user
      if(err) { return resp.sendStatus(500) }
      
      //parse the body
      if(typeof body == 'string') body = JSON.parse(body);
      //then make the record
 
      //if the id of the token doesn't match up with the data they gave us, something's gone wrong
      if(body.sub !== req.body.googleid) { return resp.sendStatus(500) }
      //if the token-issuer isn't us, that's bad too
      if(body.aud !== '1028334096653-kiordr8judlc4fiia5ojal754edkg911.apps.googleusercontent.com') { return resp.sendStatus(500) }
      //if we don't have access to their email, that's a very bad.
	  if(!body.email) { return resp.sendStatus(500) }
	  //if they aren't a part of NHS (as shown by their email domain), kick 'em
	  if(body.email.split('@')[1] !== 'students.needham.k12.ma.us') { return resp.sendStatus(500) }
	  
      //look for a user with the applicable Google ID
      //to see if we need to create a new user, or just give back the user credentials
      db.get('SELECT * FROM Users WHERE googleid = ?', [req.body.googleid], function(er, da) {
        //if there's already a user, just send the credentials.
        if(da) { 
			da.res = "200 OK";
			return resp.send(da); 
		}
        //generate token & id
        var thistkn = randtoken.generate(40);
        var thisid = makeId('Users');
		var userEmailID = body.email.split('@')[0];
		var userRole = 0;
		
		if(userEmailID == 'cbh221') { userRole = 8 }
		
        //make the record, then tell the user about it
        db.run('INSERT INTO Users (id, token, type, googleid, googletoken, candycredit, emailid, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',[thisid, thistkn, req.body.type, body.sub, req.body.token, 0, userEmailID, userRole],function(err) {
          if(err) { console.log(err); return resp.sendStatus(500) }
		  var responseprep = {
			  id: thisid,
			  token: thistkn,
			  type: req.body.type,
			  googleid: body.sub,
			  googletoken: req.body.token,
			  candycredit: 0,
			  emailid: userEmailID,
			  role: userRole,
			  res: "201 Created"
		  }
          resp.status(201).send('{"res": "201 Created","token":"'+thistkn+'","id":"'+thisid+'"}');
        });
      });//wow, look at all those callbacks
    });
});
app.get('/api/candybank/list', function(req, resp) {
	if(!req.headers.authorization) { return resp.sendStatus(401) }
	
	var userId = req.headers.authorization.split(':')[0], userToken = req.headers.authorization.split(':')[1];
	
	db.get('SELECT id, token FROM Users WHERE id = ? AND token = ?', [userId, userToken], function(err, userData) {
		if(err) { return resp.sendStatus(500); }
		if(!userData) { return resp.sendStatus(403); }
		if(userData.token !== userToken) { return resp.sendStatus(403); }
		
		db.all('SELECT id, emailid, candycredit FROM Users ORDER BY candycredit DESC', function(err, credits) {
			if(err) { resp.sendStatus(500); }
			resp.send(credits);
		});
		
	});
});
app.get('/api/permissions/list', function(req, resp) {
	if(!req.headers.authorization) { return resp.sendStatus(401) }
	
	var userId = req.headers.authorization.split(':')[0], userToken = req.headers.authorization.split(':')[1];
	
	db.get('SELECT id, token, role FROM Users WHERE id = ? AND token = ?', [userId, userToken], function(err, userData) {
		//... do you even have a reason to be accessing this?
		if(userData.role < 7) {
			return resp.sendStatus(403);
		}
		//alright, great.
		db.all('SELECT id, emailid, role FROM Users ORDER BY role DESC', function(err, roles) {
			if(err) { resp.sendStatus(500); }
			resp.send(roles);
		});
	});
});
app.put('/api/candybank/setCredit', function(req, resp) {
	if(!req.headers.authorization) { return resp.sendStatus(401) }
	
	if(!req.body) return resp.sendStatus(400);
	if(!req.body.id || req.body.credit === undefined) return resp.sendStatus(400);
	
	if(parseInt(req.body.credit) == NaN) return resp.sendStatus(400);
	
	var userId = req.headers.authorization.split(':')[0], userToken = req.headers.authorization.split(':')[1];
	
	db.get('SELECT id, token, role FROM Users WHERE id = ? AND token = ?', [userId, userToken], function(err, userData) {
		if(err) { return resp.sendStatus(500); }
		if(!userData) { return resp.sendStatus(403); }
		if(userData.token !== userToken) { return resp.sendStatus(403); }
		if(userData.role < 7) { return resp.sendStatus(403); }
		
		db.run('UPDATE Users SET candycredit = ? WHERE id = ?',[req.body.credit, req.body.id], function(err) {
			if(err) { return resp.sendStatus(500) }
			resp.sendStatus(200);
		});
	});
});
app.put('/api/permissions/setRole', function(req, resp) {
	if(!req.headers.authorization) { return resp.sendStatus(401) }
	
	if(!req.body) return resp.sendStatus(400);
	if(!req.body.id || req.body.role === undefined) return resp.sendStatus(400);
	
	var newRole = parseInt(req.body.role);
	if(newRole == NaN) return resp.sendStatus(400);
	
	var userId = req.headers.authorization.split(':')[0], userToken = req.headers.authorization.split(':')[1];
	
	db.get('SELECT id, token, role FROM Users WHERE id = ? AND token = ?', [userId, userToken], function(err, userData) {
		if(err) { return resp.sendStatus(500); }
		if(!userData) { return resp.sendStatus(403); }
		if(userData.token !== userToken) { return resp.sendStatus(403); }
		if(userData.role < 7) { return resp.sendStatus(403); }
		
		if(newRole == 8) { return resp.status(400).send("ERRMSG:You are not allowed to set to that role!"); }
		if(newRole > 8) { return resp.status(400).send("ERRMSG:That is not a valid role number!"); }
		db.get('SELECT id, role FROM Users WHERE id = ?', [req.body.id], function(err, thatUser) {
			if(thatUser.role == 8) { return resp.status(400).send("ERRMSG:You are not allowed to change users with that role!"); }
			db.run('UPDATE Users SET candycredit = ? WHERE id = ?',[newRole, req.body.id], function(err) {
				if(err) { return resp.sendStatus(500) }
				resp.sendStatus(200);
			});
		});
	});
});
app.get('/api/user/self', function(req,resp) {
	if(!req.headers.authorization) { return resp.sendStatus(401) }
	
	var userId = req.headers.authorization.split(':')[0], userToken = req.headers.authorization.split(':')[1];
	
	db.get('SELECT * FROM Users WHERE id = ? AND token = ?', [userId, userToken], function(err, userData) {
		if(err) { return resp.sendStatus(500); }
		if(!userData) { return resp.sendStatus(403); }
		if(userData.token !== userToken) { return resp.sendStatus(403); }
		
		delete userData.token;
		
		resp.send(userData);
	});
});
app.post('/api/submit', function(req,resp) {
	if(!req.headers.authorization) { return resp.sendStatus(401) }
	
	var userId = req.headers.authorization.split(':')[0], userToken = req.headers.authorization.split(':')[1];
	
	db.get('SELECT id, token, role FROM Users WHERE id = ? AND token = ?', [userId, userToken], function(err, userData) {
		if(err) { return resp.sendStatus(500); }
		if(!userData) { return resp.sendStatus(403); }
		if(userData.token !== userToken) { return resp.sendStatus(403); }
		
		if(!userdata.role) { return resp.sendStatus(401); }
		
		//thus, we have verified that the user is who they say they are. Great!
		
		if(!req.body.d) { return resp.sendStatus(400); }
		var submission = req.body.d;
		//wait, hold on: did they give us all the mandatory fields?
		if(!submission.humannames || !submission.problem || submission.type === undefined || !submission.challenges || submission.isonteam === undefined || submission.didsolve === undefined || (submission.didsolve && !submission.solution)) {
			console.log(submission);
			return resp.status(400).send('Mandatory fields not included');
		}
		//... in the right order? (i.e. is there a picture1 but no picture2?)
		if((submission.picture2 && !submission.picture1) || (submission.picture3 && !submission.picture2) || (submission.picture4 && !submission.picture3)) {
			return resp.status(400).send('Pictures in incorrect order');
		}
		//okay!
		//make picture variables
		var pictureBuffers = {
			b1: null, 
			b2: null, 
			b3: null, 
			b4: null
		}
		var mimeTypesOfPictures = {
			b1: null, 
			b2: null, 
			b3: null, 
			b4: null
		}
		for(var i = 1; i <= 5; i++) {
			if(submission['picture' + i]) {
				var b64Split = submission['picture' + i].split(',');
				pictureBuffers['b' + i] = Buffer.from(b64Split[1],'base64');
				mimeTypesOfPictures['b' + i] = b64Split[0];
			}
		}
		//make an id-- save it to a variable so we can access the same id later
		var thisid = makeId('Commits');
		
		db.run('INSERT INTO Commits (id, creator, type, isonteam, humannames, creationDate, problem, challenges, didsolve, solution, picture1, picture2, picture3, picture4, mimetypes) VALUES ($id, $creator, $type, $isonteam, $humannames, $creationDate, $problem, $challenges, $didsolve, $solution, $picture1, $picture2, $picture3, $picture4, $mimetypes)',{
				$id: thisid,
				$creator: userId, 
				$type: submission.type,
				$isonteam: submission.isonteam,
				$humannames: submission.humannames,
				$creationDate: Date.now(), 
				$problem: submission.problem,
				$challenges: submission.challenges,
				$didsolve: submission.didsolve,
				$solution: submission.solution,
				$picture1: pictureBuffers.b1, 
				$picture2: pictureBuffers.b2,
				$picture3: pictureBuffers.b3,
				$picture4: pictureBuffers.b4,
				$mimetypes: JSON.stringify(mimeTypesOfPictures)
			},function(err) {
            if(err) { return resp.sendStatus(500) }
            resp.status(201).send('{"res": "201 Created","id":"'+thisid+'"}');
        });
		//give the user a Candy Credit(tm)
		db.run('UPDATE Users SET candycredit = candycredit + 1 WHERE id = ?', [userId], function(err) {
			if(err) { console.log(err) }
		});
	});
});

app.get('/api/docs/bytime', function(req, resp) {
    //make sure the before and after query strings are defined-- `is` overrides both if it's there
    req.query.b = req.query.i || req.query.b || 0
    req.query.a = req.query.i || req.query.a || 0
	
	
	if(!req.headers.authorization) { return resp.sendStatus(401) }
	var userId = req.headers.authorization.split(':')[0], userToken = req.headers.authorization.split(':')[1];
	
	//verify that they are who they say they are
  db.get('SELECT id, token FROM Users WHERE id = ? AND token = ?', [userId, userToken], function(err, userData) {
	  if(err) return resp.sendStatus(500);
	  if(!userData) return resp.sendStatus(403);
	  db.all('SELECT id, creator, type, isonteam, humannames, creationDate, problem, challenges, didsolve, solution, picture1, picture2, picture3, picture4, mimetypes FROM Commits WHERE creationDate BETWEEN ? AND ?', [req.query.b,req.query.a], function(err, commitData) {
		  if(err) return resp.sendStatus(500);
		  
		  //change pictures to urls that'll go to /image
		  for(var i = 0; i < commitData.length; i++) {
			  for(var i_ = 1; i_ <= 4; i_++) {
				if(commitData[i]['picture' + i_]) {
					commitData[i]['picture' + i_] = '/image/' + commitData[i].id + '/' + i_
				}
			  }
			  delete commitData[i].mimetypes;
		  }
		  resp.send(commitData.slice(0,(req.query.n || 50)));
	  });
  });
});

//make The Hecking Doc
//mapped to an api route for now; can be changed later
app.get('/api/export/html', function(req, res) {
	//if(!req.headers.authorization) { return res.sendStatus(401) }
	//var userId = req.headers.authorization.split(':')[0], userToken = req.headers.authorization.split(':')[1];
	
   // db.get('SELECT id, token, role FROM Users WHERE id = ? AND token = ?', [userId, userToken], function(err, userData) {
	//   if(err) return resp.sendStatus(500);
	//   if(!userData) return resp.sendStatus(403);
	//   if(userData.role < 6) return resp.sendStatus(401);
		makeTheHeckingDoc(function(html) {
			res.type('txt');
			res.send(html);
		});
	//});
})
function makeTheHeckingDoc(callback) {
	db.all('SELECT * FROM Commits', function(err, commits) {
		exportCommits(commits, callback);
	});
	
}


var server = app.listen(5557, function() {
  console.log('Your app is listening on port ' + server.address().port);
});
