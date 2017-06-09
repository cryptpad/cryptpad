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

    require([document.querySelector('script[data-bootload]').getAttribute('data-bootload')]);
});
