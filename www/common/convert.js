define([
    '/common/virtual-dom.js',
    '/common/hyperjson.js',
    '/common/hyperscript.js'
], function (vdom, hyperjson, hyperscript) {
    // complain if you don't find the required APIs
    if (!(vdom && hyperjson && hyperscript)) { throw new Error(); }
    
    // Generate a matrix of conversions
    /*
        convert.dom.to.hjson, convert.hjson.to.dom,
        convert.dom.to.vdom, convert.vdom.to.dom,
        convert.vdom.to.hjson, convert.hjson.to.vdom

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
                    hjson: hyperjson.fromDOM,
                    vdom: function (D) {
                        return hyperjson.callOn(hyperjson.fromDOM(D), vdom.h);
                    }
                },
                hjson:{
                    hjson: Self,
                    dom: function (H) {
                        // hyperjson.fromDOM,
                        return hyperjson.callOn(H, hyperscript);
                    },
                    vdom: function (H) {
                        return hyperjson.callOn(H, vdom.h);
                    }
                },
                vdom:{
                    vdom: Self,
                    dom: function (V) {
                        return vdom.create(V);
                    },
                    hjson: function (V) {
                        return hyperjson.fromDOM(vdom.create(V));
                    }
                }
            }, 
            convert = {};
        Object.keys(methods).forEach(function (method) {
            convert[method] = { to: methods[method] };
        });
        return convert;
    }());
    return convert;
});
