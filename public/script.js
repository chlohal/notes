String.prototype.HTML = function () {
    return this
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

var currentIndex = 0, totalDocs = {}, modalOpen = false;
function loginReq(usr) {
var prof = usr.getBasicProfile();
  var tkn = usr.getAuthResponse().id_token;
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/createUser');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
    console.log('Signed in as: ' + xhr.responseText);
    if(xhr.status == 200 || xhr.status == 201) {
      var rJSON = JSON.parse(xhr.responseText);
      localStorage.setItem('token',rJSON.token);
      localStorage.setItem('id',rJSON.id);
	  document.getElementById("login").classList.add("login-hidden");
	  document.querySelector('.content-logged-in').classList.remove("out");
	  document.querySelector('#top-in').classList.remove("out");
	  reload(0);
    }
  };
  console.log({"type":0,"token":tkn,"googleid":prof.getId()});
  xhr.send(JSON.stringify({"type":0,"token":tkn,"googleid":prof.getId()}));
}
function formatAndSubmit() {
	
	var haderror = false, notifiedUserOfError = false, submission = {}, base64Array = [];
	
	//load Base64 files
	var fileInput = document.querySelector('.submit-file-input');
	
	//if there are no files, call the done function right away
	
	if(fileInput.files.length == 0) { whenDoneWithEncodingAllFiles(); }
	
	for(var i = 0; i < fileInput.files.length; i++) {
		fileToBase64(fileInput.files[i], function(err, base64) {
			//error handling
			if(err || haderror) { 
				haderror = true; 
				if(!hadNotifiedUserOfError) { snackbar('Error in encoding files!',3000,'err'); hadNotifiedUserOfError = true; }
				return; 
			}
			base64Array.push(base64);
			console.log('hey!', i, fileInput.files.length);
			//if we're finished encoding all the files
			if(i == fileInput.files.length) {
				whenDoneWithEncodingAllFiles();
			}
		});
	}
	function whenDoneWithEncodingAllFiles() {
		//add all files as properties-- no for loop is needed
		for(var i = 0; i < base64Array.length; i++) {
			submission['picture' + (i+1)] = base64Array[i]
		}
		
		//set other values; those that we don't need to b64 the values of
		submission.humannames = document.querySelector('.names-submit-input').value;
		submission.problem = document.querySelector('.problem-submit-input').value;
		submission.challenges = document.querySelector('.challenges-submit-input').value;
		
		var didsolveElement = document.querySelector('input[name=didsolve]:checked');
		if(didsolveElement) { submission.didsolve = didsolveElement.value == true; }
		
		//only set the solution if they solved it
		if(submission.didsolve) {
			submission.solution = document.querySelector('.solution-submit-input').value;
		}
		//team selector 
		var isonteamElement = document.querySelector('input[name=what_team]:checked');
		if(isonteamElement) { submission.isonteam = isonteamElement.value - 0 }
		
		//check for mandatory values 
		if(!submission.humannames || !submission.problem || !submission.challenges || submission.isonteam === undefined || submission.didsolve === undefined || (submission.didsolve && !submission.solution)) {
			return snackbar('Please fill out all mandatory fields!',3000,'war')
		}
		
		//for expandability; not used right now
		submission.type = 0;
		
		console.log(submission);
		sendSubmission(submission);
	}
}
function sendSubmission(x) {
var req = new XMLHttpRequest();

req.onload = function() {
 if(req.status == 201) {
     reload(currentIndex);
 }
}

req.onerror = function() {
    snackbar('There was an error. Try again later',3000,'err');
}

req.open("POST", "/api/submit");

req.setRequestHeader("Authorization",localStorage.getItem('id') + ':' + localStorage.getItem('token'));
req.setRequestHeader("Content-Type", "application/json");

req.send(JSON.stringify({d: x}));
}

