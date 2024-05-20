define([
    'jquery',
    '/common/toolbar.js',
    '/components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/inner/sidebar-layout.js',
    '/customize/messages.js',
    '/common/common-signing-keys.js',
    '/common/hyperscript.js',
    '/common/clipboard.js',
    'json.sortify',
    '/customize/application_config.js',
    '/api/config',
    '/api/instance',
    '/lib/datepicker/flatpickr.js',
        'configscreen.js',



    '/common/hyperscript.js',
    'css!/lib/datepicker/flatpickr.min.css',
    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
    'less!/admin/app-admin.less',
], function(
    $,
    Toolbar,
    nThen,
    SFCommon,
    UI,
    UIElements,
    Util,
    Hash,
    Sidebar,
    Messages,
    Keys,
    h,
    Clipboard,
    Sortify,
    AppConfig,
    ApiConfig,
    Instance,
    Flatpickr,
    ConfigScreen
) {

var AppConfigScreen = {}


AppConfigScreen.addConfigScreen = function (config) {
        var LOADING = 'cp-loading';
        config = config || {};
        var loadingText = config.loadingText;
        var todo = function () {
            var $loading = $('#' + LOADING);
            // Show the loading screen
            $loading.css('display', '');
            $loading.removeClass('cp-loading-hidden');
            $loading.removeClass('cp-loading-transparent');

        };
        if ($('#' + LOADING).length) {
            todo();
        } else {
            ConfigScreen();
            todo();
        }

        $('html').toggleClass('cp-loading-noscroll', true);
        // Remove the inner placeholder (iframe)
        $('#placeholder').remove();
    };

return AppConfigScreen
});

