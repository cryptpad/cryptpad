define([
    '/common/realtime-input.js'
], function () {
    var ChainPad = window.ChainPad;
    var JsonOT = {};

    var validate = JsonOT.validate = function (text, toTransform, transformBy) {
        var DEBUG = window.REALTIME_DEBUG = window.REALTIME_DEBUG || {};

        var resultOp, text2, text3;
        try {
            // text = O (mutual common ancestor)
            // toTransform = A (the first incoming operation)
            // transformBy = B (the second incoming operation)
            // threeway merge (0, A, B)

            resultOp = ChainPad.Operation.transform0(text, toTransform, transformBy);

            /*  if after operational transform we find that no op is necessary
                return null to ignore this patch */
            if (!resultOp) { return null; }

            text2 = ChainPad.Operation.apply(transformBy, text);
            text3 = ChainPad.Operation.apply(resultOp, text2);
            try {
                JSON.parse(text3);
                return resultOp;
            } catch (e) {
                console.error(e);
                var info = DEBUG.ot_parseError = {
                    type: 'resultParseError',
                    resultOp: resultOp,

                    toTransform: toTransform,
                    transformBy: transformBy,

                    text1: text,
                    text2: text2,
                    text3: text3,
                    error: e
                };
                console.log('Debugging info available at `window.REALTIME_DEBUG.ot_parseError`');
            }
        } catch (x) {
            console.error(x);
            window.DEBUG.ot_applyError = {
                type: 'resultParseError',
                resultOp: resultOp,

                toTransform: toTransform,
                transformBy: transformBy,

                text1: text,
                text2: text2,
                text3: text3,
                error: x
            };
            console.log('Debugging info available at `window.REALTIME_DEBUG.ot_applyError`');
        }

        // returning **null** breaks out of the loop
        // which transforms conflicting operations
        // in theory this should prevent us from producing bad JSON
        return null;
    };

    return JsonOT;
});
