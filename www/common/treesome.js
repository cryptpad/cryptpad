define([], function () {
    var tree = {};

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

    tree.orderOfNodes = function (a, b, root) {
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
