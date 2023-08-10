define([
    '/components/localforage/dist/localforage.min.js',
    '/common/outer/cache-store.js',
    '/components/nthen/index.js',
], function (localForage, Cache, nThen) {
    nThen(function (w) {
        localStorage.clear();
        localForage.clear(w());
        Cache.clear(w());
    }).nThen(function () {
        window.location.href = '/login/';
    });
});
