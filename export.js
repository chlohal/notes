var request = require('request');

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

var docsClient;

///////////////////////////
const NOTEBOOK_DOCUMENT_ID = '';
const SCOPES = ['https://www.googleapis.com/auth/documents'];
const TOKEN_PATH = '.data/token.json';
///////////////////////////

// Load client secrets from a local file.
fs.readFile('.data/google_credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Docs API.
  authorize(JSON.parse(content), saveDocsObj);
});
//apparently an intermediary callback? checks if there's already a token, and if not, gets one?
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}
//apparently, it grabs a token from the server then writes it to the file specified earlier
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function saveDocsObj(auth) {
	console.log('Google Docs authenticated and loaded!');
	docsClient = google.docs({version: 'v1', auth});
}

module.exports = function(commits, callback) {
	//var docs = docsClient;
	
	//grab revision ID, as well as seeing if there're any errors
	docs.documents.get({
    documentId: NOTEBOOK_DOCUMENT_ID,
  }, (err, res) => {
		
		if(err) return console.log('The Docs API returned an error: ' + err);
		
		var editBody = {};
		
		//prep: make Change objects to pass to the Docs API
		
		// > split the array into days
		var commitDays = [];
		commits.forEach(function(commitObject) {
			var workingObject = {commits: []};
			
			//set the day property, which we'll use to a) discriminate, and b) title the table later
			var day = new Date(commitObject.creationDate);
			day.setHours(0,0,0,0);
			dayString = day.toDateString();
			workingObject.day = dayString
			
			//check if the day already is in the commitDays array; if so, operate on that from now on
			var existingIndex = commitDays.findIndex(x => {
				return x.day == dayString;
			});
			var pushTheWorkingObject = true;
			if(existingIndex != -1) {
				pushTheWorkingObject = false;
				workingObject = commitDays[existingIndex];
			}
			//this bit is actually really simple, which I didn't expect it to be, for some reason. huh.
			workingObject.commits.push(commitObject);
			
			if(pushTheWorkingObject) commitDays.push(workingObject);
		});
		var docsChanges = [];
		// > make array of Docs changes that we will put into the request
		
  });
}