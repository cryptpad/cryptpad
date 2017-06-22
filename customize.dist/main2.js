define([
    'jquery',
    '/common/hyperscript.js',
    '/common/cryptpad-common.js',
    '/customize/pages.js',

    'css!/customize/main.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
], function ($, h, Cryptpad, Pages) {
$(function () {
    var Messages = Cryptpad.Messages;
    var $body = $('body');

    var rightLink = function (ref, loc, txt) {
        return h('span.link.right', [
            h('a', { href: ref, 'data-localization': loc}, txt)
        ]);
    };

    var $topbar = $(h('div#cryptpadTopBar', [
        h('span', [
            h('a.gotoMain', {href: '/'}, [
                h('img.cryptpad-logo', {
                    src: '/customize/cryptofist_mini.png',
                    alt: '',
                }),
                'CryptPad'
            ])
        ]),
        h('span#user-menu.right.dropdown-bar'),
        h('span#language-selector.right.dropdown-bar'),

        rightLink('/about.html', 'about', 'About'),
        rightLink('/privacy.html', 'privacy', 'Privacy'),
        rightLink('/terms.html', 'terms', 'ToS'),
        rightLink('/contact.html', 'contact', 'Contact'),
        rightLink('https://blog.cryptpad.fr/', 'blog', 'Blog'),
        h('span.link.right', [
            h('button#upgrade.upgrade.btn.buttonSuccess', {
                style: { display: 'none' }
            })
        ])
        ]
    ));

    var $main = $(h('div#mainBlock.hidden',
        typeof(Pages[location.pathname]) === 'function'?
            Pages[location.pathname](): [h('div#container')]
    ));

    var footerCol = function (title, L, literal) {
        return h('div.col', [
            h('ul.list-unstyled', [
                h('li.title', {
                    'data-localization': title,
                }, title? Messages[title]: literal )
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
            text = Messages[loc];
        }
        return h('a', attrs, text);
    };

    var $footer = $(h('footer', [
        h('div.container', [
            h('div.row', [
                footerCol(null, [
                    footLink('/about.html', 'about'),
                    footLink('/terms.html', 'terms'),
                    footLink('/privacy.html', 'privacy'),
                ], 'CryptPad'),
                footerCol('footer_applications', [
                    footLink('/drive/', 'main_drive'),
                    footLink('/pad/', 'main_richText'),
                    footLink('/code/', 'main_code'),
                    footLink('/slide/', 'main_slide'),
                    footLink('/poll/', 'main_poll'),
                    footLink('/whiteboard/', null, Messages.type.whiteboard)
                ]),
                footerCol('footer_aboutUs', [
                    footLink('https://blog.cryptpad.fr', 'blog'),
                    footLink('https://labs.xwiki.com', null, 'XWiki Labs'),
                    footLink('http://www.xwiki.com', null, 'XWiki SAS'),
                    footLink('https://www.open-paas.org', null, 'OpenPaaS')
                ]),
                footerCol('footer_contact', [
                    footLink('https://riot.im/app/#/room/#cryptpad:matrix.org', null, 'Chat'),
                    footLink('https://twitter.com/cryptpad', null, 'Twitter'),
                    footLink('https://github.com/xwiki-labs/cryptpad', null, 'GitHub'),
                    footLink('/contact.html', null, 'Email')
                ])
            ])
        ]),
        h('div.version-footer', "CryptPad v1.10.0 (Kraken)")
    ]));

    $body.append($topbar).append($main).append($footer);

    if (/^\/settings\//.test(location.pathname)) {
        require([ '/settings/main.js', ], function () {});
    } else if (/^\/user\//.test(location.pathname)) {
        // do nothing. bogus app.
        require([ '/user/main.js'], function () {});
    } else if (/^\/register\//.test(location.pathname)) {
        require([ '/register/main.js' ], function () {});
    } else if (/^\/login\//.test(location.pathname)) {
        require([ '/login/main.js' ], function () {});
    } else {
        setTimeout(function () {
            require([ '/customize/main.js', ], function () {});
        });
    }
});
});
