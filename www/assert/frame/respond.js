var validDomains = [ /.*/i, ];
var isValidDomain = function (o) {
    return validDomains.some(function (e) {
        switch (typeof(e)) {
            case 'string': return e === o;
            case 'object': return e.test(o);
        }
    });
};

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

    //console.error(payload);
    switch(payload.method) {
        case undefined:
            return respond('No method supplied');
        default:
            return respond(void 0, "EHLO");
    }
});

