define([
    '/common/realtime-input.js'
], function () {
    var ChainPad = window.ChainPad;
    var JsonOT = {};

    var validate = JsonOT.validate = function (text, toTransform, transformBy) {
        try {
            // text = O (mutual common ancestor)
            // toTransform = A (the first incoming operation)
            // transformBy = B (the second incoming operation)
            // threeway merge (0, A, B)

            var resultOp = ChainPad.Operation.transform0(text, toTransform, transformBy);
            var text2 = ChainPad.Operation.apply(transformBy, text);
            var text3 = ChainPad.Operation.apply(resultOp, text2);
            try {
                JSON.parse(text3);
                return resultOp;
            } catch (e) {
                console.error(e);
                var info = window.REALTIME_MODULE.ot_parseError = {
                    type: 'resultParseError',
                    resultOp: resultOp,

                    toTransform: toTransform,
                    transformBy: transformBy,

                    text1: text,
                    text2: text2,
                    text3: text3,
                    error: e
                };
                console.log('Debugging info available at `window.REALTIME_MODULE.ot_parseError`');
            }
        } catch (x) {
            console.error(x);
            console.error(e);
            var info = window.REALTIME_MODULE.ot_applyError = {
                type: 'resultParseError',
                resultOp: resultOp,

                toTransform: toTransform,
                transformBy: transformBy,

                text1: text,
                text2: text2,
                text3: text3,
                error: e
            };
            console.log('Debugging info available at `window.REALTIME_MODULE.ot_applyError`');
        }

        // returning **null** breaks out of the loop
        // which transforms conflicting operations
        // in theory this should prevent us from producing bad JSON
        return null;
    };

    return JsonOT;
});
