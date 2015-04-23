// Notifies about Jenkins build errors via Jenkins Notification Plugin
//
// Dependencies:
//   "url": ""
//   "querystring": ""
//
// Configuration:
//   Just put this url <HUBOT_URL>:<PORT>/hubot/jenkins-notify?room=<room> to your Jenkins
//   Notification config. See here: https://wiki.jenkins-ci.org/display/JENKINS/Notification+Plugin
//
// Commands:
//   None
//
// URLS:
//   POST /hubot/jenkins-notify?room=<room>[&type=<type>]
//
// Authors:
//   spajus, cmckendry, andromedado, JasonSmiley

var url = require('url');
var querystring = require('querystring');
var http = require('http');

var IntervalMinutes = 30;
var MaxSoundsPerInterval = 2;//For any given interval, there will be no more than this number of jenkins sounds
//10 - 1 = One Sound per ten minutes
//30 - 2 = For any given half hour, at most two sounds will play



var soundsSoFar = 0;

function makeSound (urlOfSound) {
    if (!(/http/.test(urlOfSound))) {
        urlOfSound = 'http://xserve:5051/' + urlOfSound;
    }

    if (soundsSoFar >= MaxSoundsPerInterval) {
        console.log('[%d/%d Build Sounds] : No available slots for %s', soundsSoFar, MaxSoundsPerInterval, urlOfSound);
        return;
    }
    soundsSoFar += 1;
    console.log('[%d/%d Build Sounds] : Slot taken by %s', soundsSoFar, MaxSoundsPerInterval, urlOfSound);
    setTimeout(function () {
        soundsSoFar -= 1;
        console.log('[%d/%d Build Sounds] : Slot opened up!', soundsSoFar, MaxSoundsPerInterval);
    }, IntervalMinutes * 60 * 1000);

    http.get(urlOfSound, function(res) {
        return console.log('[%s] GET %s', res.statusCode, urlOfSound);
    });
}

module.exports = function(robot) {

    var foo = {};

    return robot.router.post("/hubot/jenkins-notify", function(req, res) {
        var build, data, envelope, query, room;
        foo.failing = foo.failing || [];
        query = querystring.parse(url.parse(req.url).query);
        res.end('');
        envelope = {};
        envelope.user = {};
        if (query.room) {
            envelope.room = query.room;
        }
        if (query.type) {
            envelope.user.type = query.type;
        }
        room = 'dev';
        try {
            data = req.body;
            console.log("BUILD: " + data.name + " - #" + data.build.number + ": " + data.build.status);
            if (data.build.phase === 'STARTED') {
                if (data.name.match(/mothra.*qa/i)) {
                    makeSound('mothra-qa');
                }
            }
            if (data.build.phase === 'COMPLETED') {
                if (data.name.match(/.*qa.*/i) && !data.name.match(/.*selenium.*/i)) {
                    var qaMsg = data.name + " build #" + data.build.number + " : " + data.build.status + " -- " + data.build.full_url;
                    console.log("Notifying QA: %s", qaMsg);
                    robot.messageRoom('#qa', qaMsg);
                }
                if (data.build.status === 'FAILURE') {
                    if (foo.failing.indexOf(data.name) >= 0) {
                        build = "is still";
                    } else {
                        build = "started";
                    }
                    robot.messageRoom(room, "" + data.name + " build #" + data.build.number + " " + build + " failing (" + (encodeURI(data.build.full_url)) + ")");
                    if (foo.failing.indexOf(data.name) < 0) {
                        foo.failing.push(data.name);
                    }
                    if (data.name.match(/mothra.*qa/i)) {
                        console.log("MOTHRA!!");
                        console.log(res.statusCode);
                        robot.messageRoom('#dev', "Mothra has the upper hand!");
                        robot.messageRoom('#dev', "http://i.imgur.com/CoqJxBx.gif");
                    }
                    if (data.name === 'MechaGodzilla .com (Prod)') {
                        console.log("MECHA GODZILLA!!!!");
                        console.log(res.statusCode);
                        makeSound('mechawins');
                        robot.messageRoom('qa-chat', "Mecha Godzilla is winning!:poop::poop::poop:");
                        robot.messageRoom('qa-chat', "http://i.imgur.com/AoeZXir.gif");
                    }
                }
                if (data.build.status === 'SUCCESS') {
                    if (data.name === '1stdibs.com Deploy Production PROD PROD PROD PROD') {
                        makeSound('shipit');
                        robot.messageRoom("#release", "1stdibs.com hotfix has been release!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.name === 'Admin-v2 Deploy (PROD)') {
                        makeSound('shipit-adminv2');
                        robot.messageRoom("#release", "Admin v2 hotfix has been release!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.name === 'Admin-v1 Deploy (PROD) (RACKSPACE)') {
                        makeSound('shipit-adminv1');
                        robot.messageRoom("#release", "Admin v1 hotfix has been release!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.name === 'JAVA-InventoryService (Prod)') {
                        makeSound('shipit-inventory');
                        robot.messageRoom("#release", "Inventory service hotfix has been release!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.name === 'JAVA-IdentityService (Prod)') {
                        makeSound('shipit-identity');
                        robot.messageRoom("#release", "Identity service hotfix has been release!");
                        robot.messageRoom("#release", "I hope you know what you're doing...");
                    }
                    if (data.build && data.build.parameters && data.build.parameters.SERVER_HOSTNAME === 'deathstar.1stdibs.com') {
                        makeSound('deathstar');
                        robot.messageRoom("#dev", "The Death Star is now fully armed and operational");
                    }
                    if (data.name === 'MechaGodzilla .com (Prod)') {
                        console.log("MECHA GODZILLA!!!!");
                        console.log(res.statusCode);
                        makeSound('mechaloses');
                        robot.messageRoom('qa-chat', "Mecha Godzilla has been defeated!:excited_tomato::excited_tomato::excited_tomato:");
                        robot.messageRoom('qa-chat', "http://i.imgur.com/t8tLizl.gif");
                    }
                }
            }
        } catch (error) {
            console.log("jenkins-notify error: " + error + ". Data: " + req.body);
            return console.log(error.stack);
        }
    });
};