function reload(x,fromTime,toTime) {

var req = new XMLHttpRequest();

var reloadanimelem = document.getElementById('reloadanimcontainer');
reloadanimelem.innerHTML = '<svg width="200px"  height="200px"  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="lds-rolling" style="background: none;"><circle cx="50" cy="50" fill="none" ng-attr-stroke="{{config.color}}" ng-attr-stroke-width="{{config.width}}" ng-attr-r="{{config.radius}}" ng-attr-stroke-dasharray="{{config.dasharray}}" stroke="#000000" stroke-width="2" r="35" stroke-dasharray="164.93361431346415 56.97787143782138" transform="rotate(29.7828 50 50)"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></circle></svg>';

req.onreadystatechange = function() {
if(req.readyState == 4) {
 if(req.status == 200) {
     var uploadList = document.querySelector('.postlist');
	 var parsedResp = JSON.parse(req.responseText);
	 var eventualHtml = '';
	 
     reloadanimelem.innerHTML = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" viewBox="0 0 24 24" clip-rule="evenodd"><path d="M7 9h-7v-7h1v5.2c1.853-4.237 6.083-7.2 11-7.2 6.623 0 12 5.377 12 12s-5.377 12-12 12c-6.286 0-11.45-4.844-11.959-11h1.004c.506 5.603 5.221 10 10.955 10 6.071 0 11-4.929 11-11s-4.929-11-11-11c-4.66 0-8.647 2.904-10.249 7h5.249v1z"/></svg>'
     
	 parsedResp.forEach(x => {
	     totalDocs[x.id] = x
	 });
	 
	 
	 
	 Object.values(totalDocs).sort(function(a,b) {return b.creationDate - a.creationDate}).forEach(x => {
		 
		 //make string for pictures
		 var picturestring = '<div class="file-input-preview" style="display: flex;">';
		 for(var i = 1; i < 5; i++) {
			if(x['picture' + i]) {
				picturestring = picturestring + '<div><img src="'+x['picture'+i]+'"></div>'
			}
		 }
		 picturestring = picturestring + '</div>'
		 
	     eventualHtml = eventualHtml + "<div" + ((x.creator == localStorage.getItem('id'))?(' class="my-doc" data-docid="'+x.id+'"'):'') + "><div>Team: <span class=\"editable-in-edit-mode edit-dropdown\">" + (((["Software","Hardware","Other"])[x.isonteam]) || 'Error') + "</span></div><div>People Responsible: <span class=\"editable-in-edit-mode\">" + x.humannames.HTML() + '</span></div><div> Problem: <span class=\"editable-in-edit-mode\">' + (x.problem||'').HTML() + '</span></div><div> Challenges: <span class=\"editable-in-edit-mode\">' + x.challenges.HTML() + '</span></div>'+ (x.didsolve?'<div> Solution: <span class=\"editable-in-edit-mode\">' + (x.solution||'').HTML() + '</span></div>':'')+ (x.picture1?picturestring:'') +'</div>'
	 });
	 
	 //currentIndex = parsedResp.length
	 
	 uploadList.innerHTML = eventualHtml;
 } else if (req.status == 403) {
     signOut();
 }
 }
}

req.onerror = function() {
    snackbar('There was an error. Try again later',3000,'err');
     reloadanimelem.innerHTML = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" viewBox="0 0 24 24" clip-rule="evenodd"><path d="M7 9h-7v-7h1v5.2c1.853-4.237 6.083-7.2 11-7.2 6.623 0 12 5.377 12 12s-5.377 12-12 12c-6.286 0-11.45-4.844-11.959-11h1.004c.506 5.603 5.221 10 10.955 10 6.071 0 11-4.929 11-11s-4.929-11-11-11c-4.66 0-8.647 2.904-10.249 7h5.249v1z"/></svg>'

}

var dateSoWeCanDoDatishOperations = new Date(Date.now());

req.open("GET", "/api/docs/bytime?n=50&b=" + dateSoWeCanDoDatishOperations.setHours(0,0,0,0) + "&a=" + dateSoWeCanDoDatishOperations.setHours(23,59,59,999) );

req.setRequestHeader("Authorization", localStorage.getItem('id') + ':' + localStorage.getItem('token'));

req.send();
}
var candyBankData = [];
function openCandyBank() {
	document.querySelector('.candybank-button > svg').style.background = '#000000'
	document.querySelector('.candybank-button > svg').style.fill = '#ffffff'
	document.querySelector('.content-logged-in').style.overflowY = 'hidden'
	document.querySelector('.content-logged-in').scrollTop = 0
	var container = document.querySelector('.modal-candybank');
	container.classList.remove('out');
	container.scrollTop = 0;
	modalOpen = true;
	var search = new URLSearchParams(location.search);
	search.set('open','candybank');
	history.replaceState(null, '', "?" + search.toString());
	
	//load data
	snackbar('Loading data from server...');
	var req = new XMLHttpRequest();
	
	req.onload = function() {
		if(req.status == 200) {
			snackbar('Candy credit data reloaded!');
			candyBankData = JSON.parse(req.responseText);
			
			var table = document.getElementById('candy-credit-table');
			table.innerHTML = '<tr><th>Email ID</th><th>Candy Balance</th></tr>';
			candyBankData.forEach(dataEntry => {
				var tr = document.createElement('tr');
				tr.setAttribute('data-acctid',dataEntry.id);
				tr.innerHTML = '<td>'+dataEntry.emailid.HTML() + '</td><td class="editable-by-admins">' + dataEntry.candycredit.toString().HTML() + '</td>';
				table.appendChild(tr);
			});
			if(JSON.parse(localStorage.getItem('self')).role == 8) {
				loadEditingAndSuch();
			}
		} else req.onerror()
	}
	
	req.onerror = function() {
		snackbar('Error in loading data',3000,'err');
	}
	
	req.open("GET", "/api/candybank/overview");

	req.setRequestHeader("Authorization", localStorage.getItem('id') + ':' + localStorage.getItem('token'));
	
	req.send();
	
	
	function loadEditingAndSuch() {
		console.log('loadEditingAndSuch');
		document.querySelectorAll('.editable-by-admins').forEach(elem => {
			console.log(elem);
			elem.setAttribute('contenteditable', true);
			elem.addEventListener('focusout', function() {
				console.log('focs');
				var newVal = parseInt(elem.innerText);
				if(newVal == NaN) { return snackbar('Candy credit values must be an integer!',3000,'war') }
				
				var req = new XMLHttpRequest();
				
				req.onload = function() {
					if(req.status == 200) {
						snackbar('Saved changes to candy data',3000,'suc');
					} else snackbar('Error in saving',3000,'err');
				}
				
				req.onerror = function() {
					snackbar('Error in saving',3000,'err');
				}
				
				req.open("PUT", "/api/candybank/setCredit");

				req.setRequestHeader("Authorization", localStorage.getItem('id') + ':' + localStorage.getItem('token'));
				req.setRequestHeader('Content-Type', 'application/json');
				
				req.send(JSON.stringify({id: elem.parentElement.getAttribute('data-acctid'), credit: newVal}));
			});
		});
	}
}

