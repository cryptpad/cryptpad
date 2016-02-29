define([], function () {
    var tree = {};

    // FIXME this isn't being used
    var someElement = tree.some = function (root, predicate) {
        // take the index of the last element in the current root
        var last = root.childElementCount - 1;

        // it might be a leaf node
        if (last < 0) { return false; }

        // otherwise it has children
        while (last >= 0) {
            // check from back to front

            // check the node's children (depth first)
            // if the predicate tests true, return true
            if (tree.some(root.children[last], predicate)) {
                return true;
            } // otherwise none of the nodes inside it matched.

            // check the node itself
            if (predicate(root.children[last], last)) {
                return true;
            }
            last--;
        }
        return false;
    };

    // FIXME this isn't being used
    var someText = tree.someIncludingText = function (root, predicate) {
        // take the index of the last element in the current root
        var last = root.childNodes.length - 1;

        // it might be a leaf node
        if (last < 0) { return false; }

        // otherwise it has children
        while (last >= 0) {
            // check from back to front

            // check the node's children (depth first)
            // if the predicate tests true, return true
            if (tree.someIncludingText(root.childNodes[last], predicate)) {
                return true;
            } // otherwise none of the nodes inside it matched.

            // check the node itself
            if (predicate(root.childNodes[last], last)) {
                return true;
            }
            last--;
        }
        return false;
    };

    // FIXME not being used
    tree.findSameHierarchy = function (list, ancestor) {
        var i = 0;
        var success = true;
        var last = list.length - 1;
        var el;

        tree.someIncludingText(ancestor, function (e) {
            // don't out of bounds
            if (i > last) {
                // unsuccessful
                success = false;
                return true;
            }

            if (list[i] === (e.tagName||e.nodeName)) {

                if (i === last) {
                    el = e;
                    return true;
                }
                i++;
            } else {
                // hierarchy has changed, what should we do?
                success = false;
                return true; // terminate
            }
        });
        return success? el: false;
    };

    var indexOfNode = tree.indexOfNode = function (el) {
        if (!(el && el.parentNode)) {
            console.log("No parentNode found!");
            throw new Error('No parentNode found!');
        }
        return Array.prototype.indexOf.call(el.parentNode.childNodes, el);
    };

    // not being used internally, but is useful externally
    tree.contains = function (el, root) {
        return el && root && root.contains && root.contains(el);
    };

    var siblingCount = tree.siblingCount = function (el) {
        return el.parentNode.childNodes.length;
    };

    var childCount = tree.childCount = function (el) {
        return el.childNodes.length;
    };

    var parentsOf = tree.parentsOf = function (el, root) {
        var P = [];
        var p = el;
        while (p !== root) { P.push((p = p.parentNode)); }
        return P;
    };

    /* rightmost and leftmost return the deepest right and left
        leaf nodes of a tree
    */
    var rightmostNode = tree.rightmostNode = function (el) {
        var childNodeCount = childCount(el);
        if (!childNodeCount) { // no children
            return el; // return the element
        } else {
            return rightmostNode(el.childNodes[childNodeCount - 1]);
        }
    };

    var leftmostNode = tree.leftmostNode = function (el) {
        if (childCount(el)) {
            return leftmostNode(el.childNodes[0]);
        } else {
            return el;
        }
    };

    /* previousNode and nextNode traverse child elements of the dom
        in the order in which they appear when selected by a cursor.
        in particular, these algorithms traverse text nodes, not just tags
    */
    var previousNode = tree.previousNode = function (el, root) {
        if (!el || el === root) { return null; }

        var i = indexOfNode(el);
        if (!el.parentNode) { return null; }
        if (i === 0) {
            if (root && el.parentNode === root.childNodes[0]) { return null; }
            return rightmostNode(previousNode(el.parentNode));
        } else {
            return rightmostNode(el.parentNode.childNodes[i-1]);
        }
    };

    var nextNode = tree.nextNode = function (el, root) {
        if (!el || el === root) { return null; }
        var i = indexOfNode(el) + 1, // the index of the next node
            l = siblingCount(el);
        if (i === l) { // out of bounds
            if (el.parentNode === root) { return null; }
            return nextNode(el.parentNode, root);
        } else {
            return leftmostNode(el.parentNode.childNodes[i], root);
        }
    };

    var orderOfNodes = tree.orderOfNodes = function (a, b, root) {
        // b might not be supplied
        if (!b) { return; }
        // a and b might be the same element
        if (a === b) { return 0; }

        var cur = b;
        while (cur) {
            cur = previousNode(cur, root);
            // if you find 'a' while traversing backwards
            // they are in the expected order
            if (cur === a) { return 1; }
        }
        // otherwise 
        return -1;
    };

    return tree;
});
