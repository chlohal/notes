var JSONDB = require ('simple-json-db');
var db = new JSONDB('db.json');

var express = require('express');
var app = express();
var https = require('https');
var http = require('http');

var tokens = db.JSON().tokens || {};
var doc = db.JSON().doc || {};

var passstring = require('./password.json');

function updateDb() {
   var d = db.JSON();
   d.doc = doc
   d.tokens = tokens
   db.JSON(d);
   db.sync()
}

app.get('/token', function (req,res) {
    if(req.headers,authorization == passstring) {
        var tkn = (function(i,p,r,l) {
            p = '1234567890ABCDEFGHIJKLMNOPabcdefghijklmnopqrstuvwxyz._-'
            r = ""
            for( i = 0; i < 20; i++) {
                r = r + p[Math.floor( p.length * Math.random())]
            }
            
            while(tokens[r]) {
              r = ''
              for( i = 0; i < 20; i++) {
                  r = r + p[Math.floor( p.length * Math.random())]
              }
            }
            return r
            
        }); 
        
        tokens[tkn] = req.query.name
        resp.send(tkn);
        updateDb();
    } else {
       req.sendStatus(403);
    }

});

app.get('/docs', function(req,res) {
    if(tokens[req.headers,authorization]) {
      var docArr = Object.values(doc);
      if(req.query.t == 'time') {
          res.send(docArr.sort(function(a,b) {return a.date - b.date}).slice((req.query.a || 0),((req.query.a || 0) + 100)));
      }
    } else {
       req.sendStatus(403);
    }
});

app.post('/submit', function (req,res) {
    if(tokens[req.headers,authorization]) {
        var nDate = Date(Date.now());
        nDate.setUTCHours(0);
        nDate.setUTCMinutes(0);
        nDate.setUTCSeconds(0);
        nDate.setUTCMilliseconds(0);
        
        nDate = nDate.toUTCString();
        
        request.body.author = tokens[req.headers.authorization]
        request.body.date = nDate.getTime();
        
        var docid = (function(d,t) {
            d = Date.now();
            t = Math.floor(Math.random() * 10000)
            
            while(doc[d + "" + t]) {
                t = Math.floor(Math.random() * 10000)
            }
            
            return d + "" + t
        
        })();
        
        doc[docid] = request.body
        req.sendStatus(201);
        updateDb();
    } else {
       req.sendStatus(403);
    }
    
});

app.get('/verifyToken', function(req,res) {
    if(tokens[req.headers,authorization]) {
        req.sendStatus(200);
    } else {
       req.sendStatus(403);
    }

})

app.get('/', function(req,res) {
    res.sendFile(__dirname + '/index.html');
});

var server = app.listen(5557, function() {
  console.log('Your app is listening on port ' + server.address().port);
});
