// Stage 0, this gets cached which means we can't change it. boot2.js is changable.
define(['/api/config?cb=' + (+new Date()).toString(16)], function (Config) {
    if (Config.requireConf) { require.config(Config.requireConf); }
    require(['/common/boot2.js']);
});
