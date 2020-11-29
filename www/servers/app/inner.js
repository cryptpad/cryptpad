// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    'jquery',
    '/bower_components/nthen/index.js',
    '/customize/application_config.js',
    '/common/dom-ready.js',
    '/common/common-interface.js',
    '/common/sframe-common.js',
    '/common/toolbar.js',
    '/bower_components/datatables/media/js/jquery.dataTables.min.js',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/datatables/media/css/dataTables.bootstrap4.min.css',
    'css!/bower_components/datatables/media/css/jquery.dataTables.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'css!/servers/app/servers.css',
    'less!/servers/app/app-servers.less',
], function ($, nThen, ApiConfig, DomReady, UI, SFCommon, Toolbar, DataTable) {
    var APP = {}

    // Loaded in load #2
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
	$(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (/*waitFor*/) {
        APP.$container = $('#cp-sidebarlayout-container');
  	APP.$toolbar = $('#cp-toolbar');
	var displayed = ['pageTitle'];
        var configTb = {
            displayed: displayed,
            $container: APP.$toolbar,
            sfCommon: common,
            pageTitle: "CryptPad Servers",
	    metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();
        APP.$container.show();
        UI.removeLoadingScreen();

        $('#servers').DataTable( {
        "ajax": ApiConfig.accounts_api + "/api/servers",
        "columns" : [
            { "data" : "url" },
            { "data" : "name" },
            { "data" : "desc" },
            { "data" : "version" },
            { "data" : "registeredUsers" },
            { "data" : "maxOpenUniqueWebSockets" },
            { "data" : "firstConnection" },
            { "data" : "lastConnection" }
        ]
        });
    });
});
