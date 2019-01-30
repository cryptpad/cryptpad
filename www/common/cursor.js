define([
    '/common/cursor-treesome.js',
    '/bower_components/rangy/rangy-core.min.js'
], function (Tree, Rangy) {
    var verbose = function (x) { if (window.verboseMode) { console.log(x); } };

    /* accepts the document used by the editor */
    var Cursor = function (inner) {
        var cursor = {};

        var getTextNodeValue = function (el) {
            if (!el.data) { return; }
            // We want to transform html entities into their code (non-breaking spaces into $&nbsp;)
            var div = document.createElement('div');
            div.innerText = el.data;
            return div.innerHTML;
        };

        // Store the cursor position as an offset from the beginning of the text HTML content
        var offsetRange = cursor.offsetRange = {
            start: 0,
            end: 0
        };

        // Get the length of the opening tag of an node (<body class="cp"> ==> 17)
        var getOpeningTagLength = function (node) {
            if (node.nodeType === node.TEXT_NODE) { return 0; }
            var html = node.outerHTML;
            var tagRegex = /^(<\s*[a-zA-Z-]*[^>]*>)(.+)/;
            var match = tagRegex.exec(html);
            var res = match && match.length > 1 ? match[1].length : 0;
            return res;
        };

        // Get the offset recursively. We start with <body> and continue following the
        // path to the range
        var offsetInNode = function (element, offset, path, range) {
            if (path.length === 0) {
                offset += getOpeningTagLength(range.el);
                if (range.el.nodeType === range.el.TEXT_NODE) {
                    var div = document.createElement('div');
                    div.innerText = range.el.data.slice(0, range.offset);
                    return offset + div.innerHTML.length;
                }
                return offset + range.offset;
            }
            offset += getOpeningTagLength(element);
            for (var i = 0; i < element.childNodes.length; i++) {
                if (element.childNodes[i] === path[0]) {
                    return offsetInNode(path.shift(), offset, path, range);
                }
                // It is not yet our path, add the length of the text node or tag's outerHTML
                offset += (getTextNodeValue(element.childNodes[i]) || element.childNodes[i].outerHTML).length;
            }
        };

        // Get the cursor position as a range and transform it into
        // an offset from the beginning of the outer HTML
        var getOffsetFromRange = function (element) {
            var doc = element.ownerDocument || element.document;
            var win = doc.defaultView || doc.parentWindow;
            var o = {
                start: 0,
                end: 0
            };
            if (typeof win.getSelection !== "undefined") {
                var sel = win.getSelection();
                if (sel.rangeCount > 0) {
                    var range = win.getSelection().getRangeAt(0);
                    // Do it for both start and end
                    ['start', 'end'].forEach(function (t) {
                        var inNode = {
                            el: range[t + 'Container'],
                            offset: range[t + 'Offset']
                        };
                        while (inNode.el.nodeType !== Node.TEXT_NODE && inNode.el.childNodes.length > inNode.offset) {
                            inNode.el = inNode.el.childNodes[inNode.offset];
                            inNode.offset = 0;
                        }
                        var current = inNode.el;
                        var path = [];
                        while (current !== element) {
                            path.unshift(current);
                            current = current.parentNode;
                        }

                        if (current === element) { // Should always be the case
                            o[t] = offsetInNode(current, 0, path, inNode);
                        } else {
                            console.error('???');
                        }
                    });
                }
            }
            return o;
        };

        // Update the value of the offset
        // This should be called before applying changes to the document
        cursor.offsetUpdate = function () {
            try {
                var range = getOffsetFromRange(inner);
                offsetRange.start = range.start;
                offsetRange.end = range.end;
            } catch (e) {
                console.error(e);
            }
        };

        // Transform the offset value using the operations from the diff
        // between the old and the new states of the document.
        var offsetTransformRange = function (offset, ops) {
            var transformCursor = function (cursor, op) {
                if (!op) { return cursor; }

                var pos = op.offset;
                var remove = op.toRemove;
                var insert = op.toInsert.length;
                if (typeof cursor === 'undefined') { return; }
                if (typeof remove === 'number' && pos < cursor) {
                    cursor -= Math.min(remove, cursor - pos);
                }
                if (typeof insert === 'number' && pos < cursor) {
                    cursor += insert;
                }
                return cursor;
            };
            var c = offset;
            if (Array.isArray(ops)) {
                for (var i = ops.length - 1; i >= 0; i--) {
                    c = transformCursor(c, ops[i]);
                }
                offset = c;
            }
            return offset;
        };

        // Get the range starting from <body> and the offset value.
        // We substract length of HTML content to the offset until we reach a text node or 0.
        // If we reach a text node, it means we're in the final possible child and the
        // current valu of the offset is the range one.
        // If we reach 0 or a negative value, it means the range in is the current tag
        // and we should use offset 0.
        var getFinalRange = function (el, offset) {
            if (el.nodeType === el.TEXT_NODE) {
                // This should be the final text node
                var txt = document.createElement("textarea");
                txt.appendChild(el.cloneNode());
                txt.innerHTML = txt.innerHTML.slice(0, offset);
                return {
                    el: el,
                    offset: txt.value.length
                };
            }
            if (el.tagName === 'BR') {
                // If the range is in a <br>, we have a brFix that will make it better later
                return {
                    el: el,
                    offset: 0
                };
            }

            // Remove the current tag opening length
            offset = offset - getOpeningTagLength(el);

            if (offset <= 0) {
                // Return the current node...
                return {
                    el: el,
                    offset: 0
                };
            }

            // For each child, if they length is greater than the current offset, they are
            // containing the range element we're looking for.
            // Otherwise, our range element is in a later sibling and we can just substract
            // their length.
            var newOffset = offset;
            for (var i = 0; i < el.childNodes.length; i++) {
                try {
                newOffset -= (getTextNodeValue(el.childNodes[i]) || el.childNodes[i].outerHTML).length;
                } catch (e) {
                    console.log(el);
                    console.log(el.childNodes[i]);
                }
                if (newOffset <= 0) {
                    return getFinalRange(el.childNodes[i], offset);
                }
                offset = newOffset;
            }

            // New offset ends up in the closing tag
            // ==> return the last child...
            if (el.childNodes.length) {
                return getFinalRange(el.childNodes[el.childNodes.length - 1], offset);
            } else {
                return {
                    el: el,
                    offset: 0
                };
            }
        };

        // Transform an offset into a range that we can use to restore the cursor
        var getRangeFromOffset = function (element) {
            var range = {
                start: {
                    el: null,
                    offset: 0
                },
                end: {
                    el: null,
                    offset: 0
                }
            };

            ['start', 'end'].forEach(function (t) {
                var offset = offsetRange[t];
                var res = getFinalRange(element, offset);
                range[t].el = res.el;
                range[t].offset = res.offset;
            });


            return range;
        };

        cursor.getNewOffset = function (ops) {
            return {
                selectionStart: offsetTransformRange(offsetRange.start, ops),
                selectionEnd: offsetTransformRange(offsetRange.end, ops)
            };
        };
        cursor.getNewRange = function (data, ops) {
            offsetRange.start = offsetTransformRange(data.start, ops);
            offsetRange.end = offsetTransformRange(data.end, ops);
            var range = getRangeFromOffset(inner);
            return range;
        };

        // Restore the cursor position after applying the changes.
        cursor.restoreOffset = function (ops) {
            try {
                offsetRange.start = offsetTransformRange(offsetRange.start, ops);
                offsetRange.end = offsetTransformRange(offsetRange.end, ops);
                var range = getRangeFromOffset(inner);
                var sel = cursor.makeSelection();
                var r = cursor.makeRange();
                cursor.fixStart(range.start.el, range.start.offset);
                cursor.fixEnd(range.end.el, range.end.offset);
                cursor.fixSelection(sel, r);
                cursor.brFix();
            } catch (e) {
                console.error(e);
            }
        };

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
                //console.error(errText);
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

        cursor.transformRange = function (cursorRange, ops) {
            var transformCursor = function (cursor, op) {
                if (!op) { return cursor; }

                var pos = op.offset;
                var remove = op.toRemove;
                var insert = op.toInsert.length;
                if (typeof cursor === 'undefined') { return; }
                if (typeof remove === 'number' && pos < cursor) {
                    cursor -= Math.min(remove, cursor - pos);
                }
                if (typeof insert === 'number' && pos < cursor) {
                    cursor += insert;
                }
                return cursor;
            };
            var c = cursorRange.offset;
            if (Array.isArray(ops)) {
                for (var i = ops.length - 1; i >= 0; i--) {
                    c = transformCursor(c, ops[i]);
                }
                cursorRange.offset = c;
            }
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
