define(['/bower_components/localforage/dist/localforage.min.js'], function (localForage) {
    localForage.clear();
    sessionStorage.clear();
    localStorage.clear();
});
