define([

], function () {
    var Todo = {};

/*  data model
{
  "order": [
    "123456789abcdef0",
    "23456789abcdef01",
    "0123456789abcedf"
  ],
  "data": {
    "0123456789abcedf": {
      "state": 0, // used to sort completed elements
      "task": "pewpewpew",
      "ctime": +new Date(), // used to display chronologically
      "mtime": +new Date(), // used to display recent actions
      // "deadline": +new Date() + 1000 * 60 * 60 * 24 * 7
    },
    "123456789abcdef0": {},
    "23456789abcdef01": {}
  }
}
*/

    var val = function (proxy, id, k, v) {
        var el = proxy.data[id];
        if (!el) {
            throw new Error('expected an element');
        }
        if (typeof(v) === 'function') { el[k] = v(el[k]); }
        else { el[k] = v; }
        return el[k];
    };

    var initialize = function (proxy) {
        // run migration
        if (typeof(proxy.data) !== 'object') { proxy.data = {}; }
        if (!Array.isArray(proxy.order)) { proxy.order = []; }
        if (typeof(proxy.type) !== 'string') { proxy.type = 'todo'; }
    };

    /*  add (id, obj) push id to order, add object to data */
    var add = function (proxy, id, obj) {
        if (!Array.isArray(proxy.order)) {
            throw new Error('expected an array');
        }
        proxy.order.unshift(id);
        proxy.data[id] = obj;
    };

    /*  delete (id) remove id from order, delete id from data */
    var remove = function (proxy, id) {
        if (Array.isArray(proxy.order)) {
            var i = proxy.order.indexOf(id);
            proxy.order.splice(i, 1);
        }
        if (proxy.data[id]) { delete proxy.data[id]; }
    };

    Todo.init = function (proxy) {
        var api = {};
        initialize(proxy);

        api.val = function (id, k, v) {
            return val(proxy, id, k, v);
        };
        api.add = function (id, obj) {
            return add(proxy, id, obj);
        };
        api.remove = function (id) {
            return remove(proxy, id);
        };

        return api;
    };

    return Todo;
});
