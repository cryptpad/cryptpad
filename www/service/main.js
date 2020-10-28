define([
    '/api/config',
], function (ApiConfig) {
    //console.log(ApiConfig);
    var sw = window.navigator.serviceWorker;
    var args = ApiConfig.requireConf.urlArgs;

    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled rejection (promise: ', event.promise, ', reason: ', event.reason, ').');
    });

    sw.register('/sw.js'
    + '?' + args
    , { scope: '/' })
        .then(function (reg) {
            console.log("registered?", reg);
        })
        .catch(function (err) {
            console.error(err);
        });
});
