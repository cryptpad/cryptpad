define([
    '/common/treesome.js',
    '/bower_components/rangy/rangy-core.min.js'
], function (Tree, Rangy, saveRestore) {
    window.Rangy = Rangy;
    window.Tree = Tree;
    // do some function for the start and end of the cursor

    var log = function (x) { console.log(x); };
    var error = function (x) { console.log(x); };
    var verbose = function (x) { if (window.verboseMode) { console.log(x); } };

    /* accepts the document used by the editor */
    return function (inner) {
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

        /* FIXME we shouldn't use this, as only one might have been lost */
        cursor.lost = function () {
            return !(Tree.contains(Range.start.el.$, inner) &&
                Tree.contains(Range.end.el.$, inner));
        };

        // assumes a negative index
        var seekLeft = cursor.seekLeft = function (el, delta, current) {
            var textLength;
            var previous;

            // normalize

            if (-delta >= current) {
                delta += current;
                current = 0;
            } else {
                current += delta;
                delta = 0;
            }

            while (delta) {
                previous = el;
                el = Tree.previousNode(el, inner);
                if (el) {
                    textLength = el.textContent.length;
                    if (-delta > textLength) {
                        delta -= textLength;
                    } else {
                        current = textLength + delta;
                        delta = 0;
                    }
                } else {
                    return {
                        el: previous,
                        offset: 0,
                        error: "out of bounds"
                    };
                }
            }
            return {
                el: el,
                offset: current
            };
        };

        // seekRight assumes a positive delta
        var seekRight = cursor.seekRight = function (el, delta, current) {
            var textLength;
            var previous;

            // normalize
            delta += current;
            current = 0;

            while (delta) {
                if (el) {
                    textLength = el.textContent.length;
                    if (delta >= textLength) {
                        delta -= textLength;
                        previous = el;
                        el = Tree.nextNode(el, inner);
                    } else {
                        current = delta;
                        delta = 0;
                    }
                } else {
                    // don't ever return a negative index
                    if (previous.textContent.length) {
                        textLength = previous.textContent.length - 1;
                    } else {
                        textLength = 0;
                    }
                    return {
                        el: previous,
                        offset: textLength,
                        error: "out of bounds"
                    };
                }
            }
            return {
                el: el,
                offset: current
            };
        };

        var seekToDelta = cursor.seekToDelta = function (el, delta, current) {
            var result = null;
            if (el) {
                if (delta < 0)  {
                    return seekLeft(el, delta, current);
                } else if (delta > 0) {
                    return seekRight(el, delta, current);
                } else {
                    result = {
                        el: el,
                        offset: current
                    };
                }
            } else {
                error("[seekToDelta] el is undefined");
            }
            return result;
        };

        /* cursor.update takes notes about wherever the cursor was last seen
            in the event of a cursor loss, the information produced by side
            effects of this function should be used to recover the cursor

            returns an error string if no range is found
        */
        cursor.update = function (sel, root) {
            verbose("cursor.update");
            root = root || inner;
            sel = sel || Rangy.getSelection(root);
            //if (!sel.rangeCount) { return 'no ranges found'; }
            var range = sel.getRangeAt(0);
  
            // Big R Range is caught in closure, and maintains persistent state
            Range.start.el = range.startContainer;
            Range.start.offset = range.startOffset;
            Range.start.parents = Tree.parentsOf(Range.start.el, root);

            Range.end.el = range.endContainer;
            Range.end.offset = range.endOffset;
            Range.end.parents = Tree.parentsOf(Range.end.el, root);
        };

        /* cursor.find uses information produced by side effects of 'update'
            to recover the cursor
        */
        cursor.find = function () { };

        /* 

        */
        cursor.recover = function () { };

        cursor.delta = function (delta, collapse) {
            var sel = Rangy.getSelection(inner);

            // update returns errors if there are problems
            // and updates the persistent Range object
            var err = cursor.update(sel, inner);
            if (err) { return err; }

            // create a range to modify
            var range = Rangy.createRange();

            /*
                The assumption below is that Range.(start|end).el
                actually exists. This might not be the case.
                TODO check if start and end elements are defined
            */

            // using infromation about wherever you were last...
            // move both parts by some delta
            var start = seekToDelta(Range.start.el, delta, Range.start.offset);
            var end = seekToDelta(Range.end.el, delta, Range.end.offset);

            /*  if range is backwards, cursor.delta fails
                so check if they're in the expected order
                before setting the new range */
            if (Tree.orderOfNodes(start.el, end.el, inner) === -1) {
                range.setStart(end.el, end.offset);
                range.setEnd(start.el, start.offset);
            } else {
                range.setStart(start.el, start.offset);
                range.setEnd(end.el, end.offset);
            }

            // actually set the cursor to the new range
            sel.setSingleRange(range);
            if (delta < 0) {
                // seeking left, so start might have an error
                return start.error;
            } else {
                return end.error;
            }
        };

        return cursor;
    };
});
