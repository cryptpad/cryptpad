define([
    '/common/treesome.js',
    '/bower_components/rangy/rangy-core.min.js'
], function (Tree, Rangy) {
    var verbose = function (x) { if (window.verboseMode) { console.log(x); } };

    /* accepts the document used by the editor */
    var Cursor = function (inner) {
        var cursor = {};

        // there ought to only be one cursor at a time, so let's just
        // keep it internally
        var Range = cursor.Range = {
            start: {
                el: null,
                offset: 0
            },
            end: {
                el: null,
                offset:0
            }
        };

        /*  cursor.update takes notes about wherever the cursor was last seen
            in the event of a cursor loss, the information produced by side
            effects of this function should be used to recover the cursor

            returns an error string if no range is found
        */
        cursor.update = function (sel, root) {
            verbose("cursor.update");
            root = root || inner;
            sel = sel || Rangy.getSelection(root);

            // if the root element has no focus, there will be no range
            if (!sel.rangeCount) { return; }
            var range = sel.getRangeAt(0);

            // Big R Range is caught in closure, and maintains persistent state
            ['start', 'end'].forEach(function (pos) {
                Range[pos].el = range[pos+'Container'];
                Range[pos].offset = range[pos+'Offset'];
            });
        };

        cursor.exists = function () {
            return (Range.start.el?1:0) | (Range.end.el?2:0);
        };

        /*
            0 if neither
            1 if start
            2 if end
            3 if start and end
        */
        cursor.inNode = function (el) {
            var state = ['start', 'end'].map(function (pos, i) {
                return Tree.contains(el, Range[pos].el)? i +1: 0;
            });
            return state[0] | state[1];
        };

        var confineOffsetToElement = cursor.confineOffsetToElement = function (el, offset) {
            return Math.max(Math.min(offset, el.textContent.length), 0);
        };

        var makeSelection = cursor.makeSelection = function () {
            var sel = Rangy.getSelection(inner);
            return sel;
        };

        var makeRange = cursor.makeRange = function () {
            return Rangy.createRange();
        };

        var fixStart = cursor.fixStart = function (el, offset) {
            Range.start.el = el;
            Range.start.offset = confineOffsetToElement(el,
                (typeof offset !== 'undefined') ? offset : Range.start.offset);
        };

        var fixEnd = cursor.fixEnd = function (el, offset) {
            Range.end.el = el;
            Range.end.offset = confineOffsetToElement(el,
                (typeof offset !== 'undefined') ? offset : Range.end.offset);
        };

        var fixSelection = cursor.fixSelection = function (sel, range) {
            try {
            if (Tree.contains(Range.start.el, inner) && Tree.contains(Range.end.el, inner)) {
                var order = Tree.orderOfNodes(Range.start.el, Range.end.el, inner);
                var backward;

                // this could all be one line but nobody would be able to read it
                if (order === -1) {
                    // definitely backward
                    backward = true;
                } else if (order === 0) {
                    // might be backward, check offsets to know for sure
                    backward = (Range.start.offset > Range.end.offset);
                } else {
                    // definitely not backward
                    backward = false;
                }

                if (backward) {
                    range.setStart(Range.end.el, Range.end.offset);
                    range.setEnd(Range.start.el, Range.start.offset);
                } else {
                    range.setStart(Range.start.el, Range.start.offset);
                    range.setEnd(Range.end.el, Range.end.offset);
                }

                // actually set the cursor to the new range
                sel.setSingleRange(range);
            } else {
                var errText = "[cursor.fixSelection] At least one of the " +
                    "cursor nodes did not exist, could not fix selection";
                console.error(errText);
                return errText;
            }
            } catch (e) { console.error(e); }
        };

        cursor.pushDelta = function (oldVal, newVal) {
            if (oldVal === newVal) { return; }
            var commonStart = 0;
            while (oldVal.charAt(commonStart) === newVal.charAt(commonStart)) {
                commonStart++;
            }

            var commonEnd = 0;
            while (oldVal.charAt(oldVal.length - 1 - commonEnd) === newVal.charAt(newVal.length - 1 - commonEnd) &&
                commonEnd + commonStart < oldVal.length && commonEnd + commonStart < newVal.length) {
                commonEnd++;
            }

            var insert = false, remove = false;
            if (oldVal.length !== commonStart + commonEnd) {
                // there was a removal?
                remove = true;
            }
            if (newVal.length !== commonStart + commonEnd) {
                // there was an insertion?
                insert = true;
            }

            var lengthDelta = newVal.length - oldVal.length;

            return {
                commonStart: commonStart,
                commonEnd: commonEnd,
                delta: lengthDelta,
                insert: insert,
                remove: remove
            };
        };

        cursor.brFix = function () {
            cursor.update();
            var start = Range.start;
            var end = Range.end;
            if (!start.el) { return; }

            if (start.el === end.el && start.offset === end.offset) {
                if (start.el.tagName === 'BR') {
                    var br = start.el;

                    var P = (Tree.indexOfNode(br) === 0 ?
                        br.parentNode: br.previousSibling);

                    [cursor.fixStart, cursor.fixEnd].forEach(function (f) {
                        f(P, 0);
                    });

                    cursor.fixSelection(cursor.makeSelection(), cursor.makeRange());
                }
            }
        };

        cursor.lastTextNode = function () {
            var lastEl = Tree.rightmostNode(inner);
            if (lastEl && lastEl.nodeType === 3) { return lastEl; }

            var firstEl = Tree.leftmostNode(inner);

            while (lastEl !== firstEl) {
                lastEl = Tree.previousNode(lastEl, inner);
                if (lastEl && lastEl.nodeType === 3) { return lastEl; }
            }

            return lastEl;
        };

        cursor.firstTextNode = function () {
            var firstEl = Tree.leftmostNode(inner);
            if (firstEl && firstEl.nodeType === 3) { return firstEl; }

            var lastEl = Tree.rightmostNode(inner);

            while (firstEl !== lastEl) {
                firstEl = Tree.nextNode(firstEl, inner);
                if (firstEl && firstEl.nodeType === 3) { return firstEl; }
            }
            return firstEl;
        };

        cursor.setToStart = function () {
            var el = cursor.firstTextNode();
            if (!el) { return; }
            fixStart(el, 0);
            fixEnd(el, 0);
            fixSelection(makeSelection(), makeRange());
            return el;
        };

        cursor.setToEnd = function () {
            var el = cursor.lastTextNode();
            if (!el) { return; }

            var offset = el.textContent.length;

            fixStart(el, offset);
            fixEnd(el, offset);
            fixSelection(makeSelection(), makeRange());
            return el;
        };

        return cursor;
    };

    Cursor.Tree = Tree;

    return Cursor;
});
