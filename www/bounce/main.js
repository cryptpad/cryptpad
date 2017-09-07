define([], function () {
    if (window.localStorage && window.localStorage.FS_hash) {
        window.alert('The bounce application must only be used from the sandbox domain, ' +
            'please report this issue on https://github.com/xwiki-labs/cryptpad');
        return;
    }
    var bounceTo = decodeURIComponent(window.location.hash.slice(1));
    if (!bounceTo) { return; }
    window.location.href = bounceTo;
});