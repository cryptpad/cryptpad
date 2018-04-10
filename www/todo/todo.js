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

        // if a key exists in order, but there is no data for it...
        // remove that key
        var i = proxy.order.length - 1;
        for (;i >= 0; i--) {
            if (typeof(proxy.data[proxy.order[i]]) === 'undefined') {
                console.log('removing todo entry with no data at [%s]', i);
                proxy.order.splice(i, 1);
            }
        }

        // if you have data, but it's not in the order array...
        // add it to the order array...
        Object.keys(proxy.data).forEach(function (key) {
            if (proxy.order.indexOf(key) > -1) { return; }
            console.log("restoring entry with missing key");
            proxy.order.unshift(key);
        });
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

    /* change the order in the proxy (with a check to make sure that nothing is missing */
    var reorder = function (proxy, order) {
        var existingOrder = proxy.order.slice().sort();
        var newOrder = order.slice().sort();
        if (JSON.stringify(existingOrder) === JSON.stringify(newOrder)) {
            proxy.order = order.slice();
        } else {
            console.error("Can't reorder the tasks. Some tasks are missing or added");
        }
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
        api.getOrder = function () {
            return proxy.order.slice();
        };
        api.reorder = function (order) {
            return reorder(proxy, order);
        };

        return api;
    };

    return Todo;
});
