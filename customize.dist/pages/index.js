define([
    'jquery',
    '/api/config',
    '/common/hyperscript.js',
    '/common/common-feedback.js',
    '/common/common-interface.js',
    '/common/textFit.min.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/common/outer/local-store.js',
    '/customize/pages.js'
], function ($, Config, h, Feedback, UI, TextFit, Msg, AppConfig, LocalStore, Pages) {
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
                [ 'poll', Msg.type.poll],
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
                         sessionStorage.redirectTo = href;
                         window.location.href = '/login/';
                    }
                };
                if (!isEnabled) {
                    s += '.cp-app-disabled';
                    attr.title = Msg.mustLogin;
                }
                return h('a', [
                    attr,
                    h(s, [
                        h('i.' + font + '.' + icon),
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

        /* // XXX remove this commented code?
        var more = icons.length < 4? undefined: h('div.bs-callout.cp-callout-more', [
                h('div.cp-callout-more-lessmsg.cp-hidden', [
                    "see less ",
                    h('i.fa.fa-caret-up')
                ]),
                h('div.cp-callout-more-moremsg', [
                    "see more ",
                    h('i.fa.fa-caret-down')
                ]),
                {
                    onclick: function () {
                        if (showingMore) {
                            $('.cp-more, .cp-callout-more-lessmsg').addClass('cp-hidden');
                            $('.cp-callout-more-moremsg').removeClass('cp-hidden');
                        } else {
                            $('.cp-more, .cp-callout-more-lessmsg').removeClass('cp-hidden');
                            $('.cp-callout-more-moremsg').addClass('cp-hidden');
                        }
                        showingMore = !showingMore;
                    }
                }
            ]);*/

        var _link = h('a', {
            href: "https://opencollective.com/cryptpad/",
            target: '_blank',
            rel: 'noopener',
        });

        var crowdFunding = h('button', [
            Msg.crowdfunding_button
        ]);

        $(crowdFunding).click(function () {
            _link.click();
            Feedback.send('HOME_SUPPORT_CRYPTPAD');
        });

        Msg.home_privacy_title = "Private by design"; // XXX
        Msg.home_privacy_text = "CryptPad is built to enable collaboration while keeping data private. All information including documents, chats, and files is encrypted and decrypted by your browser. This means nothing is readable outside of the session where you are logged in. Even the service administrators do not have access to your information."; // XXX
        Msg.home_host_title = "About this instance"; // XXX
        // XXX adjust Msg.home_host, remove link to Github
        Msg.home_opensource_title = "Open Source"; // XXX
        Msg.home_opensource = 'Anyone can host CryptPad and offer the service in a personal or professional capacity. The source code is available on <a href="https://github.com/xwiki-labs/cryptpad">Github</a>.'; // XXX
        Msg.home_support_title = "Support CryptPad"; // XXX
        Msg.home_support = "<p>CryptPad does not profit from user's data. This is part of a vision for online services that respect privacy. Instead of pretending to be \"free\" like the big platforms, CryptPad aims to build a sustainable model: funded willingly by users instead of making profits from personal information.</p><p>You can support the project by making a one-time or recurring donation through our Open Collective. Our budget is transparent and updates are published regularly. There are also a number of <a href=\"https://docs.cryptpad.fr/en/how_to_contribute.html\" rel=\"noopener noreferrer\" target=\"_blank\">non-financial ways to contribute</a>.</p>" // XXX

        var blocks = [
            h('div.row.cp-index-section', [
                h('div.col-sm-6',
                    h('img.img-fluid', {
                        src:'/customize/images/shredder.png',
                        alt:'illustration, a shredder destroys a sheet of paper and antoher one reconstructs it'
                    })
                ),
                h('div.col-sm-6', [
                    h('h2', Msg.home_privacy_title),
                    h('p', Msg.home_privacy_text)
                ])
            ]),
            h('div.row.cp-index-section',
                h('div.col-sm-12', [
                    h('h2', Msg.home_host_title),
                    Pages.setHTML(h('p'), Msg.home_host) // XXX remove link and .setHTML from this key
                ])
            ),
            h('div.row.cp-index-section', [
                h('div.col-sm-6', [
                    h('h2', Msg.home_opensource_title),
                    Pages.setHTML(h('p'), Msg.home_opensource),
                    h('img.small-logo', {
                        src: '/customize/images/AGPLv3_Logo.svg',
                        alt: 'APGL3 License Logo'
                    })
                ]),
                h('div.col-sm-6', [
                    h('h2', Msg.home_support_title),
                    Pages.setHTML(h('span'), Msg.home_support),
                    crowdFunding
                ])
            ])
        ]

        Msg.main_catch_phrase = "Collaboration suite,<br>encrypted and open-source"; // XXX existing key
        return [
            h('div#cp-main', [
                Pages.infopageTopbar(),
                h('div.container.cp-container', [
                    h('div.row', [
                        h('div.cp-title.col-md-7', [
                            h('img', { src: '/customize/CryptPad_logo.svg?' + urlArgs }),
                            h('h1', 'CryptPad'),
                            UI.setHTML(h('span.tag-line'), Msg.main_catch_phrase)
                        ]),
                        h('div.col-md-5.cp-app-grid', [
                            icons,
                            // XXX remove this commented code?
                            //more
                        ])
                    ]),
                    blocks,
                    // XXX remove this commented code?
                    /*h('div.row', [
                        h('div.cp-crowdfunding', [
                            crowdFunding
                        ])
                    ])*/
                ]),
            ]),
            Pages.infopageFooter(),
        ];
    };
});

