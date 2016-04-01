define(function () {

/* applyChange takes:
    ctx: the context (aka the realtime)
    oldval: the old value
    newval: the new value

    it performs a diff on the two values, and generates patches
    which are then passed into `ctx.remove` and `ctx.insert`
*/
var applyChange = function(ctx, oldval, newval) {
    // Strings are immutable and have reference equality. I think this test is O(1), so its worth doing.
    if (oldval === newval) {
        return;
    }

    var commonStart = 0;
    while (oldval.charAt(commonStart) === newval.charAt(commonStart)) {
        commonStart++;
    }

    var commonEnd = 0;
    while (oldval.charAt(oldval.length - 1 - commonEnd) === newval.charAt(newval.length - 1 - commonEnd) &&
        commonEnd + commonStart < oldval.length && commonEnd + commonStart < newval.length) {
        commonEnd++;
    }

    var result;

    /*  throw some assertions in here before dropping patches into the realtime

    */

    if (oldval.length !== commonStart + commonEnd) {
        if (ctx.localChange) { ctx.localChange(true); }
        result = oldval.length - commonStart - commonEnd;
        ctx.remove(commonStart, result);
        console.log('removal at position: %s, length: %s', commonStart, result);
        console.log("remove: [" + oldval.slice(commonStart, commonStart + result ) + ']');
    }
    if (newval.length !== commonStart + commonEnd) {
        if (ctx.localChange) { ctx.localChange(true); }
        result = newval.slice(commonStart, newval.length - commonEnd);
        ctx.insert(commonStart, result);
        console.log("insert: [" + result + "]");
    }

    var userDoc;
    try {
        var userDoc = ctx.getUserDoc();
        JSON.parse(userDoc);
    } catch (err) {
        console.error('[textPatcherParseErr]');
        console.error(err);
        window.REALTIME_MODULE.textPatcher_parseError = {
            error: err,
            userDoc: userDoc
        };
    }
};

var create = function(config) {
    var ctx = config.realtime;

    // initial state will always fail the !== check in genop.
    // because nothing will equal this object
    var content = {};

    // *** remote -> local changes
    ctx.onPatch(function(pos, length) {
        content = ctx.getUserDoc()
    });

    // propogate()
    return function (newContent) {
        if (newContent !== content) {
            applyChange(ctx, ctx.getUserDoc(), newContent);
            if (ctx.getUserDoc() !== newContent) {
                console.log("Expected that: `ctx.getUserDoc() === newContent`!");
            }
            return true;
        }
        return false;
    };
};

return { create: create };
});
