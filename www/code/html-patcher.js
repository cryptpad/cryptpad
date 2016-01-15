/*
 * Copyright 2014 XWiki SAS
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
define([
    '/bower_components/jquery/dist/jquery.min.js',
    '/common/otaml.js'
], function () {

    var $ = jQuery;
    var Otaml = window.Otaml;
    var module = { exports: {} };
    var PARANOIA = true;

    var debug = function (x) { };
    debug = function (x) { console.log(x); };

    var getNextSiblingDeep = function (node, parent)
    {
        if (node.firstChild) { return node.firstChild; }
        do {
            if (node.nextSibling) { return node.nextSibling; }
            node = node.parentNode;
        } while (node && node !== parent);
    };

    var getOuterHTML = function (node)
    {
        var html = node.outerHTML;
        if (html) { return html; }
        if (node.parentNode && node.parentNode.childNodes.length === 1) {
            return node.parentNode.innerHTML;
        }
        var div = document.createElement('div');
        div.appendChild(node.cloneNode(true));
        return div.innerHTML;
    };

    var nodeFromHTML = function (html)
    {
        var e = document.createElement('div');
        e.innerHTML = html;
        return e.childNodes[0];
    };

    var getInnerHTML = function (node)
    {
        var html = node.innerHTML;
        if (html) { return html; }
        var outerHTML = getOuterHTML(node);
        var tw = Otaml.tagWidth(outerHTML);
        if (!tw) { return outerHTML; }
        return outerHTML.substring(tw, outerHTML.lastIndexOf('</'));
    };

    var uniqueId = function () { return 'uid-'+(''+Math.random()).slice(2); };

    var offsetOfNodeOuterHTML = function (docText, node, dom, ifrWindow)
    {
        if (PARANOIA && getInnerHTML(dom) !== docText) { throw new Error(); }
        if (PARANOIA && !node) { throw new Error(); }

        // can't get the index of the outerHTML of the dom in a string with only the innerHTML.
        if (node === dom) { throw new Error(); }

        var content = getOuterHTML(node);
        var idx = docText.lastIndexOf(content);
        if (idx === -1) { throw new Error(); }

        if (idx !== docText.indexOf(content)) {
            var idTag = uniqueId();
            var span = ifrWindow.document.createElement('span');
            span.setAttribute('id', idTag);
            var spanHTML = '<span id="'+idTag+'"></span>';
            if (PARANOIA && spanHTML !== span.outerHTML) { throw new Error(); }

            node.parentNode.insertBefore(span, node);
            var newDocText = getInnerHTML(dom);
            idx = newDocText.lastIndexOf(spanHTML);
            if (idx === -1 || idx !== newDocText.indexOf(spanHTML)) { throw new Error(); }
            node.parentNode.removeChild(span);

            if (PARANOIA && getInnerHTML(dom) !== docText) { throw new Error(); }
        }

        if (PARANOIA && docText.indexOf(content, idx) !== idx) { throw new Error() }
        return idx;
    };

    var patchString = module.exports.patchString = function (oldString, offset, toRemove, toInsert)
    {
        return oldString.substring(0, offset) + toInsert + oldString.substring(offset + toRemove);
    };

    var getNodeAtOffset = function (docText, offset, dom)
    {
        if (PARANOIA && dom.childNodes.length && docText !== dom.innerHTML) { throw new Error(); }
        if (offset < 0) { throw new Error(); }

        var idx = 0;
        for (var i = 0; i < dom.childNodes.length; i++) {
            var childOuterHTML = getOuterHTML(dom.childNodes[i]);
            if (PARANOIA && docText.indexOf(childOuterHTML, idx) !== idx) { throw new Error(); }
            if (i === 0 && idx >= offset) {
                return { node: dom, pos: 0 };
            }
            if (idx + childOuterHTML.length > offset) {
                var childInnerHTML = childOuterHTML;
                var tw = Otaml.tagWidth(childOuterHTML);
                if (tw) {
                    childInnerHTML = childOuterHTML.substring(tw, childOuterHTML.lastIndexOf('</'));
                }
                if (offset - idx - tw < 0) {
                    if (offset - idx === 0) {
                        return { node: dom.childNodes[i], pos: 0 };
                    }
                    break;
                }
                return getNodeAtOffset(childInnerHTML, offset - idx - tw, dom.childNodes[i]);
            }
            idx += childOuterHTML.length;
        }

        if (dom.nodeName[0] === '#text') {
            if (offset > docText.length) { throw new Error(); }
            var beforeOffset = docText.substring(0, offset);
            if (beforeOffset.indexOf('&') > -1) {
                var tn = nodeFromHTML(beforeOffset);
                offset = tn.data.length;
            }
        } else {
            offset = 0;
        }

        return { node: dom, pos: offset };
    };

    var relocatedPositionInNode = function (newNode, oldNode, offset)
    {
        if (newNode.nodeName !== '#text' || oldNode.nodeName !== '#text' || offset === 0) {
            offset = 0;
        } else if (oldNode.data === newNode.data) {
            // fallthrough
        } else if (offset > newNode.length) {
            offset = newNode.length;
        } else if (oldNode.data.substring(0, offset) === newNode.data.substring(0, offset)) {
            // keep same offset and fall through
        } else {
            var rOffset = oldNode.length - offset;
            if (oldNode.data.substring(offset) ===
                newNode.data.substring(newNode.length - rOffset))
            {
                offset = newNode.length - rOffset;
            } else {
                offset = 0;
            }
        }
        return { node: newNode, pos: offset };
    };

    var pushNode = function (list, node) {
        if (node.nodeName === '#text') {
            list.push.apply(list, node.data.split(''));
        } else {
            list.push('#' + node.nodeName);
        }
    };

    var getChildPath = function (parent) {
        var out = [];
        for (var next = parent; next; next = getNextSiblingDeep(next, parent)) {
            pushNode(out, next);
        }
        return out;
    };

    var tryFromBeginning = function (oldPath, newPath) {
        for (var i = 0; i < oldPath.length; i++) {
            if (oldPath[i] !== newPath[i]) { return i; }
        }
        return oldPath.length;
    };

    var tryFromEnd = function (oldPath, newPath) {
        for (var i = 1; i <= oldPath.length; i++) {
            if (oldPath[oldPath.length - i] !== newPath[newPath.length - i]) {
                return false;
            }
        }
        return true;
    };

    /**
     * returns 2 arrays (before and after).
     * before is string representations (see nodeId()) of all nodes before the target
     * node and after is representations of all nodes which follow.
     */
    var getNodePaths = function (parent, node) {
        var before = [];
        var next = parent;
        for (; next && next !== node; next = getNextSiblingDeep(next, parent)) {
            pushNode(before, next);
        }

        if (next !== node) { throw new Error(); }

        var after = [];
        next = getNextSiblingDeep(next, parent);
        for (; next; next = getNextSiblingDeep(next, parent)) {
            pushNode(after, next);
        }

        return { before: before, after: after };
    };

    var nodeAtIndex = function (parent, idx) {
        var node = parent;
        for (var i = 0; i < idx; i++) {
            if (node.nodeName === '#text') {
                if (i + node.data.length > idx) { return node; }
                i += node.data.length - 1;
            }
            node = getNextSiblingDeep(node);
        }
        return node;
    };

    var getRelocatedPosition = function (newParent, oldParent, oldNode, oldOffset, origText, op)
    {
        var newPath = getChildPath(newParent);
        if (newPath.length === 1) {
            return { node: null, pos: 0 };
        }
        var oldPaths = getNodePaths(oldParent, oldNode);

        var idx = -1;
        var fromBeginning = tryFromBeginning(oldPaths.before, newPath);
        if (fromBeginning === oldPaths.before.length) {
            idx = oldPaths.before.length;
        } else if (tryFromEnd(oldPaths.after, newPath)) {
            idx = (newPath.length - oldPaths.after.length - 1);
        } else {
            idx = fromBeginning;
            var id = 'relocate-' + String(Math.random()).substring(2);
            $(document.body).append('<textarea id="'+id+'"></textarea>');
            $('#'+id).val(JSON.stringify([origText, op, newPath, getChildPath(oldParent), oldPaths]));
        }

        var out = nodeAtIndex(newParent, idx);
        return relocatedPositionInNode(out, oldNode, oldOffset);
    };

    // We can't create a real range until the new parent is installed in the document
    // but we need the old range to be in the document so we can do comparisons
    // so create a "pseudo" range instead.
    var getRelocatedPseudoRange = function (newParent, oldParent, range, origText, op)
    {
        if (!range.startContainer) {
            throw new Error();
        }
        if (!newParent) { throw new Error(); }

        // Copy because tinkering in the dom messes up the original range.
        var startContainer = range.startContainer;
        var startOffset = range.startOffset;
        var endContainer = range.endContainer;
        var endOffset = range.endOffset;

        var newStart =
            getRelocatedPosition(newParent, oldParent, startContainer, startOffset, origText, op);

        if (!newStart.node) {
            // there is probably nothing left of the document so just clear the selection.
            endContainer = null;
        }

        var newEnd = { node: newStart.node, pos: newStart.pos };
        if (endContainer) {
            if (endContainer !== startContainer) {
                newEnd = getRelocatedPosition(newParent, oldParent, endContainer, endOffset, origText, op);
            } else if (endOffset !== startOffset) {
                newEnd = {
                    node: newStart.node,
                    pos: relocatedPositionInNode(newStart.node, endContainer, endOffset).pos
                };
            } else {
                newEnd = { node: newStart.node, pos: newStart.pos };
            }
        }

        return { start: newStart, end: newEnd };
    };

    var replaceAllChildren = function (parent, newParent)
    {
        var c;
        while ((c = parent.firstChild)) {
            parent.removeChild(c);
        }
        while ((c = newParent.firstChild)) {
            newParent.removeChild(c);
            parent.appendChild(c);
        }
    };

    var isAncestorOf = function (maybeDecendent, maybeAncestor) {
        while ((maybeDecendent = maybeDecendent.parentNode)) {
            if (maybeDecendent === maybeAncestor) { return true; }
        }
        return false;
    };

    var getSelectedRange = function (rangy, ifrWindow, selection) {
        selection = selection || rangy.getSelection(ifrWindow);
        if (selection.rangeCount === 0) {
            return;
        }
        var range = selection.getRangeAt(0);
        range.backward = (selection.rangeCount === 1 && selection.isBackward());
        if (!range.startContainer) {
            throw new Error();
        }

        // Occasionally, some browsers *cough* firefox *cough* will attach the range to something
        // which has been used in the past but is nolonger part of the dom...
        if (range.startContainer &&
            isAncestorOf(range.startContainer, ifrWindow.document))
        {
            return range;
        }

        return;
    };

    var applyHTMLOp = function (docText, op, dom, rangy, ifrWindow)
    {
        var parent = getNodeAtOffset(docText, op.offset, dom).node;
        var htmlToRemove = docText.substring(op.offset, op.offset + op.toRemove);

        var parentInnerHTML;
        var indexOfInnerHTML;
        var localOffset;
        for (;;) {
            for (;;) {
                parentInnerHTML = parent.innerHTML;
                if (typeof(parentInnerHTML) !== 'undefined'
                    && parentInnerHTML.indexOf(htmlToRemove) !== -1)
                {
                    break;
                }
                if (parent === dom || !(parent = parent.parentNode)) { throw new Error(); }
            }

            var indexOfOuterHTML = 0;
            var tw = 0;
            if (parent !== dom) {
                indexOfOuterHTML = offsetOfNodeOuterHTML(docText, parent, dom, ifrWindow);
                tw = Otaml.tagWidth(docText.substring(indexOfOuterHTML));
            }
            indexOfInnerHTML = indexOfOuterHTML + tw;

            localOffset = op.offset - indexOfInnerHTML;

            if (localOffset >= 0 && localOffset + op.toRemove <= parentInnerHTML.length) {
                break;
            }

            parent = parent.parentNode;
            if (!parent) { throw new Error(); }
        }

        if (PARANOIA &&
            docText.substr(indexOfInnerHTML, parentInnerHTML.length) !== parentInnerHTML)
        {
            throw new Error();
        }

        var newParentInnerHTML =
            patchString(parentInnerHTML, localOffset, op.toRemove, op.toInsert);

        // Create a temp container for holding the children of the parent node.
        // Once we've identified the new range, we'll return the nodes to the
        // original parent. This is because parent might be the <body> and we
        // don't want to destroy all of our event listeners.
        var babysitter = ifrWindow.document.createElement('div');
        // give it a uid so that we can prove later that it's not in the document,
        // see getSelectedRange()
        babysitter.setAttribute('id', uniqueId());
        babysitter.innerHTML = newParentInnerHTML;

        var range = getSelectedRange(rangy, ifrWindow);

        // doesn't intersect at all
        if (!range || !range.containsNode(parent, true)) {
            replaceAllChildren(parent, babysitter);
            return;
        }

        var pseudoRange = getRelocatedPseudoRange(babysitter, parent, range, rangy);
        range.detach();
        replaceAllChildren(parent, babysitter);
        if (pseudoRange.start.node) {
            var selection = rangy.getSelection(ifrWindow);
            var newRange = rangy.createRange();
            newRange.setStart(pseudoRange.start.node, pseudoRange.start.pos);
            newRange.setEnd(pseudoRange.end.node, pseudoRange.end.pos);
            selection.setSingleRange(newRange);
        }
        return;
    };

    var applyHTMLOpHammer = function (docText, op, dom, rangy, ifrWindow)
    {
        var newDocText = patchString(docText, op.offset, op.toRemove, op.toInsert);
        var babysitter = ifrWindow.document.createElement('body');
        // give it a uid so that we can prove later that it's not in the document,
        // see getSelectedRange()
        babysitter.setAttribute('id', uniqueId());
        babysitter.innerHTML = newDocText;

        var range = getSelectedRange(rangy, ifrWindow);

        // doesn't intersect at all
        if (!range) {
            replaceAllChildren(dom, babysitter);
            return;
        }

        var pseudoRange = getRelocatedPseudoRange(babysitter, dom, range, docText, op);
        range.detach();
        replaceAllChildren(dom, babysitter);
        if (pseudoRange.start.node) {
            var selection = rangy.getSelection(ifrWindow);
            var newRange = rangy.createRange();
            newRange.setStart(pseudoRange.start.node, pseudoRange.start.pos);
            newRange.setEnd(pseudoRange.end.node, pseudoRange.end.pos);
            selection.setSingleRange(newRange);
        }
        return;
    };

    /* Return whether the selection range has been "dirtied" and needs to be reloaded. */
    var applyOp = module.exports.applyOp = function (docText, op, dom, rangy, ifrWindow)
    {
        if (PARANOIA && docText !== getInnerHTML(dom)) { throw new Error(); }

        if (op.offset + op.toRemove > docText.length) {
            throw new Error();
        }
        try {
            applyHTMLOpHammer(docText, op, dom, rangy, ifrWindow);
            var result = patchString(docText, op.offset, op.toRemove, op.toInsert);
            var innerHTML = getInnerHTML(dom);
            if (result !== innerHTML) {
                $(document.body).append('<textarea id="statebox"></textarea>');
                $(document.body).append('<textarea id="errorbox"></textarea>');
                var SEP = '\n\n\n\n\n\n\n\n\n\n';
                $('#statebox').val(docText + SEP + result + SEP + innerHTML);
                var diff = Otaml.makeTextOperation(result, innerHTML);
                $('#errorbox').val(JSON.stringify(op) + '\n' + JSON.stringify(diff));
                throw new Error();
            }
        } catch (err) {
            if (PARANOIA) { console.log(err.stack); }
            // The big hammer
            dom.innerHTML = patchString(docText, op.offset, op.toRemove, op.toInsert);
        }
    };

    return module.exports;
});
