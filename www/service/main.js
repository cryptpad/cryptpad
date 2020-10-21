

var sw = window.navigator.serviceWorker;
sw.register('/service/sw.js?', { scope: '/service/' })
    .then(function (reg) {
        console.log("registered?", reg);
    })
    .catch(function (err) {
        console.error(err);

    });

