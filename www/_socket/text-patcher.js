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

    if (oldval.length !== commonStart + commonEnd) {
        if (ctx.localChange) { ctx.localChange(true); }
        ctx.remove(commonStart, oldval.length - commonStart - commonEnd);
    }
    if (newval.length !== commonStart + commonEnd) {
        if (ctx.localChange) { ctx.localChange(true); }
        ctx.insert(commonStart, newval.slice(commonStart, newval.length - commonEnd));
        //console.log("insert: " + newval.slice(commonStart, newval.length - commonEnd));
    }
};

var create = function(config) {
    var ctx = config.realtime;

    // initial state will always fail the !== check in genop.
    // because nothing will equal this object
    var content = {};

    // FIXME this is only necessary because we need to be able to update the
    // textarea. This is being deprecated, however. Instead
    var replaceText = function(newText) {
        content = newText;
    };

    // *** remote -> local changes
    ctx.onPatch(function(pos, length) {
        replaceText(ctx.getUserDoc());
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
