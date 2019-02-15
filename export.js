module.exports = function(commits, callback) {
	//var docs = docsClient;
    var html = `<div style="color:black;background:none;font-family:'Times New Roman', serif;font-size:12pt;"><p style="color:red">This document has been automatically generated.</p><br>`;
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
    // > make array of Docs changes that we will put into the request
    for(var i = 0; i < commitDays.length; i++) {
        var thisDay = commitDays[i];
        html = html + `<h2>Documentation for ${thisDay.day}</h2>`
        
        var t1 = t2 = t3 = `<table style="border-collapse:collapse;border:1px solid black;"><tbody><tr style="font-weight:bold;"><th>People</th><th>Problem</th><th>Solution?</th><th>Pictures</th></tr>`
        for(var _i = 0; _i < thisDay.commits.length; _i++) {
            var thisCommit = thisDay.commits[i];
            var thesePictures = "";
            for(var i = 1; i < 5; i++) {
                if(thisCommit['picture' + i]) { thesePictures = thesePictures + "https://notes.clh.sh/image/" + thisCommit.id + "/" + i + '<br>'; }
            }
         
            if(thisCommit.isonteam == 0) {
                //software
                t1 = t1 + `<tr><td>${thisCommit.humannames}</td><td>${thisCommit.problem}</td><td>${(thisCommit.solution || "")}</td><td>${thesePictures}</td></tr>` 
            } else if(thisCommit.isonteam == 1) {
                //hardware
                t2 = t2 + `<tr><td>${thisCommit.humannames}</td><td>${thisCommit.problem}</td><td>${(thisCommit.solution || "")}</td><td>${thesePictures}</td></tr>`
            } else {
                //other
                t3 = t3 + `<tr><td>${thisCommit.humannames}</td><td>${thisCommit.problem}</td><td>${(thisCommit.solution || "")}</td><td>${thesePictures}</td></tr>`
            }
        }
        t1 = t1 + `</tbody></table>`
        t2 = t2 + `</tbody></table>`
        t3 = t3 + `</tbody></table>`
        
        html = html + t1 + t2 + t3 + `<p style="page-break-after: always"></p>`;
    }
    
    return callback(html);
    

}