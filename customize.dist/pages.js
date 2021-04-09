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

    // TODO make a docsLink function which wraps this
    // and points to the appropriate translation:
    // French, German, or English as a default
    Pages.externalLink = function (el, href) {
        if (!el) { return el; }
        el.setAttribute("rel", "noopener noreferrer");
        el.setAttribute("target", "_blank");
        if (typeof(href) === 'string') {
            el.setAttribute("href", href);
        }
        return el;
    };

    var languageSelector = function () {
        var options = [];
        var languages = Msg._languages;
        var selected = Msg._languageUsed;
        var keys = Object.keys(languages).sort();
        keys.forEach(function (l) {
            var attr = { value: l, role: 'option'};
            if (selected === l) { attr.selected = 'selected'; }
            options.push(h('option', attr, languages[l]));
        });
        var select = h('select', {role: 'listbox', 'label': 'language'}, options);
        $(select).change(function () {
            Language.setLanguage($(select).val() || '', null, function () {
                window.location.reload();
            });
        });
        return select;
    };

    var footerCol = function (title, L, literal) {
        return h('div.col-sm-3', [
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
        if (!ref) { return; }
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

    Pages.versionString = "v4.3.1";

    // used for the about menu
    Pages.imprintLink = AppConfig.imprint ? footLink(imprintUrl, 'imprint') : undefined;
    Pages.privacyLink = footLink(AppConfig.privacy, 'privacy');
    Pages.githubLink = footLink('https://github.com/xwiki-labs/cryptpad', null, 'GitHub');
    Pages.docsLink = footLink('https://docs.cryptpad.fr', 'docs_link');

    Pages.infopageFooter = function () {
        var terms = footLink('/terms.html', 'footer_tos'); // XXX
        var legalFooter;

        // only display the legal part of the footer if it has content
        if (terms || Pages.privacyLink || Pages.imprintLink) {
            legalFooter = footerCol('footer_legal', [
                Pages.privacyLink,
                Pages.imprintLink,
            ]);
        }

        return h('footer', [
            h('div.container', [
                h('div.row', [
                    h('div.col-sm-3', [
                        h('div.cp-logo-foot', [
                            h('img', {
                                src: '/customize/CryptPad_logo.svg',
                                "aria-hidden": true,
                                alt: ''
                            }),
                            h('span.logo-font', 'CryptPad')
                        ])
                    ], ''),
                    footerCol('footer_product', [
                        footLink('/what-is-cryptpad.html', 'topbar_whatIsCryptpad'),
                        Pages.docsLink,
                        footLink('/features.html', 'pricing'),
                        Pages.githubLink,
                        footLink('https://opencollective.com/cryptpad/contribute/', 'footer_donate'),
                    ]),
                    footerCol('footer_aboutUs', [
                        footLink('https://blog.cryptpad.fr/', 'blog'),
                        footLink('/contact.html', 'contact'),
                        footLink('https://github.com/xwiki-labs/cryptpad/wiki/Contributors', 'footer_team'),
                        footLink('http://www.xwiki.com', null, 'XWiki SAS'),
                    ]),
                    legalFooter,
                ])
            ]),
            h('div.cp-version-footer', [
                languageSelector(),
                h('span', "CryptPad " + Pages.versionString)
            ])
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
            h('a.navbar-brand', { href: '/index.html'}, [
                h('img', {
                    src: '/customize/CryptPad_logo.svg?',
                    'aria-hidden': true,
                    alt: ''
                }), 'CryptPad'
            ]),
            button,
            h('div.collapse.navbar-collapse.justify-content-end#menuCollapse', [
                h('a.nav-item.nav-link', { href: '/what-is-cryptpad.html'}, Msg.about),
                h('a.nav-item.nav-link', { href: 'https://docs.cryptpad.fr'}, Msg.docs_link),
                h('a.nav-item.nav-link', { href: '/features.html'}, Msg.pricing),
            ].concat(rightLinks))
        );
    };

    Pages.crowdfundingButton = function (onClick) {
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
            if (typeof(onClick) === 'function') { onClick(); }
        });

        return crowdFunding;
    };

    Pages.subscribeButton = function (onClick) {
        var _link = h('a', {
            href: AppConfig.upgradeURL || "/accounts/",
        });

        var subscribe = h('button', [
            Msg.features_f_subscribe,
        ]);

        $(subscribe).click(function () {
            _link.click();
            if (typeof(onClick) === 'function') { onClick(); }
        });

        return subscribe;
    };

    return Pages;
});