function downloadParse() {

    document.querySelector('.output-button > svg').style.background = '#000000'
    document.querySelector('.output-button > svg').style.fill = '#ffffff'
	document.querySelector('.content-logged-in').style.overflowY = 'hidden'
	document.querySelector('.content-logged-in').scrollTop = 0
    var container = document.querySelector('.modal-table-copy');
	container.classList.remove('out');
	container.scrollTop = 0
    modalOpen = true
	
	//it's formatting time!
	var tables = [
        ['<tr style="height:0pt"><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;background-color:#274e13;padding:5pt 5pt 5pt 5pt;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#ffffff;background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Tasks</span></p></td><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;background-color:#274e13;padding:5pt 5pt 5pt 5pt;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#ffffff;background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Reflections</span></p></td></tr>'],
		['<tr style="height:0pt"><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;background-color:#274e13;padding:5pt 5pt 5pt 5pt;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#ffffff;background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Tasks</span></p></td><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;background-color:#274e13;padding:5pt 5pt 5pt 5pt;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#ffffff;background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Reflections</span></p></td></tr>'],
		['<tr style="height:0pt"><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;background-color:#274e13;padding:5pt 5pt 5pt 5pt;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#ffffff;background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Tasks</span></p></td><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;background-color:#274e13;padding:5pt 5pt 5pt 5pt;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#ffffff;background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Reflections</span></p></td></tr>']
	];
	
	Object.values(totalDocs).forEach(x => {
	    tables[x.d.team].push(
		    '<tr style="height:0pt"><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;background-color:#93c47d;padding:5pt 5pt 5pt 5pt;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Names: ' + x.d.names.HTML() +'</span></p></td><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;padding:5pt 5pt 5pt 5pt;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">'+ x.d.content.HTML() +'</span></p></td></tr>'
		)
	});
	
	var finished = '<meta charset="utf-8"><div style="font-weight:normal;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Software</span></p><div dir="ltr" style="margin-left:0pt;"><table style="border:none;border-collapse:collapse"><colgroup><col width="133" /></colgroup>' +
	               tables[0].join('') +
				   ((tables[0].length-1)?'':'<tr style="height:0pt"><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;background-color:#93c47d;padding:5pt 5pt 5pt 5pt;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Names: </span></p></td><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;padding:5pt 5pt 5pt 5pt;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;"></span></p></td></tr>') + 
	               '</table></div><br /><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Hardware</span></p><div dir="ltr" style="margin-left:0pt;"><table style="border:none;border-collapse:collapse"><colgroup><col width="133" /></colgroup>' + 
	               tables[1].join('') +
				   ((tables[1].length-1)?'':'<tr style="height:0pt"><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;background-color:#93c47d;padding:5pt 5pt 5pt 5pt;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Names: </span></p></td><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;padding:5pt 5pt 5pt 5pt;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;"></span></p></td></tr>') + 
	               '</table></div><br /><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Other</span></p><div dir="ltr" style="margin-left:0pt;"><table style="border:none;border-collapse:collapse"><colgroup><col width="133" /></colgroup>' + 
	               tables[2].join('') +
				   ((tables[2].length-1)?'':'<tr style="height:0pt"><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;background-color:#93c47d;padding:5pt 5pt 5pt 5pt;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;">Names: </span></p></td><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;padding:5pt 5pt 5pt 5pt;"><p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:10pt;font-family:\'Times New Roman\';color:#000000;background-color:transparent;font-weight:400;font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;"></span></p></td></tr>') + 
	               '</table></div></div>';
    document.getElementById('output-preview').innerHTML = finished;
}

