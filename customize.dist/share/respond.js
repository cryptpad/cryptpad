var validDomains = [
    /cryptpad.fr$/i,
];

var isValidDomain = function (o) {
    return validDomains.some(function (e) {
        switch (typeof(e)) {
            case 'string': return e === o;
            case 'object': return e.test(o);
        }
    });
};

var isArray = function (o) { return Object.prototype.toString.call(o) === '[object Array]'; };

window.addEventListener('message', function(e) {
    if (!isValidDomain(e.origin)) { return; }
    var payload = JSON.parse(e.data);
    var parent = window.parent;
    var respond = function (error, data) {
        var res = {
            _uid: payload._uid,
            error: error,
            data: data,
        };
        parent.postMessage(JSON.stringify(res), '*');
    };

    //console.log(payload);

    switch(payload.method) {
        case 'set':
            localStorage.setItem(payload.key, JSON.stringify(payload.data));
            respond();
            break;
        case 'batchset':
            if (isArray(payload.data) || typeof(payload.data) !== 'object') {
                respond('[batchset.TypeError] expected key-value pairs to set');
                return;
            }
            Object.keys(payload.data).forEach(function (k) {
                localStorage.setItem(k, JSON.stringify(payload.data[k]));
            });
            respond();
            break;
        case 'get':
            respond(void 0, JSON.parse(localStorage.getItem(payload.key)));
            break;
        case 'batchget':
            if (!isArray(payload.data)) {
                respond('[batchget.TypeError] expected array of keys to return');
                return;
            }
            var map = {};
            payload.data.forEach(function (k) {
                map[k] = JSON.parse(localStorage.getItem(k));
            });
            respond(void 0, map);
            break;
        case 'remove':
            //console.log("Removing %s from localStorage", payload.key);
            localStorage.removeItem(payload.key);
            respond();
            break;
        case 'batchremove':
            if (!isArray(payload.data)) {
                respond('[batchremove.TypeError] expected array of keys to remove');
                return;
            }
            payload.data.forEach(function (k) {
                localStorage.removeItem(k);
            });
            respond();
            break;
        case 'keys':
            respond(void 0, Object.keys(localStorage));
            break;
        case undefined:
            respond('No method supplied');
            break;
    }
});

