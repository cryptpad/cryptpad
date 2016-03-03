define([
    '/common/hyperjson.js',
    '/common/hyperscript.js'
], function (hyperjson, hyperscript) {
    // complain if you don't find the required APIs
    if (!(hyperjson && hyperscript)) { throw new Error(); }

    // Generate a matrix of conversions
    /*
        convert.dom.to.hjson, convert.hjson.to.dom,
        convert.dom.to.vdom, convert.vdom.to.dom,

        and of course, identify functions in case you try to
        convert a datatype to itself
    */
    var convert = (function () {
        var Self = function (x) {
                return x;
            },
            methods = {
                dom:{
                    dom: Self,
                    hjson: hyperjson.fromDOM
                },
                hjson:{
                    hjson: Self,
                    dom: function (H) {
                        // hyperjson.fromDOM,
                        return hyperjson.callOn(H, hyperscript);
                    }
                }
            },
            convert = {};
        Object.keys(methods).forEach(function (method) {
            convert[method] = { to: methods[method] };
        });
        return convert;
    }());

    convert.core = {
        hyperjson: hyperjson,
        hyperscript: hyperscript
    };
    return convert;
});
