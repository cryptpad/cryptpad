define([
    '/common/hyperscript.js',
    '/common/common-language.js',
    '/customize/application_config.js',
    '/customize/messages.js',
    'jquery',
    '/api/config',
    'optional!/api/instance',
], function (h, Language, AppConfig, Msg, $, ApiConfig, Instance) {
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

/* // XXX remove ?
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
*/

    var footLink = function (ref, loc, text, icon) {
        if (!ref) { return; }
        var attrs =  {
            href: ref,
        };
        var iconName = '';
        if (!/^\//.test(ref)) {
            attrs.target = '_blank';
            attrs.rel = 'noopener noreferrer';
        }
        if (loc) {
            attrs['data-localization'] =  loc;
            text = Msg[loc];
        }
        if (icon) {
            iconName = 'i.fa.fa-' + icon;
            icon = h(iconName);
        }
        return h('a', attrs, [icon, text]);
    };

    Pages.versionString = "5.0.0";

    var customURLs = Pages.customURLs = {};
    (function () {
        // XXX DB: review this:
        // almost all pages are commented out
        // would the imprint page get generated if it was present?
        var defaultURLs = {
            //imprint: '/imprint.html',
            //privacy: '/privacy.html',
            // terms: '/terms.html',
            //roadmap: '/roadmap.html',
            source: 'https://github.com/xwiki-labs/cryptpad',
        };
        var l = Msg._getLanguage();
        ['imprint', 'privacy', 'terms', 'roadmap', 'source'].forEach(function (k) {
            var value = AppConfig[k];
            console.log('links', k, value);
            if (value === false) { return; }
            if (value === true) {
                customURLs[k] = defaultURLs[k];
                return;
            }
            if (typeof(value) === 'string') {
                customURLs[k] = value;
                return;
            }
            if (typeof(value) === 'object') {
                customURLs[k] = value[l] || value['default'];
            }
        });
        var value = AppConfig.hostDescription;
        Pages.hostDescription = (value && (value[l] || value.default)) ||  Msg.home_host;

        Pages.Instance = {};
        Object.keys(Instance).forEach(function (k) {
            var value = Instance[k];
            Pages.Instance[k] = value[l] || value.default || undefined;
        });

        var name;
        try {
            name = Pages.Instance.name || new URL('/', ApiConfig.httpUnsafeOrigin).host;
        } catch (err) {
            name = 'CryptPad';
        }
        Pages.Instance.name = name;
        Pages.Instance.description = Pages.Instance.description || Msg.main_catch_phrase;
    }());

    // used for the about menu
    Pages.imprintLink = footLink(customURLs.imprint, 'imprint');
    Pages.privacyLink = footLink(customURLs.privacy, 'privacy');
    Pages.termsLink = footLink(customURLs.terms, 'footer_tos');
    Pages.sourceLink = footLink(customURLs.source, 'footer_source');
    Pages.docsLink = footLink('https://docs.cryptpad.fr', 'docs_link');
    Pages.roadmapLink = footLink(customURLs.roadmap, 'footer_roadmap');

    Msg.footer_website = "Project Website"; // XXX

    Pages.infopageFooter = function () {
        return h('footer.cp-footer', [
            h('div.cp-footer-left', [
                h('div.cp-logo-foot', [
                    h('img', {
                        src: '/customize/CryptPad_logo.svg',
                        "aria-hidden": true,
                        alt: ''
                    }),
                    h('span.logo-font', 'CryptPad')
                ]),
                h('div.cp-logo-btns', [
                    footLink('https://cryptpad.org', null, Msg.footer_website, 'link'),
                    footLink('https://opencollective.com/cryptpad/contribute/', 'footer_donate', null, 'money') // XXX DB: add OpenCollective icon

                ])
            ]),
            h('div.cp-footer-center', [
                h('div.cp-footer-language', [
                    h('i.fa.fa-language', {'aria-hidden': 'true'}),
                    languageSelector()
                ])
            ]),
            h('div.cp-footer-right', [
                h('span.cp-footer-version', 'Version: ' + Pages.versionString) // XXX DB: translate 'Version' ?
            ])
        ]);
    };

    Pages.infopageTopbar = function () {
        var rightLinks;
        var username = window.localStorage.getItem('User_name');
        var registerLink;

        if (!ApiConfig.restrictRegistration) {
            registerLink = h('a.nav-item.nav-link.cp-register-btn', { href: '/register/'}, [
                h('i.fa.fa-user', {'aria-hidden':'true'}),
                Msg.login_register
            ]);
        }

        if (username === null) {
            rightLinks = [
                h('a.nav-item.nav-link.cp-login-btn', { href: '/login/'}, [
                    h('i.fa.fa-sign-in', {'aria-hidden':'true'}),
                    Msg.login_login
                ]),
                registerLink,
            ];
        } else {
            rightLinks = h('a.nav-item.nav-link.cp-user-btn', { href: '/drive/' }, [
                h('i.fa.fa-user-circle', {'aria-hidden':'true'}),
                " ",
                username
            ]);
        }

        // var button = h('button.navbar-toggler', {
        //     'type':'button',
        //     'data-toggle':'collapse',
        //     'data-target':'#menuCollapse',
        //     'aria-controls': 'menuCollapse',
        //     'aria-expanded':'false',
        //     'aria-label':'Toggle navigation'
        // }, h('i.fa.fa-bars '));

        // // XXX button to collapse navbar on small screens
        // $(button).click(function () {
        //     if ($('#menuCollapse').is(':visible')) {
        //         return void $('#menuCollapse').slideUp();
        //     }
        //     $('#menuCollapse').slideDown();
        // });

        var isHome = ['/', '/index.html'].includes(window.location.pathname);
        var homeLink = h('a.nav-item.nav-link' /* .navbar-brand */, { href: '/index.html' }, [
            'Home page', // XXX replace with image or whatever
        ]);

        return h('nav.navbar.navbar-expand-lg',
            // XXX DB add link back to index.html on other pages
            // h('a.navbar-brand', { href: '/index.html'}, [
            //     h('img', {
            //         src: '/customize/CryptPad_logo.svg?',
            //         'aria-hidden': true,
            //         alt: ''
            //     }), 'CryptPad'
            // ]),
            // button, // XXX collapse button
            // add .collapse.navbar-collapse.justify-content-end#menuCollapse to div below to enable collapse button
            [
                !isHome? homeLink: undefined,
                h('a.nav-item.nav-link', { href: '/features.html'}, Pages.areSubscriptionsAllowed()? Msg.pricing: Msg.features),
                h('a.nav-item.nav-link', { href: 'https://docs.cryptpad.fr'},
                    [h('i.fa.fa-book', {'aria-hidden':'true'}),Msg.docs_link]),
            ].concat(rightLinks)
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

    return Pages;
});
