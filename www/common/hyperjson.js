define([], function () {

    // this makes recursing a lot simpler
    var isArray = function (A) {
        return Object.prototype.toString.call(A)==='[object Array]';
    };

    var parseStyle = function(el){
      var style = el.style;
      var output = {};
      for (var i = 0; i < style.length; ++i) {
        var item = style.item(i);
        output[item] = style[item];
      }
      return output;
    };

    var callOnHyperJSON = function (hj, cb) {
        var children;
        
        if (hj && hj[2]) {
            children = hj[2].map(function (child) {
                if (isArray(child)) {
                    // if the child is an array, recurse
                    return callOnHyperJSON(child, cb);
                } else if (typeof (child) === 'string') {
                    // string nodes have leading and trailing quotes
                    return child.replace(/(^"|"$)/g,"");
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

    var DOM2HyperJSON = function(el){
        if(!el.tagName && el.nodeType === Node.TEXT_NODE){
            return el.textContent;
        }
        if(!el.attributes){
          return;
        }
        var attributes = {};

        var i = 0;
        for(;i < el.attributes.length; i++){
          var attr = el.attributes[i];
          if(attr.name && attr.value){
            if(attr.name === "style"){
              attributes.style = parseStyle(el);
            }
            else{
              attributes[attr.name] = attr.value;
            }
          }
        }

        // this should never be longer than three elements
        var result = [];

        // get the element type, id, and classes of the element
        // and push them to the result array
        var sel = el.tagName;

        if(attributes.id){
          sel = sel +'#'+ attributes.id;
          delete attributes.id;
        }
        if(attributes.class){
          sel = sel +'.'+ attributes.class.replace(/ /g,".");
          delete attributes.class;
        }
        result.push(sel);

        // second element of the array is the element attributes
        result.push(attributes);

        // third element of the array is an array of child nodes
        var children = [];

        // js hint complains if we use 'var' here
        i = 0;
        for(; i < el.childNodes.length; i++){
          children.push(DOM2HyperJSON(el.childNodes[i]));
        }
        result.push(children);

        return result;
    };

    return {
        fromDOM: DOM2HyperJSON,
        callOn: callOnHyperJSON
    };
});
