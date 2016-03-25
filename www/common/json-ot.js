define([
    '/common/realtime-input.js'
], function () {
    var ChainPad = window.ChainPad;
    var JsonOT = {};

    var validate = JsonOT.validate = function (text, toTransform, transformBy) {
        try {
            var resultOp = ChainPad.Operation.transform0(text, toTransform, transformBy);
            var text2 = ChainPad.Operation.apply(transformBy, text);
            var text3 = ChainPad.Operation.apply(resultOp, text2);
            try {
                JSON.parse(text3);
                return resultOp;
            } catch (e) {
                console.error(e);
                console.log({
                    resultOp: resultOp,
                    text2: text2,
                    text3: text3
                });
            }
        } catch (x) {
            console.error(x);
        }

        // returning **null** breaks out of the loop
        // which transforms conflicting operations
        // in theory this should prevent us from producing bad JSON
        return null;
    };

    return JsonOT;
});
