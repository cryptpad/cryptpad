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
    '/common/hyperscript.js',
    'css!/lib/datepicker/flatpickr.min.css',
    '/customize/messages.js',
        '/customize/loading.js',



    '/customize/messages.js',
    // '/install/configscreen.css',
    'less!/customize/src/less2/include/loading.less'
], function ($,
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
    Messages,
    Loading) {


    //XXX 
    Messages.admin_appSelection = 'App configuration saved'
    Messages.admin_appsTitle = "Choose your applications"
    Messages.admin_appsHint = "Choose which apps are available to users on your instance."
    Messages.admin_cat_apps = "Apps"

    var APP = window.APP = {};

    var Nacl = window.nacl;
    var common;
    var sFrameChan;

    var Apps = {}

    Apps.showScreen = function (form) {
        var LOADING = 'cp-loading';

            var loadingText = "config.loadingText";
        var todo = function () {
            var $loading = $('#' + LOADING);
            // Show the loading screen
            $loading.css('display', '');
            $loading.removeClass('cp-loading-hidden');
            $loading.removeClass('cp-loading-transparent');
            if (config.newProgress) {
                var progress = h('div.cp-loading-progress', [
                    h('p.cp-loading-progress-list'),
                    h('p.cp-loading-progress-container')
                ]);
                $loading.find('.cp-loading-spinner-container').after(progress);
            }
            if (!$loading.find('.cp-loading-progress').length) {
                // Add spinner
                $('.cp-loading-spinner-container').show();
            }
            // Add loading text
            if (loadingText) {
                $('#' + LOADING).find('#cp-loading-message').show().text(loadingText);
            } else {
                $('#' + LOADING).find('#cp-loading-message').hide().text('');
            }
        };
        if ($('#' + LOADING).length) {
            todo();
        } else {
            Loading();
            todo();
        }

        $('html').toggleClass('cp-loading-noscroll', true);
        // Remove the inner placeholder (iframe)
        $('#placeholder').remove();
        // var elem = document.createElement('div');
        // elem.setAttribute('id', 'cp-loading');

        // let frame = h('div.configscreen',  {style: 'width: 70%; height: 75%; background-color: white'}, form)

        // elem.append(frame)

        // return function () {
        // built = true;
        // var intr;
        // var append = function () {
        //     if (!document.body) { return; }
        //     clearInterval(intr);
        //     document.body.appendChild(elem);
        // };
        // intr = setInterval(append, 100);
        // append();
        
        // }

    };

    return Apps
});




