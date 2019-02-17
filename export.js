module.exports = function(commits, callback) {
	//var docs = docsClient;
    var html = `<div style="color:black;background:none;font-family:'Times New Roman', serif;font-size:12pt;"><span style="background-color: rgb(237,158,144);">This is an automatically generated document. Any manual changes may be overwritten.</span><br>`;
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
    // > make html for each day
    for(var i = 0; i < commitDays.length; i++) {
        var thisDay = commitDays[i];
        html = html + `<h2>Documentation for ${thisDay.day}</h2>`
        
        var t1 = t2 = t3 = `<table style="border-collapse: collapse; border: 1px solid black;"><tbody><tr><th style="border:1px solid black;font-weight:bold;color:white;font-weight:bold;background-color:rgb(39, 78, 19);">People</th><th style="border:1px solid black;font-weight:bold;color:white;font-weight:bold;background-color:rgb(39, 78, 19);">Problem</th><th style="border:1px solid black;font-weight:bold;color:white;font-weight:bold;background-color:rgb(39, 78, 19);">Solution?</th><th style="border:1px solid black;font-weight:bold;color:white;font-weight:bold;background-color:rgb(39, 78, 19);">Pictures</th></tr>`;
        for(var _i = 0; _i < thisDay.commits.length; _i++) {
            var thisCommit = thisDay.commits[_i];
            var thesePictures = "";
            for(var __i = 1; __i < 5; __i++) {
                if(thisCommit['picture' + __i]) { thesePictures = thesePictures + "<a target=\"_blank\" href=\"https://notes.clh.sh/image/" + thisCommit.id + "/" + __i + '">['+__i+']</a>'+(thisCommit['picture' + (__i+1)]?',':'')+''; }
            }
            if(thisCommit.isonteam == 0) {
                //software
                t1 = t1 + `<tr><td style="border:1px solid black">${thisCommit.humannames}</td><td style="border:1px solid black">${thisCommit.problem}</td><td style="border:1px solid black">${(thisCommit.solution || "")}</td><td style="border:1px solid black">${thesePictures}</td></tr>` 
            } else if(thisCommit.isonteam == 1) {
                //hardware
                t2 = t2 + `<tr><td style="border:1px solid black">${thisCommit.humannames}</td><td style="border:1px solid black">${thisCommit.problem}</td><td style="border:1px solid black">${(thisCommit.solution || "")}</td><td style="border:1px solid black">${thesePictures}</td></tr>`
            } else {
                //other
                t3 = t3 + `<tr><td style="border:1px solid black">${thisCommit.humannames}</td><td style="border:1px solid black">${thisCommit.problem}</td><td style="border:1px solid black">${(thisCommit.solution || "")}</td><td style="border:1px solid black">${thesePictures}</td></tr>`
            }
        }
        t1 = t1 + `</tbody></table><br>`
        t2 = t2 + `</tbody></table><br>`
        t3 = t3 + `</tbody></table><br>`
        
        html = html + `<p>Software</p>` + t1 + `<p>Hardware</p>` + t2 + `<p>Other</p>` + t3 + `<hr class="pb">`;
    }
    
	html = html + '</div>'
	
    return callback(html);
    

}
