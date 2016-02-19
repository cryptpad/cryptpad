define([
    '/common/treesome.js',
    '/bower_components/rangy/rangy-core.min.js'
], function (Tree, Rangy) {

    var Rangy = window.Rangy = Rangy;
    var Tree = window.Tree = Tree;
    // do some function for the start and end of the cursor
    var startAndStop = function (f) { ['start', 'end'].forEach(f); };

    var log = function (x) {
        console.log(x);
    };

    var error = function (x) {
        console.log(x);
    };

    var verbose = function (x) {
        if (window.verboseMode) { console.log(x); }
    };

    /* takes
        the CK lib,
        an instantiated editor
        the document used by the editor
    */
    return function (CK, editor, inner) {
        var cursor = {};

        cursor.CK = CK;
        cursor.editor = editor;

        // CKE has its own internal node datatype that we'll need
        var makeCKElement = cursor.makeCKElement = function (el) { return new CK.dom.node(el); };

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

        // used by vdom.onRemote
        // used by vdom.editor.on('change'
        // used by vdom.document.on('keyup mouseup'
        cursor.update = function () {
            verbose("Updating cursor position");
            // get ranges
            var ranges = editor.getSelection().getRanges();
            // there should be at least one
            if (!ranges.length) { 
                error("No ranges");
                return;
            }

            var range = ranges[0];

            // get cursor start/end elements and offsets
            startAndStop(function (pos) {
                var C = pos + 'Container',
                    O = pos + 'Offset';

                // if the element has changed
                if (!Range[pos].el || Range[pos].el.$ !== range[C].$) {
                    // update it
                    Range[pos].el = range[C];
                    // FIXME WAT
                    //Range[pos].tags = Tree.tagsUntilElement(range[C].$, inner);
                }
                // update offsets no matter what
                Range[pos].offset = range[O];
            });
        };

        // used by vdom.onRemote
        cursor.find = function () {
            var success = true;
            startAndStop(function (pos) {
                var tags = Range[pos].tags;
                var node = Tree.findSameHierarchy(tags, inner);

                if (node) {
                    var temp = makeCKElement(node);
                    if (temp.tagName || temp.nodeName) {
                        Range[pos].el = temp;
                    }
                } else {
                    success = false;
                }
            });
            if (success) {
                log("Found cursor!");
            }
            return success;
        };

        cursor.shift = function (delta) {
            Range.start.offset += delta;
            Range.end.offset += delta;
        };

        // used by vdom.onRemote
        cursor.replace = function () {
            log("Attempting to replace cursor");

            cursor.find();

/*          startAndStop(function (pos) {
                var el = Range[pos].el;
                //Range[pos].el = makeCKElement(el);
                Range[pos].el.$.nodeName = el.nodeName || el.tagName;
            });     */

/*          if (cursor.lost()) {
                console.log("cursor lost");
                if (!cursor.find()) {
                    console.log("Couldn't find cursor!");
                    return false;
                } else {
                }
            }       */

            var sel = editor.getSelection(); // { rev, document, root, isLocked, _ }

            var ranges = sel.getRanges();
            if (!ranges.length) {
                log("No cursor range found");
                if (!range) {
                    return;
                }
            }

            range = ranges[0]; // {startContainer, startOffset, endContainer, endOffset, collapsed, document, root}
            range.setStart(Range.start.el, Range.start.offset);
            range.setEnd(Range.end.el, Range.end.offset);
            sel.selectRanges([range]);
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
                    if (-delta >= textLength) {
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
                    return {
                        el: previous,
                        offset: previous.textContent.length -1,
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
                        offset: offset
                    };
                }
            }
            return result;
        };

        cursor.seekTest = function (delta) {
            var start = cursor.Range.start;
            var last = seekToDelta(start.el.$, delta, start.offset);

            if (last.error) {
                return last.error;
            }

            var result = seekToDelta(last.el, -delta, last.offset);

            if (start.el.$ !== result.el) {
                return "didn't find the right element";
            }
            if (start.offset !== result.offset) {
                return "didn't find the right offset";
            }
        };


        /* FIXME
            TypeError: a.getLength is not a function
        */
        cursor.delta = function (d) {
            //d = d === 0? 0 : d < 0? -1: 1;
            //cursor.Range.start.offset += d;

            //var temp = cursor.Range.start.
            /*  seekToOffset(cursor.Range.start.el.$, d); // might be null
                if seeking backward and result is null, drop them at the start of the document
                if seeking forward and result is null, drop them at the end
            */

            var Selected = ['start', 'end'].map(function (pos) {
                var el = cursor.Range[pos].el,
                    offset = cursor.Range[pos].offset;
                return seekToDelta(el, d, cursor.Range[pos].offset);
            });

            /* TODO validate Selected */
            if (!(Selected[0] && Selected[1])) {
                // one of the cursor positions is undefined
                return;
            } else {
                startAndStop(function (pos, index) {
                    cursor.Range[pos].el = makeCKElement(Selected[index].el);
                    cursor.Range[pos].offset = Selected[index].offset;
                });
            }

            var ranges = editor.getSelection().getRanges();
            ranges[0].setStart(cursor.Range.start.el, cursor.Range.start.offset);
            var sel = editor.getSelection();
            sel.selectRanges([ranges[0]]);
        };

        return cursor;
    };
});
