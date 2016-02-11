define([
    '/common/treesome.js'
], function (Tree) {
    window.Tree = Tree;
    // do some function for the start and end of the cursor
    var startAndStop = function (f) { ['start', 'end'].forEach(f); };

    var log = function (x) {
        console.log(x);
    };

    var error = function (x) {
        console.log(x);
    };

    return function (CK, editor, inner) {
        var makeCKElement = function (el) { return new CK.dom.node(el); };

        var cursor = {};
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
        //window.cursor = cursor;
    
        cursor.lost = function () {
            return !(Tree.contains(Range.start.el.$, inner) &&
                Tree.contains(Range.end.el.$, inner));
        };

        cursor.update = function () {
            log("Updating cursor position");
            // get ranges
            var ranges = editor.getSelection().getRanges();
            // there should be at least one
            if (!ranges.length) { 
                // FIXME make error
                log("No ranges");
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
                    Range[pos].tags = Tree.tagsUntilElement(range[C].$, inner);
                }
                // update offsets no matter what
                Range[pos].offset = range[O];
            });
        };

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

        // FIXME remove
        window.recoverCursor = function () {
            cursor.update();
            var success = cursor.find();
            return success;
        };

        // TODO under what circumstances will the length of getRanges be zero?
        var range;
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

            // FIXME rename 'range', since it's going to get confusing
            var range = ranges[0] || range; // {startContainer, startOffset, endContainer, endOffset, collapsed, document, root}
            range.setStart(Range.start.el, Range.start.offset);
            range.setEnd(Range.end.el, Range.end.offset);
            sel.selectRanges([range]);
        };

        var seekToOffset = function (el, offset) {
            if (!el) {
                log("No element provided!");
                return null;
            }
            log("Seeking to offset");
            // FIXME better debugging
            // console.log(el, offset);
            if (!el.textContent) {
                // FIXME wat
                var el2 = Tree.previousNode(el, inner);
                log("No text content available!");
                return null;
            }
            if (offset === 0) {
                return {
                    el: el,
                    offset: offset
                };
            }
            if (offset < 0) {
                // seek backwards
                var el2 = Tree.previousNode(el, inner);
                if (!el2) { return null; }
                var adjusted = el2.textContent.length;
                // FIXME TypeError: el.textContent is undefined
                return seekToOffset(el2, (l - 1) - el.textContent.length);
            } else {
                var l = el.textContent.length;
                if (offset > l) {
                    var el2 = Tree.nextNode(el, inner);
                    if (!el2) { return null; }
                    var adjusted = el2.textContent.length;
                // FIXME TypeError: el.textContent is undefined
                    return seekToOffset(el2, (l - 1) - el.textContent.length);
                } else {
                    return {
                        el: el,
                        offset: offset
                    };
                }
            }
        };

        cursor.delta = function (d) {
            //d = d === 0? 0 : d < 0? -1: 1;
            cursor.Range.start.offset += d;

            //var temp = cursor.Range.start.
            /*  seekToOffset(cursor.Range.start.el.$, d); // might be null

                if seeking backward and result is null, drop them at the start of the document
                if seeking forward and result is null, drop them at the end */

            var Selected = ['start', 'end'].map(function (pos) {
                var el = cursor.Range[pos].el,
                    offset = cursor.Range[pos].offset;
                return seekToOffset(el, offset + d);
            });

            /* TODO validate Selected


            */

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
