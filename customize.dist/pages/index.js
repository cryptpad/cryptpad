define([
    'jquery',
    '/api/config',
    '/common/hyperscript.js',
    '/common/common-feedback.js',
    '/common/common-interface.js',
    '/common/common-hash.js',
    '/common/textFit.min.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/common/outer/local-store.js',
    '/customize/pages.js'
], function ($, Config, h, Feedback, UI, Hash, TextFit, Msg, AppConfig, LocalStore, Pages) {
    var urlArgs = Config.requireConf.urlArgs;

    var isAvailableType = function (x) {
        if (!Array.isArray(AppConfig.availablePadTypes)) { return true; }
        return AppConfig.availablePadTypes.indexOf(x) !== -1;
    };

    var checkRegisteredType = function (x) {
        // Return true if we're registered or if the app is not registeredOnly
        if (LocalStore.isLoggedIn()) { return true; }
        if (!Array.isArray(AppConfig.registeredOnlyTypes)) { return true; }
        return AppConfig.registeredOnlyTypes.indexOf(x) === -1;
    };

    return function () {
        var icons = [
                [ 'pad', Msg.type.pad],
                [ 'code', Msg.type.code],
                [ 'slide', Msg.type.slide],
                [ 'sheet', Msg.type.sheet],
                [ 'form', Msg.type.form],
                [ 'kanban', Msg.type.kanban],
                [ 'whiteboard', Msg.type.whiteboard],
                [ 'drive', Msg.type.drive]
            ].filter(function (x) {
                return isAvailableType(x[0]);
            })
            .map(function (x) {
                var s = 'div.bs-callout.cp-callout-' + x[0];
                var isEnabled = checkRegisteredType(x[0]);
                //if (i > 2) { s += '.cp-more.cp-hidden'; }
                var icon = AppConfig.applicationsIcon[x[0]];
                var font = icon.indexOf('cptools') === 0 ? 'cptools' : 'fa';
                var href = '/'+ x[0] +'/';
                var attr = isEnabled ? { href: href } : {
                    onclick: function () {
                        var loginURL = Hash.hashToHref('', 'login');
                        var url = Hash.getNewPadURL(loginURL, { href: href });
                        window.location.href = url;
                    }
                };
                if (!isEnabled) {
                    s += '.cp-app-disabled';
                    attr.title = Msg.mustLogin;
                }
                return h('a', [
                    attr,
                    h(s, [
                        h('i.' + font + '.' + icon, {'aria-hidden': 'true'}),
                        h('div.pad-button-text', [ x[1] ])
                    ])
                ]);
            });

        icons.forEach(function (a) {
            setTimeout(function () {
                TextFit($(a).find('.pad-button-text')[0], {minFontSize: 13, maxFontSize: 18});
            });
        });
        UI.addTooltips();

        var subscribeButton;
        /* Display a subscribe button if they are enabled and the button's translation key exists */
        if (Config.allowSubscriptions) {
            subscribeButton = Pages.subscribeButton(function () {
                Feedback.send('HOME_SUBSCRIBE_CRYPTPAD');
            });
        }

        var supportText = Pages.setHTML(h('span'), Msg.home_support);
        Pages.documentationLink(supportText.querySelector('a'), "https://docs.cryptpad.fr/en/how_to_contribute.html");

        var opensource = Pages.setHTML(h('p'), Msg.home_opensource);
        Pages.externalLink(opensource.querySelector('a'), "https://github.com/xwiki-labs/cryptpad");

        var blocks = [
            h('div.row.cp-page-section', [
                h('div.col-sm-6',
                    h('img.img-fluid.cp-img-invert', {
                        src:'/customize/images/shredder.png',
                        alt:'',
                        'aria-hidden': 'true'
                    })
                ),
                h('div.col-sm-6', [
                    h('h2', Msg.home_privacy_title),
                    h('p', Msg.home_privacy_text)
                ])
            ]),
            h('div.row.cp-page-section',
                h('div.col-sm-12', [
                    h('h2', Msg.home_host_title),
                    h('p'), Msg.home_host
                ])
            ),
            h('div.row.cp-page-section', [
                h('div.col-sm-6', [
                    h('h2', Msg.home_opensource_title),
                    opensource,
                    h('img.small-logo.cp-img-invert', {
                        src: '/customize/images/logo_AGPLv3.svg',
                        alt: 'APGL3 License Logo'
                    })
                ]),
                h('div.col-sm-6', [
                    h('h2', Msg.home_support_title),
                    supportText,
                    subscribeButton,
                    Pages.crowdfundingButton(function () {
                        Feedback.send('HOME_SUPPORT_CRYPTPAD');
                    }),
                ])
            ])
        ];

        var notice;
/*  Admins can specify a notice to display in application_config.js via the `homeNotice` attribute.
    If the text is the key for the translation system then then the most appropriate translated text
    will be displayed. Otherwise, the direct text will be included as HTML.
*/
        if (AppConfig.homeNotice) {
            notice = h('div.alert.alert-info', Pages.setHTML(h('span'), [
                Msg[AppConfig.homeNotice] || AppConfig.homeNotice
            ]));
        }

        return [
            h('div#cp-main', [
                Pages.infopageTopbar(),
                h('div.container.cp-container', [
                    h('div.row.cp-home-hero', [
                        h('div.cp-title.col-md-7', [
                            h('img', {
                                src: '/customize/CryptPad_logo.svg?' + urlArgs,
                                'aria-hidden': 'true',
                                alt: ''
                            }),
                            h('h1', 'CryptPad'),
                            UI.setHTML(h('span.tag-line'), Msg.main_catch_phrase)
                        ]),
                        h('div.col-md-5.cp-app-grid', [
                            icons,
                        ])
                    ]),
                    notice,
                    blocks
                ]),
                Pages.infopageFooter(),
            ]),
        ];
    };
});

