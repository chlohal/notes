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
    if(xhr.status == 200 || xhr.status == 201) {
      var rJSON = JSON.parse(xhr.responseText);
      localStorage.setItem('token',rJSON.token);
      localStorage.setItem('id',rJSON.id);
	  localStorage.setItem('self',xhr.responseText);
	  document.getElementById("login").classList.add("login-hidden");
	  document.querySelector('.content-logged-in').classList.remove("out");
	  document.querySelector('#top-in').classList.remove("out");
	  
	  //hide all o' dem thingies that we don't want the normal peeps to see
	  try {
		if(JSON.parse(localStorage.getItem('self')).role >= 4) { document.querySelector('.permedit-button').hidden = false; }
		if(JSON.parse(localStorage.getItem('self')).role >= 4) { document.querySelector('.output-button').hidden = false; }
	  } catch(e) {}
    }
  };
  xhr.send(JSON.stringify({"type":0,"token":tkn,"googleid":prof.getId()}));
}
function openHome() {
	document.querySelector('.home-button > svg').style.background = '#000000'
	document.querySelector('.home-button > svg').style.fill = '#ffffff'
	document.querySelector('.content-logged-in').style.overflowY = 'hidden'
	document.querySelector('.content-logged-in').scrollTop = 0
	var container = document.querySelector('.modal-home');
	container.classList.remove('out');
	container.scrollTop = 0;
	modalOpen = true;
	var search = new URLSearchParams(location.search);
	search.set('open','home');
	history.replaceState(null, '', "?" + search.toString());
        reload();
}
function formatAndSubmit() {
	
	var haderror = false, notifiedUserOfError = false, submission = {}, base64Array = [];
	//make sure we're allowed to submit
	if(JSON.parse(localStorage.getItem('self')).role < 7) return snackbar('You are not allowed to submit! Ask an admin to change your role',3000,'err')
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

snackbar('Sending documentation...');

req.onload = function() {
 if(req.status == 201) {
	 snackbar(' ',1);
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
function archiveSearch() {
	var dateInput = document.getElementById('archive-data-input');
	if(!dateInput) return 0
	var dateObjOfDate = new Date(dateInput.value.split('-'));
	
	var fromNum = dateObjOfDate.setHours(0,0,0,0);
	var toNum = dateObjOfDate.setHours(23,59,59,999);
	
	var parentElementForTheResults = document.getElementById('archive-postlist');
	if(!parentElementForTheResults) return 0
	
	reload(0,fromNum,toNum,parentElementForTheResults, true, function(results) {
		if(!results[0]) { snackbar('No results found for that day',2000,'err')}
		else if(JSON.parse(localStorage.getItem('self')).role >= 7) {
			document.querySelectorAll('#archive-postlist > div').forEach(elem => {
				var delLink = document.createElement('a');
				delLink.classList.add('contextmenu');
				delLink.href = 'javascript:void(0)';
				delLink.onclick = function() { deleteDoc(elem.getAttribute('data-docid')) }
				delLink.innerHTML = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;" title="Delete" viewBox="0 0 24 24" fill-rule="evenodd" clip-rule="evenodd"><path d="M9 3h6v-1.75c0-.066-.026-.13-.073-.177-.047-.047-.111-.073-.177-.073h-5.5c-.066 0-.13.026-.177.073-.047.047-.073.111-.073.177v1.75zm11 1h-16v18c0 .552.448 1 1 1h14c.552 0 1-.448 1-1v-18zm-10 3.5c0-.276-.224-.5-.5-.5s-.5.224-.5.5v12c0 .276.224.5.5.5s.5-.224.5-.5v-12zm5 0c0-.276-.224-.5-.5-.5s-.5.224-.5.5v12c0 .276.224.5.5.5s.5-.224.5-.5v-12zm8-4.5v1h-2v18c0 1.105-.895 2-2 2h-14c-1.105 0-2-.895-2-2v-18h-2v-1h7v-2c0-.552.448-1 1-1h6c.552 0 1 .448 1 1v2h7z"/></svg>';
				elem.appendChild(delLink);
				generateTooltip(delLink.firstElementChild);
			});
		}
	});
}
function reload(x,fromTime,toTime,todaysParentElement,onlyUseThisData,cb) {

var req = new XMLHttpRequest();

req.onreadystatechange = function() {
if(req.readyState == 4) {
 if(req.status == 200) {
     var uploadList = todaysParentElement||document.querySelector('div.inhome.postlist');
	 var parsedResp = JSON.parse(req.responseText);
	 var eventualHtml = '';

	 parsedResp.forEach(x => {
	     totalDocs[x.id] = x
	 });
	 
	 
	 
	 (onlyUseThisData?parsedResp:(Object.values(totalDocs))).sort(function(a,b) {return b.creationDate - a.creationDate}).forEach(x => {
		 
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
	 if(typeof cb == 'function') cb(parsedResp);
 } else if (req.status == 403) {
     signOut();
 }
 }
}

req.onerror = function() {
    snackbar('There was an error. Try again later',3000,'err');
}

var dateSoWeCanDoDatishOperations = new Date(Date.now());

req.open("GET", "/api/docs/bytime?n=50&b=" + (fromTime||dateSoWeCanDoDatishOperations.setHours(0,0,0,0)) + "&a=" + (toTime||dateSoWeCanDoDatishOperations.setHours(23,59,59,999)) );

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
	var req = new XMLHttpRequest();
	
	req.onload = function() {
		if(req.status == 200) {
			candyBankData = JSON.parse(req.responseText);
			
			var table = document.getElementById('candy-credit-table');
			table.innerHTML = '<tr><th>Email ID</th><th>Candy Balance</th></tr>';
			candyBankData.forEach(dataEntry => {
				var tr = document.createElement('tr');
				tr.setAttribute('data-acctid',dataEntry.id);
				tr.innerHTML = '<td>'+dataEntry.emailid.HTML() + '</td><td class="editable-by-admins">' + (dataEntry.candycredit||0).toString().HTML() + '</td>';
				table.appendChild(tr);
			});
			if(JSON.parse(localStorage.getItem('self')).role >= 7) {
				loadEditingAndSuch(function(elem) {
					var newVal = parseInt(elem.innerText);
					if(newVal == NaN) { return snackbar('Candy credit values must be an integer!',3000,'war') }
					
					var req = new XMLHttpRequest();
					
					req.onload = function() {
						if(req.status == 200) {
							snackbar('Saved changes!',3000,'suc');
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
			}
		} else req.onerror()
	}
	
	req.onerror = function() {
		snackbar('Error in loading data',3000,'err');
	}
	
	req.open("GET", "/api/candybank/list");

	req.setRequestHeader("Authorization", localStorage.getItem('id') + ':' + localStorage.getItem('token'));
	
	req.send();

}
var permissionData = [];
function openPermedit() {
        
	document.querySelector('.permedit-button > svg').style.background = '#000000'
	document.querySelector('.permedit-button > svg').style.fill = '#ffffff'
	document.querySelector('.content-logged-in').style.overflowY = 'hidden'
	document.querySelector('.content-logged-in').scrollTop = 0
	var container = document.querySelector('.modal-permedit');
	container.classList.remove('out');
	container.scrollTop = 0;
	modalOpen = true;
	var search = new URLSearchParams(location.search);
	search.set('open','permedit');
	history.replaceState(null, '', "?" + search.toString());
	
	//load data
	var req = new XMLHttpRequest();
	
	req.onload = function() {
		if(req.status == 200) {
			permissionData = JSON.parse(req.responseText);
			
			var table = document.getElementById('permedit-table');
			table.innerHTML = '<tr><th>Email ID</th><th>Role Number(<a href="/abt_roles.txt" target="_blank">?</a>)</th></tr>';
			permissionData.forEach(dataEntry => {
				var tr = document.createElement('tr');
				tr.setAttribute('data-acctid',dataEntry.id);
				tr.setAttribute('data-rolestatic',dataEntry.role);
				tr.innerHTML = '<td>'+dataEntry.emailid.HTML() + '</td><td class="editable-by-admins">' + (dataEntry.role||0).toString().HTML() + '</td>';
				table.appendChild(tr);
			});
			if(JSON.parse(localStorage.getItem('self')).role >= 7) {
				loadEditingAndSuch(function(elem) {
					var newVal = parseInt(elem.innerText);
					if(newVal == NaN) { return snackbar('Roles must be an integer!',3000,'war') }
					
					var req = new XMLHttpRequest();
					
					req.onload = function() {
						if(req.status == 200) {
							snackbar('Saved changes!',3000,'suc');
							elem.parentElement.setAttribute('data-rolestatic', newVal);
						} else req.onerror()
					}
					
					req.onerror = function() {
						elem.innerHTML = elem.parentElement.getAttribute('data-rolestatic');
						if(req.responseText) {
							if(req.responseText.startsWith('ERRMSG:')) {
								return snackbar(req.responseText.substring(7),3000,'err');
							} 
						}
						snackbar('Error in saving',3000,'err');
					}
					
					req.open("PUT", "/api/permissions/setRole");

					req.setRequestHeader("Authorization", localStorage.getItem('id') + ':' + localStorage.getItem('token'));
					req.setRequestHeader('Content-Type', 'application/json');
					
					req.send(JSON.stringify({id: elem.parentElement.getAttribute('data-acctid'), role: newVal}));
				});
			}
		} else req.onerror()
	}
	
	req.onerror = function() {
		snackbar('Error in loading data',3000,'err');
	}
	
	req.open("GET", "/api/permissions/list");

	req.setRequestHeader("Authorization", localStorage.getItem('id') + ':' + localStorage.getItem('token'));
	
	req.send();
}
function loadEditingAndSuch(cb) {
	document.querySelectorAll('.editable-by-admins').forEach(elem => {
		elem.setAttribute('contenteditable', true);
		elem.addEventListener('focusout', function() {
			cb(elem);
		});
	});
}
function deleteDoc(docid) {
	var req = new XMLHttpRequest();
	req.open("DELETE", "/api/commits?id=" + docid);
	
	req.onload = function() {
		if(req.status == 200) {
			snackbar('Deleted!');
			archiveSearch();
		} else req.onerror()
	}
	req.onerror = function() {
		snackbar('Error in deleting',3000,'err');
	}
	req.setRequestHeader("Authorization", localStorage.getItem('id') + ':' + localStorage.getItem('token'));
	
	req.send();
}
function openArchivePanel() {
	document.querySelector('.archive-button > svg').style.background = '#000000'
    document.querySelector('.archive-button > svg').style.fill = '#ffffff'
	document.querySelector('.content-logged-in').style.overflowY = 'hidden'
	document.querySelector('.content-logged-in').scrollTop = 0
    var container = document.querySelector('.modal-archive');
	container.classList.remove('out');
	container.scrollTop = 0
    modalOpen = true
	var search = new URLSearchParams(location.search);
	search.set('open','archive');
	history.replaceState(null, '', "?" + search.toString());
	archiveSearch();
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
	var search = new URLSearchParams(location.search);
	search.set('open','download');
	history.replaceState(null, '', "?" + search.toString());
	
	var req = new XMLHttpRequest();
	
	req.open('GET','/api/export/html');
	
	req.setRequestHeader("Authorization",localStorage.getItem('id') + ':' + localStorage.getItem('token'));
	
	
    req.onload = function() {
		if(req.status == 200) {
			document.getElementById('output-preview').innerHTML = req.responseText;
		} else {
			req.onerror();
			document.getElementById('output-preview').innerHTML = '<p style="font-family:monospace">ERR</p>';
		}
	}
	req.onerror = function() {
		snackbar('Error loading data',1500,'err');
	}
	req.send();
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
    elem.innerHTML = (t || ' ').HTML();
    
    document.body.appendChild(elem);
    
    
    setTimeout(function () {
        try { document.body.removeChild(elem); } catch (e) {}
    }, d || 3000 );
}
//open modal from query string on load
window.addEventListener('load', function() {
	var query = (new URL(document.location)).searchParams;
	if(!query.has('open')) { return openHome(); }
	switch(query.get('open')) {
		case 'candybank':
		    openCandyBank();
		break
		case 'permedit':
			openPermedit();
		break
		case 'download':
			downloadParse();
		break
		case 'archive':
			openArchivePanel();
		break
	        default:
                        openHome();
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
	
	(function()  {d=(new Date()); document.getElementById('archive-data-input').value = d.getFullYear() + '-' + (d.getMonth()+1<10?'0'+(d.getMonth()+1):d.getMonth()+1) + '-' + (d.getDate()<10?'0'+d.getDate():d.getDate()) })()

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
});
//add tooltips
function generateTooltip(elem) {
	var titletext = elem.getAttribute('title');
		elem.setAttribute('title','');
		
		if(elem.style.position == "") elem.style.position = 'relative';
		var tooltipElem = document.createElement('div');
		
		tooltipElem.classList.add('tooltip');
		tooltipElem.innerHTML = titletext;
		document.body.appendChild(tooltipElem);
		
		tooltipElem.addEventListener('mouseover',function(e) {
			e.stopPropagation;
		});
		
		elem.addEventListener('mouseover', function() {
			tooltipElem.style.display = 'inline-block';
			elem.title = '';
			
			var newElemPos = elem.getBoundingClientRect();
			
			tooltipElem.style.left = newElemPos.left + ((elem.clientWidth-tooltipElem.clientWidth)/2);
			
			if(newElemPos.top < tooltipElem.clientHeight * 2) {
				tooltipElem.style.top = newElemPos.top + newElemPos.height + 5;
			} else {
				tooltipElem.style.top = newElemPos.top - tooltipElem.clientHeight - 5;
			}
		});
		elem.addEventListener('mouseout', function() {
			tooltipElem.style.display = 'none';
		});
}
window.addEventListener('load', function() {
	document.querySelectorAll('*[title]').forEach(generateTooltip);
	
});
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
    e.clipboardData.setData("text/plain", str);
    e.preventDefault();
	if(notify) { snackbar('Data copied!',3000,'suc') }
  }
  document.addEventListener("copy", listener);
  document.execCommand("copy");
  document.removeEventListener("copy", listener);
};

