// This is stage 1, it can be changed but you must bump the version of the project.
define([], function () {
    // fix up locations so that relative urls work.
    require.config({
        baseUrl: window.location.pathname,
        paths: {
            // jquery declares itself as literally "jquery" so it cannot be pulled by path :(
            "jquery": "/bower_components/jquery/dist/jquery.min",
            // json.sortify same
            "json.sortify": "/bower_components/json.sortify/dist/JSON.sortify",
            "pdfjs-dist/build/pdf": "/bower_components/pdfjs-dist/build/pdf",
            "pdfjs-dist/build/pdf.worker": "/bower_components/pdfjs-dist/build/pdf.worker"
        }
    });

    // most of CryptPad breaks if you don't support isArray
    if (!Array.isArray) {
        Array.isArray = function(arg) { // CRYPTPAD_SHIM
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }

    var failStore = function () {
        require(['jquery'], function ($) {
            $.ajax({
                type: 'HEAD',
                url: '/common/feedback.html?NO_LOCALSTORAGE=' + (+new Date()),
            });
        });
        window.alert("CryptPad needs localStorage to work, try a different browser");
    };

    try {
        var test_key = 'localStorage_test';
        var testval = Math.random().toString();
        localStorage.setItem(test_key, testval);
        if (localStorage.getItem(test_key) !== test_key) {
            failStore();
        }
    } catch (e) { console.error(e); failStore(); }

    require([document.querySelector('script[data-bootload]').getAttribute('data-bootload')]);
});
