define([], function () {
    // this makes recursing a lot simpler
    var isArray = function (A) {
        return Object.prototype.toString.call(A)==='[object Array]';
    };

    var callOnHyperJSON = function (hj, cb) {
        var children;

        if (hj && hj[2]) {
            children = hj[2].map(function (child) {
                if (isArray(child)) {
                    // if the child is an array, recurse
                    return callOnHyperJSON(child, cb);
                } else if (typeof (child) === 'string') {
                    return child;
                } else {
                    // the above branches should cover all methods
                    // if we hit this, there is a problem
                    throw new Error();
                }
            });
        } else {
            children = [];
        }
        // this should return the top level element of your new DOM
        return cb(hj[0], hj[1], children);
    };

    var isTruthy = function (x) {
        return x;
    };

    var DOM2HyperJSON = function(el, predicate, filter){
        if(!el.tagName && el.nodeType === Node.TEXT_NODE){
            return el.textContent;
        }
        if(!el.attributes){
          return;
        }
        if (predicate) {
            if (!predicate(el)) {
                // shortcircuit
                return;
            }
        }

        var attributes = {};

        var i = 0;
        for(;i < el.attributes.length; i++){
            var attr = el.attributes[i];
            if(attr.name && attr.value){
                attributes[attr.name] = attr.value;
            }
        }

        // this should never be longer than three elements
        var result = [];

        // get the element type, id, and classes of the element
        // and push them to the result array
        var sel = el.tagName;

        if(attributes.id){
            // we don't have to do much to validate IDs because the browser
            // will only permit one id to exist
            // unless we come across a strange browser in the wild
          sel = sel +'#'+ attributes.id;
          delete attributes.id;
        }
        result.push(sel);

        // second element of the array is the element attributes
        result.push(attributes);

        // third element of the array is an array of child nodes
        var children = [];

        // js hint complains if we use 'var' here
        i = 0;
        for(; i < el.childNodes.length; i++){
            children.push(DOM2HyperJSON(el.childNodes[i], predicate, filter));
        }
        result.push(children.filter(isTruthy));

        if (filter) {
            return filter(result);
        } else {
            return result;
        }
    };

    return {
        fromDOM: DOM2HyperJSON,
        callOn: callOnHyperJSON
    };
});