function hideModal () {
    document.querySelectorAll('#top-in > a > svg').forEach(x => {
		x.style.background = 'transparent'
        x.style.fill = '#000000'
	});
    document.querySelector('.content-logged-in').style.overflowY = 'auto'
	document.querySelectorAll('.modal').forEach(x => { x.classList.add('out') })
	modalOpen = false;
	var search = new URLSearchParams(location.search);
	search.delete('open');
	history.replaceState(null, '', location.pathname);
}

function snackbar(t,d,y) {
    var c = {
        "suc": '#92D190',
        "err": "#DD8B8B",
        "war": "#FAB28E"
    }
    var elem = document.createElement('div');
    
    document.querySelectorAll('.snackbar').forEach(x => {
        x.parentElement.removeChild(x);
    });
    
    elem.classList.add('snackbar');
    elem.style.borderColor = c[y] || c.suc
    elem.style.cursor = 'default'
    elem.onclick = function() {
        elem.parentElement.removeChild(elem);
    }
    elem.innerHTML = (t || 'There was an error. Please try again.').HTML();
    
    document.body.appendChild(elem);
    
    
    setTimeout(function () {
        try { document.body.removeChild(elem); } catch (e) {}
    }, 3000 || d);
}
//open modal from query string on load
window.addEventListener('load', function() {
	var query = (new URL(document.location)).searchParams;
	if(!query.has('open')) { return }
	switch(query.get('open')) {
		case 'candybank':
		    openCandyBank();
		break
	}
});

