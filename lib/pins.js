/*jshint esversion: 6 */

var Pins = module.exports;

/*  Accepts a reference to an object, and...
    either a string describing which log is being processed (backwards compatibility),
    or a function which will log the error with all relevant data
*/
var createLineHandler = Pins.createLineHandler = function (ref, errorHandler) {
    var fileName;
    if (typeof(errorHandler) === 'string') {
        fileName = errorHandler;
        errorHandler = function (label, data) {
            console.error(label, {
                log: fileName,
                data: data,
            });
        };
    }

    // passing the reference to an object allows us to overwrite accumulated pins
    // make sure to get ref.pins as the result
    // it's a weird API but it's faster than unpinning manually
    var pins = ref.pins = {};
    return function (line) {
        if (!Boolean(line)) { return; }

        var l;
        try {
            l = JSON.parse(line);
        } catch (e) {
            return void errorHandler('PIN_LINE_PARSE_ERROR', line);
        }

        if (!Array.isArray(l)) {
            return void errorHandler('PIN_LINE_NOT_FORMAT_ERROR', l);
        }

        switch (l[0]) {
            case 'RESET': {
                pins = ref.pins = {};
                if (l[1] && l[1].length) { l[1].forEach((x) => { ref.pins[x] = 1; }); }
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
                errorHandler("PIN_LINE_UNSUPPORTED_COMMAND", l);
        }
    };
};

/*
    takes contents of a pinFile (UTF8 string)
    and the pin file's name
    returns an array of of channel ids which are pinned

    throw errors on pin logs with invalid pin data
*/
Pins.calculateFromLog = function (pinFile, fileName) {
    var ref = {};
    var handler = createLineHandler(ref, fileName);

    pinFile.split('\n').forEach(handler);
    return Object.keys(ref.pins);
};

// TODO refactor to include a streaming version for use in rpc.js as well

