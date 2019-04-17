/*jshint esversion: 6 */

var Pins = module.exports;

/*
    takes contents of a pinFile (UTF8 string)
    and the pin file's name
    returns an array of of channel ids which are pinned

    throw errors on pin logs with invalid pin data
*/
Pins.calculateFromLog = function (pinFile, fileName) {
    var pins = {};
    pinFile.split('\n').filter((x)=>(x)).map((l) => JSON.parse(l)).forEach((l) => {
        switch (l[0]) {
            case 'RESET': {
                pins = {};
                if (l[1] && l[1].length) { l[1].forEach((x) => { pins[x] = 1; }); }
                //jshint -W086
                // fallthrough
            }
            case 'PIN': {
                l[1].forEach((x) => { pins[x] = 1; });
                break;
            }
            case 'UNPIN': {
                l[1].forEach((x) => { delete pins[x]; });
                break;
            }
            default:
                // FIXME logging
                // TODO write to the error log
                /* Log.error('CORRUPTED_PIN_LOG', {
                    line: JSON.stringify(l),
                    fileName: fileName,
                }); */
                console.error(new Error (JSON.stringify(l) + '  ' + fileName));
        }
    });
    return Object.keys(pins);
};

// TODO refactor to include a streaming version for use in rpc.js as well
