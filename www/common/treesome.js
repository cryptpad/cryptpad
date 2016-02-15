define([], function () {
    var tree = {};

    tree.some = function (branch, predicate) {
        // take the index of the last element in the current branch
        var last = branch.childElementCount - 1;

        // it might be a leaf node
        if (last < 0) { return false; }

        // otherwise it has children
        while (last >= 0) {
            // check from back to front

            // check the node's children (depth first)
            // if the predicate tests true, return true
            if (tree.some(branch.children[last], predicate)) {
                return true;
            } // otherwise none of the nodes inside it matched.
           
            // check the node itself
            if (predicate(branch.children[last], last)) {
                return true;
            }
            last--;
        }
        return false;
    };

    tree.someIncludingText = function (branch, predicate) {
        // take the index of the last element in the current branch
        var last = branch.childNodes.length - 1;
        
        // it might be a leaf node
        if (last < 0) { return false; }

        // otherwise it has children
        while (last >= 0) {
            // check from back to front

            // check the node's children (depth first)
            // if the predicate tests true, return true
            if (tree.someIncludingText(branch.childNodes[last], predicate)) {
                return true;
            } // otherwise none of the nodes inside it matched.
           
            // check the node itself
            if (predicate(branch.childNodes[last], last)) {
                return true;
            }
            last--;
        }
        return false;
    };

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
        }
        return Array.prototype.indexOf.call(el.parentNode.childNodes, el);
    };

    var siblingCount = tree.siblingCount = function (el) {
        return el.parentNodes.childNodes.length;
    };

    var deepestNode = tree.deepestNode = function (el) {
        var deepest = el.childNodes.length;
        if (!deepest) { // no children
            return el; // return the element
        } else {
            return deepestNode(el.childNodes[deepest - 1]);
        }
    };

    var leftMostNode = tree.leftMostNode = function (el) {
        var left = el.childNodes[0];
        if (el.childNodes.length) {
            return leftMostNode(el.childNodes[0]);
        } else {
            return el;
        }
    };

    var previousNode = tree.previousNode = function (el, root) {
        if (!el || el === root) { return null; }

        var i = indexOfNode(el);
        if (!el.parentNode) { return null; }
        if (i === 0) {

            if (root && el.parentNode === root.childNodes[0]) { return null; }
            return deepestNode(previousNode(el.parentNode));
        } else {
            return el.parentNode.childNodes[i-1];
        }
    };

    /* includes text elements */
    var nextNode = tree.nextNode = function (el, root) {
        if (!el || el === root) {
            return null;
        }
        var i = indexOfNode(el) + 1, // the index of the next node
            l = el.parentNode.childNodes.length;
        if (i === l) { // out of bounds
            return leftMostNode(nextNode(el.parentNode, root));
        } else {
            return el.parentNode.childNodes[i];
        }
    };

    tree.recoverElement = function (el, root) {
        var tags = tree.tagsUntilElement(el, root);
        var found = tree.findSameHierarchy(tags, root);
        var isSame = found === el;
        console.log("found an equivalent node: %s", isSame);
        return found;
    };

    tree.tagsUntilElement = function (el, ancestor) {
        var list = [];
        tree.someIncludingText(ancestor, function (e, index) {
            list.push(e.tagName||e.nodeName);
            return e === el;
        });
        return list;
    };

    tree.distanceFromEnd = function (el, ancestor) {
        var i = 0, success = false;
        // FIXME can't be trusted if element is not found.
        tree.some(ancestor, function (e, index) {
            ++i;
            return e === el;
        });
        return i;
    };

    tree.nthFromEnd = function (n, ancestor) {
        var el = false, i = 0;
        tree.some(ancestor, function (e) {
            if (i > n) {
                // terminate
                return true;
            } else {
                if (++i === n) {
                    el = e;
                    return true;
                } else {
                    return false;
                }
            }
        });
        return el;
    };

    tree.contains = function (el, ancestor) {
        return el && ancestor.contains && ancestor.contains(el);
    };

    tree.check = function (el, ancestor) {
        return tree.nthFromEnd(tree.distanceFromEnd(el, ancestor), ancestor) === el;
    };

    // TODO see if we can use this
    tree.getNext = function (node, parent) {
        if (node.firstChild) { return node.nextSibling; }
        do {
            if(node.nextSibling) { return node.nextSibling; }
            node = node.parentNode;
        } while (node && node !== parent);
    };

    return tree;
});
