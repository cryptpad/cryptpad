define([
    '/common/hyperscript.js',
    '/common/common-language.js',
    '/customize/application_config.js',
    '/customize/messages.js',
    'jquery',
], function (h, Language, AppConfig, Msg, $) {
    var Pages = {};

    Pages.setHTML = function (e, html) {
        e.innerHTML = html;
        return e;
    };

    var languageSelector = function () {
        var options = [];
        var languages = Msg._languages;
        var selected = Msg._languageUsed;
        var keys = Object.keys(languages).sort();
        keys.forEach(function (l) {
            var attr = { value: l };
            if (selected === l) { attr.selected = 'selected'; }
            options.push(h('option', attr, languages[l]));
        });
        var select = h('select', {}, options);
        $(select).change(function () {
            Language.setLanguage($(select).val() || '', null, function () {
                window.location.reload();
            });
        });
        return select;
    };

    var footerCol = function (title, L, literal) {
        return h('div.col-6.col-sm-3', [
            h('ul.list-unstyled', [
                h('li.footer-title', {
                    'data-localization': title,
                }, title? Msg[title]: literal )
                ].concat(L.map(function (l) {
                    return h('li', [ l ]);
                }))
            )
        ]);
    };

    var footLink = function (ref, loc, text) {
        var attrs =  {
            href: ref,
        };
        if (!/^\//.test(ref)) {
            attrs.target = '_blank';
            attrs.rel = 'noopener noreferrer';
        }
        if (loc) {
            attrs['data-localization'] =  loc;
            text = Msg[loc];
        }
        return h('a', attrs, text);
    };

    var imprintUrl = AppConfig.imprint && (typeof(AppConfig.imprint) === "boolean" ?
                        '/imprint.html' : AppConfig.imprint);
    Pages.infopageFooter = function () {
        return h('footer', [
            h('div.container', [
                h('div.row', [
                    footerCol(null, [
                        h('div.cp-bio-foot', [
                            h('p', Msg.main_footerText),
                            languageSelector()
                        ])
                    ], ''),
                    /*footerCol('footer_applications', [
                        footLink('/drive/', 'main_drive'),
                        footLink('/pad/', 'main_richText'),
                        footLink('/code/', 'main_code'),
                        footLink('/slide/', 'main_slide'),
                        footLink('/poll/', 'main_poll'),
                        footLink('/kanban/', 'main_kanban'),
                        footLink('/whiteboard/', null, Msg.type.whiteboard)
                    ]),*/
                    footerCol('footer_product', [
                        footLink('https://cryptpad.fr/what-is-cryptpad.html', 'topbar_whatIsCryptpad'),
                        footLink('/faq.html', 'faq_link'),
                        footLink('https://github.com/xwiki-labs/cryptpad', null, 'GitHub'),
                        footLink('https://opencollective.com/cryptpad/contribute/', 'footer_donate'),
                    ]),
                    footerCol('footer_aboutUs', [
                        /*footLink('https://blog.cryptpad.fr', 'blog'),
                        footLink('https://labs.xwiki.com', null, 'XWiki Labs'),*/
                        footLink('http://www.xwiki.com', null, 'XWiki SAS'),
                        footLink('https://www.open-paas.org', null, 'OpenPaaS'),
                        footLink('/about.html', 'footer_team'),
                        footLink('/contact.html', 'contact'),
                    ]),
                    footerCol('footer_legal', [
                        footLink('/terms.html', 'footer_tos'),
                        footLink('/privacy.html', 'privacy'),
                        AppConfig.imprint ? footLink(imprintUrl, 'imprint') : undefined,
                    ]),
                    /*footerCol('footer_contact', [
                        footLink('https://riot.im/app/#/room/#cryptpad:matrix.org', null, 'Chat'),
                        footLink('https://twitter.com/cryptpad', null, 'Twitter'),
                        footLink('https://github.com/xwiki-labs/cryptpad', null, 'GitHub'),
                        footLink('/contact.html', null, 'Email')
                    ])*/
                ])
            ]),
            h('div.cp-version-footer', "CryptPad v3.18.0 (Smilodon)")
        ]);
    };

    Pages.infopageTopbar = function () {
        var rightLinks;
        var username = window.localStorage.getItem('User_name');
        if (username === null) {
            rightLinks = [
                h('a.nav-item.nav-link.cp-login-btn', { href: '/login/'}, Msg.login_login),
                h('a.nav-item.nav-link.cp-register-btn', { href: '/register/'}, Msg.login_register)
            ];
        } else {
            rightLinks = h('a.nav-item.nav-link.cp-user-btn', { href: '/drive/' }, [
                h('i.fa.fa-user-circle'),
                " ",
                username
            ]);
        }

        var button = h('button.navbar-toggler', {
            'type':'button',
            /*'data-toggle':'collapse',
            'data-target':'#menuCollapse',
            'aria-controls': 'menuCollapse',
            'aria-expanded':'false',
            'aria-label':'Toggle navigation'*/
        }, h('i.fa.fa-bars '));

        $(button).click(function () {
            if ($('#menuCollapse').is(':visible')) {
                return void $('#menuCollapse').slideUp();
            }
            $('#menuCollapse').slideDown();
        });

        return h('nav.navbar.navbar-expand-lg',
            h('a.navbar-brand', { href: '/index.html'}),
            button,
            h('div.collapse.navbar-collapse.justify-content-end#menuCollapse', [
                //h('a.nav-item.nav-link', { href: '/what-is-cryptpad.html'}, Msg.topbar_whatIsCryptpad), // Moved the FAQ
                //h('a.nav-item.nav-link', { href: '/faq.html'}, Msg.faq_link),
                h('a.nav-item.nav-link', { href: 'https://blog.cryptpad.fr/'}, Msg.blog),
                h('a.nav-item.nav-link', { href: '/features.html'}, Msg.pricing),
                h('a.nav-item.nav-link', { href: '/privacy.html'}, Msg.privacy),
                //h('a.nav-item.nav-link', { href: '/contact.html'}, Msg.contact),
                //h('a.nav-item.nav-link', { href: '/about.html'}, Msg.about),
            ].concat(rightLinks))
        );
    };

    return Pages;
});
