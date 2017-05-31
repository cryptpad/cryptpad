define([], function () {
    var out = function () { };
    if (window.location.hash.indexOf("?test=test") > -1) {
        window.onerror = function (msg, url, lineNo, columnNo, e) {
            document.body.innerHTML = '<div class="report fail">' +
                JSON.stringify([
                    msg,
                    url,
                    lineNo,
                    columnNo,
                    e ? e.message : null,
                    e ? e.stack : null
                ]).replace(/</g, '') +
            '</div>';
        };
        require.onError = function (e) {
            document.body.innerHTML = '<div class="report fail">' +
                JSON.stringify([
                    e ? e.message : null,
                    e ? e.stack : null
                ]).replace(/</g, '') +
            '</div>';
        };
        out = function (f) { f(); };
    }
    out.passed = function () {
        document.body.innerHTML = '<div class="report success">Test Passed</div>';
    };
    return out;
});