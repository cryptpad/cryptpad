define([
    '/common/hyperscript.js',
    '/common/common-language.js',
    '/customize/application_config.js',
    '/customize/messages.js',
    'jquery',
    '/api/config',
], function (h, Language, AppConfig, Msg, $, ApiConfig) {
    var Pages = {};

    Pages.setHTML = function (e, html) {
        e.innerHTML = html;
        return e;
    };

    Pages.externalLink = function (el, href) {
        if (!el) { return el; }
        el.setAttribute("rel", "noopener noreferrer");
        el.setAttribute("target", "_blank");
        if (typeof(href) === 'string') {
            el.setAttribute("href", href);
        }
        return el;
    };

    // this rewrites URLS to point to the appropriate translation:
    // French, German, or English as a default
    var documentedLanguages = ['en', 'fr', 'de'];
    Pages.localizeDocsLink = function (href) {
        try {
            var lang = Msg._getLanguage();
            if (documentedLanguages.indexOf(lang) > 0) {
                return href.replace('/en/', '/' + lang + '/');
            }
        } catch (err) {
            console.error(err);
            // if it fails just use the default href (English)
        }
        return href;
    };

    Pages.documentationLink = function (el, href) {
        return Pages.externalLink(el, Pages.localizeDocsLink(href));
    };

    var accounts = Pages.accounts = {
        donateURL: AppConfig.donateURL || "https://opencollective.com/cryptpad/",
        upgradeURL: AppConfig.upgradeURL
    };

    Pages.areSubscriptionsAllowed = function () {
        try {
            return ApiConfig.allowSubscriptions && accounts.upgradeURL && !ApiConfig.restrictRegistration;
        } catch (err) { return void console.error(err); }
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

    var footerCol = function (title, L, n) {
        n = n || 3;
        return h('div.col-sm-' + n, [
            h('ul.list-unstyled', [
                h('li.footer-title', {
                    'data-localization': title,
                }, Msg[title])
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

    Pages.versionString = "v4.14.0";

    var customURLs = Pages.customURLs = {};
    (function () {
        var defaultURLs = {
            //imprint: '/imprint.html',
            //privacy: '/privacy.html',
            terms: '/terms.html',
            //roadmap: '/roadmap.html',
            source: 'https://github.com/xwiki-labs/cryptpad',
        };
        var l = Msg._getLanguage();
        ['imprint', 'privacy', 'terms', 'roadmap', 'source'].forEach(function (k) {
            var value = AppConfig[k];
            if (value === false) { return; }
            if (value === true) {
                customURLs[k] = defaultURLs[k];
                return;
            }

            if (!value) { return; }
            if (typeof(value) === 'string') {
                customURLs[k] = value;
                return;
            }
            if (typeof(value) === 'object') {
                customURLs[k] = value[l] || value['default'];
            }
        });
    }());

    // used for the about menu
    Pages.imprintLink = footLink(customURLs.imprint, 'imprint');
    Pages.privacyLink = footLink(customURLs.privacy, 'privacy');
    Pages.termsLink = footLink(customURLs.terms, 'footer_tos');
    Pages.sourceLink = footLink(customURLs.source, 'footer_source');
    Pages.docsLink = footLink('https://docs.cryptpad.fr', 'docs_link');
    Pages.roadmapLink = footLink(customURLs.roadmap, 'footer_roadmap');

    Pages.infopageFooter = function () {
        var legalFooter;

        // only display the legal part of the footer if it has content
        if (Pages.termsLink || Pages.privacyLink || Pages.imprintLink) {
            legalFooter = footerCol('footer_legal', [
                Pages.termsLink,
                Pages.privacyLink,
                Pages.imprintLink,
            ]);
        }

        var n = legalFooter ? 3: 4;

        return h('footer', [
            h('div.container', [
                h('div.row', [
                    h('div.col-sm-' + n, [
                        h('div.cp-logo-foot', [
                            h('img', {
                                src: '/customize/CryptPad_logo.svg',
                                "aria-hidden": true,
                                alt: ''
                            }),
                            h('span.logo-font', 'CryptPad')
                        ])
                    ]),
                    footerCol('footer_product', [
                        footLink('/what-is-cryptpad.html', 'topbar_whatIsCryptpad'),
                        Pages.docsLink,
                        footLink('/features.html', Pages.areSubscriptionsAllowed()? 'pricing': 'features'), // Messages.pricing, Messages.features
                        Pages.sourceLink,
                        footLink('https://opencollective.com/cryptpad/contribute/', 'footer_donate'),
                    ], n),
                    footerCol('footer_aboutUs', [
                        footLink('https://blog.cryptpad.fr/', 'blog'),
                        footLink('/contact.html', 'contact'),
                        footLink('https://github.com/xwiki-labs/cryptpad/wiki/Contributors', 'footer_team'),
                        footLink('http://www.xwiki.com', null, 'XWiki SAS'),
                        Pages.roadmapLink,
                    ], n),
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
        var registerLink;

        if (!ApiConfig.restrictRegistration) {
            registerLink = h('a.nav-item.nav-link.cp-register-btn', { href: '/register/'}, Msg.login_register);
        }

        if (username === null) {
            rightLinks = [
                h('a.nav-item.nav-link.cp-login-btn', { href: '/login/'}, Msg.login_login),
                registerLink,
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
                h('a.nav-item.nav-link', { href: '/features.html'}, Pages.areSubscriptionsAllowed()? Msg.pricing: Msg.features),
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
