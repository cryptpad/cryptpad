define([
    'jquery',
    '/api/config',
    '/common/hyperscript.js',
    '/common/common-hash.js',
    '/common/common-constants.js',
    '/common/common-util.js',
    '/lib/textFit.min.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/common/outer/local-store.js',
    '/customize/pages.js',
], function ($, Config, h, Hash, Constants, Util, TextFit, Msg, AppConfig, LocalStore, Pages) {
    var urlArgs = Config.requireConf.urlArgs;

    var isAvailableType = function (x) {
        if (!Array.isArray(AppConfig.availablePadTypes)) { return true; }
        return AppConfig.availablePadTypes.indexOf(x) !== -1;
    };

    var checkEarlyAccess = function (x) {
        // Check if this is an early access app and if they are allowed.
        // Check if this is a premium app and if you're premium
        // Returns false if the app should be hidden
        var earlyTypes = Constants.earlyAccessApps;
        var ea = Util.checkRestrictedApp(x, AppConfig, earlyTypes,
                    LocalStore.getPremium(), LocalStore.isLoggedIn());
        return ea > 0;
    };
    var checkRegisteredType = function (x) {
        // Return true if we're registered or if the app is not registeredOnly
        if (LocalStore.isLoggedIn()) { return true; }
        if (!Array.isArray(AppConfig.registeredOnlyTypes)) { return true; }
        return AppConfig.registeredOnlyTypes.indexOf(x) === -1;
    };

    return function () {
        var icons = [
                [ 'sheet', Msg.type.sheet],
                [ 'doc', Msg.type.doc],
                [ 'presentation', Msg.type.presentation],
                [ 'pad', Msg.type.pad],
                [ 'kanban', Msg.type.kanban],
                [ 'code', Msg.type.code],
                [ 'form', Msg.type.form],
                [ 'whiteboard', Msg.type.whiteboard],
                [ 'slide', Msg.type.slide]
            ].filter(function (x) {
                return isAvailableType(x[0]);
            })
            .map(function (x) {
                var s = 'div.bs-callout.cp-callout-' + x[0];
                var cls = '';
                var isEnabled = checkRegisteredType(x[0]);

                var isEAEnabled = checkEarlyAccess(x[0]);
                //if (i > 2) { s += '.cp-more.cp-hidden'; }
                var icon = AppConfig.applicationsIcon[x[0]];
                var font = icon.indexOf('cptools') === 0 ? 'cptools' : 'fa';
                var href = '/'+ x[0] +'/';
                var attr = isEnabled ? { href: href } : {
                    onclick: function () {
                        // if the app is not enabled then we send them to the login page
                        // which will redirect to the app in question ?
                        var loginURL = Hash.hashToHref('', 'login');
                        var url = Hash.getNewPadURL(loginURL, { href: href });
                        window.location.href = url;
                    }
                };
                if (!isEAEnabled) {
                    cls += '.cp-app-hidden';
                }
                if (!isEnabled) {
                    cls += '.cp-app-disabled';
                    attr.title = Msg.mustLogin;
                }
                return h('a.cp-index-appitem' + cls, [
                    attr,
                    h(s, [
                        h('i.' + font + '.' + icon, {'aria-hidden': 'true'}),
                        h('div.pad-button-text', [ x[1] ])
                    ])
                ]);
            });

        icons.forEach(function (a) {
            setTimeout(function () {
                // ensure that text in our app icons doesn't overflow
                TextFit($(a).find('.pad-button-text')[0], {minFontSize: 13, maxFontSize: 18});
            });
        });

        var isLocalURL = url => {
            try {
                return new URL(url, window.location.href).origin === window.location.origin;
            } catch (err) {
                console.error(err);
                return /^\//.test(url);
            }
        };

        var pageLink = function (ref, loc, text) {
            if (!ref) { return; }
            var attrs =  {
                href: ref,
            };
            if (!isLocalURL(ref)) {
                attrs.target = '_blank';
                attrs.rel = 'noopener noreferrer';
            }
            if (loc) {
                attrs['data-localization'] =  loc;
                text = Msg[loc];
            }
            return h('a', attrs, text);
        };

        var fastLink = k => pageLink(Pages.customURLs[k], k);

        var imprintLink = fastLink('imprint');
        var privacyLink = fastLink('privacy');
        var termsLink = fastLink('terms');

        var notice;
/*  Admins can specify a notice to display in application_config.js via the `homeNotice` attribute.
    If the text is the key for the translation system then then the most appropriate translated text
    will be displayed. Otherwise, the direct text will be included as HTML.
*/
        if (Pages.Instance.notice) {
            console.log(Pages.Instance.notice);
            notice = h('div.alert.alert-info', Pages.setHTML(h('span'), Pages.Instance.notice));
        }

        // instance title
        var instanceTitle = h('h1.cp-instance-title', Pages.Instance.name);

        // instance location
        var locationBlock;
        if (Pages.Instance.location) {
            locationBlock = h('div.cp-instance-location', [
                h('i.fa.fa-map-pin', {'aria-hidden': 'true'}),
                Msg._getKey('home_location', [ Pages.Instance.location ]),
            ]);
        } else {
            locationBlock = h('div', h('br'));
        }

        var subButton = function () {
            if (Pages.areSubscriptionsAllowed() && !LocalStore.getPremium()) {
                var sub = h('div.cp-sub-prompt', [
                    h('span', Msg.home_morestorage),
                    h('a', {href:"/accounts/"}, h('button', [
                        h('i.fa.fa-ticket'),
                        Msg.features_f_subscribe
                    ]))
                ]);
                return sub;
            } else {
                return h('div');
            }
        };


        return [
            h('div#cp-main', [
                Pages.infopageTopbar(),
                notice,
                h('div.container.cp-container', [
                    h('div.row.cp-home-hero', [
                        h('div.cp-title.col-lg-6', [
                            h('img', {
                                src: '/customize/CryptPad_logo_hero.svg?' + urlArgs,
                                'aria-hidden': 'true',
                                alt: ''
                            }),
                            instanceTitle,
                            Pages.setHTML(h('span.tag-line'), Pages.Instance.description),
                            locationBlock,
                            h('div.cp-instance-links', [
                                termsLink,
                                privacyLink,
                                imprintLink,
                                h('a', {href:"/contact.html"}, Msg.contact)
                            ])
                        ]),
                        h('div.cp-apps.col-lg-6', [
                            h('div.cp-app-grid', [
                                h('span.cp-app-new', [
                                    h('i.fa.fa-plus'),
                                    Msg.fm_newFile
                                ]),
                                h('div.cp-app-grid-apps', [
                                    icons,
                                ])
                            ]),
                            h('div.cp-app-drive', [
                                h('a.cp-drive-btn', {'href': '/drive/'}, [
                                    h('i.fa.fa-hdd-o', {'aria-hidden': 'true'}),
                                    Msg.team_cat_drive
                                ]),
                                subButton
                            ])
                        ])
                    ]),
                ]),
                Pages.infopageFooter(),
            ]),
        ];
    };
});