function signOut() {
	localStorage.clear();
	var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      location.reload();
    });
}
//reload your user object
(function(ls) {
	var tk = ls.getItem('token'), id = ls.getItem('id');
	if(!tk||!id) return
	var req = new XMLHttpRequest();
	req.onload = function() {
		ls.setItem('self',req.responseText);
	}
	req.open('GET', '/api/user/self');
	req.setRequestHeader("Authorization", id + ':' + tk);

    req.send();
	
})(localStorage);

window.addEventListener('load', function() {
	var accountDropdownMenuOpen;
	var accountDropdownButton = document.getElementById('accountcontainer');
	var accountDropdownButtonSvg = accountDropdownButton.querySelector('svg');
	var accountDropdownElem = document.getElementById('account-dropdown');
	accountDropdownButton.addEventListener('click', function(event) {
		if(!accountDropdownMenuOpen) {
	        accountDropdownButtonSvg.style.background = '#000000'
            accountDropdownButtonSvg.style.fill = '#ffffff'
			accountDropdownElem.style.display = 'block'
		} else {
	        accountDropdownButtonSvg.style.background = '#ffffff'
            accountDropdownButtonSvg.style.fill = '#000000'
			accountDropdownElem.style.display = 'none'
		}
		
		
		accountDropdownMenuOpen = !accountDropdownMenuOpen;
	});
	
	document.querySelectorAll('input[type=file').forEach(elem => {
		elem.addEventListener('change', function(e) {
			var previewDiv = elem.nextElementSibling;
			previewDiv.innerHTML = '';
			var input = e.target;
			var totalFileSize = 0;
			if(input.files.length > 0) {
				previewDiv.style.display = 'flex';
			} else {
				previewDiv.style.display = 'none';
			}
			if(input.files.length > 4) {
				input.value = '';
				previewDiv.innerHTML = '';
				return snackbar('You may include a maximum of 4 pictures!', 3000, 'war') 
			}
			for(var i = 0; i < input.files.length; i++) {
				var objectElementParent = document.createElement('div');
				var objectElement = document.createElement('img');
				objectElement.src = URL.createObjectURL(input.files[i]);
				totalFileSize += input.files[i].size;
				if(totalFileSize > 16000000) {
					previewDiv.innerHTML = ''
					snackbar('You can have a maximum of 16 MB per documentation!', 3000, 'war');
					input.value = '';
					break;
				}
				objectElementParent.appendChild(objectElement);
				previewDiv.appendChild(objectElementParent);
			}
		});
		
	});
})

function fileToBase64(file,cb) {
   var reader = new FileReader();
   reader.readAsDataURL(file);
   reader.onload = function () {
     cb(null,reader.result);
   };
   reader.onerror = function (error) {
     cb(error,null);
   };
}

//from http://jsfiddle.net/jdhenckel/km7prgv4/3
function copyToClip(str,notify) {
  function listener(e) {
    e.clipboardData.setData("text/html", str);
    e.preventDefault();
	if(notify) { snackbar('Data copied!',3000,'suc') }
  }
  document.addEventListener("copy", listener);
  document.execCommand("copy");
  document.removeEventListener("copy", listener);
};

function editMode() {
    document.querySelectorAll('.my-doc > div > .editable-in-edit-mode').forEach(x => {
	    x.contentEditable = true;
		x.style.border = '1px solid black'
	});
    document.querySelectorAll('.my-doc > div > .editable-in-edit-mode.edit-dropdown').forEach(x => {
	    x.innerHTML = '<select><option>Software</option><option>Hardware</option><option>Other</option>'
	});
    
}