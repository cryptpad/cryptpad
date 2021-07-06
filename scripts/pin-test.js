var Pins = require("../lib/pins");
var Fs = require("fs");

var content = Fs.readFileSync('./data/pins/Bp/BpL3pEyX2IlfsvxQELB9uz5qh+40re0gD6J6LOobBm8=.ndjson', 'utf8');

//var lines = content.split("\n");

//console.log(content);

var result;

for (var i = 0; i < 10000; i++) {
    result = Pins.calculateFromLog(content, function (label, data) {
        console.log([label, data]);
    });
}

//console.log(result, result.length);

