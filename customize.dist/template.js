define([
    'jquery',
    '/common/hyperscript.js',
    '/common/cryptpad-common.js',
    '/customize/pages.js',
    '/api/config',

    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
], function ($, h, Cryptpad, Pages, Config) {
$(function () {
    var urlArgs = Config.requireConf.urlArgs;
    var Messages = Cryptpad.Messages;
    var $body = $('body');
    var isMainApp = function () {
        console.error("Checking if is main app");
        return /^\/(pad|code|slide|poll|whiteboard|file|media|drive)\/$/.test(location.pathname);
    };

    var rightLink = function (ref, loc, txt) {
        return h('span.link.right', [
            h('a', { href: ref, 'data-localization': loc}, txt)
        ]);
    };

    var $topbar = $(h('div#cryptpadTopBar', [
        h('span', [
            h('a.gotoMain', {href: '/'}, [
                h('img.cryptpad-logo', {
                    src: '/customize/cryptofist_mini.png?' + urlArgs,
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

    var infoPage = function () {
        return h('div#mainBlock.hidden', typeof(Pages[location.pathname]) === 'function'?
            Pages[location.pathname](): [h('div#container')]);
    };

    var $main = $(infoPage());

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

    var pathname = location.pathname;

    if (isMainApp()) {
        console.log("Is main app");
        if (typeof(Pages[pathname]) === 'function') {
            require([
                'less!/customize/src/less/loading.less'
            ], function () {
                //$('body').html(h('body', Pages[pathname]()).innerHTML);

                console.log("TEMPLATED");

                if (/whiteboard/.test(pathname)) {
                    $('body').html(h('body', Pages[pathname]()).innerHTML);
                    setTimeout(function () {
                        require(['/whiteboard/main.js'], function () {
                            $('body').removeClass('noscroll');
                        });
                    });
                } else if (/poll/.test(pathname)) {
                    $('body').html(h('body', Pages[pathname]()).innerHTML);
                    setTimeout(function () {
                        require(['/poll/main.js'], function () {
                            $('body').removeClass('noscroll');
                            console.log("TEMPLATE!");
                        });
                    });
                } else if (/drive/.test(pathname)) {
                    $('body').append(h('body', Pages[pathname]()).innerHTML);
                    setTimeout(function () {
                        require(['/drive/main.js'], function () {
                            console.log("Templating done");
                        });
                    });
                } else if (/file/.test(pathname)) {
                    $('body').append(h('body', Pages[pathname]()).innerHTML);
                    require([ '/file/main.js' ], function () {
                        console.log("Templating done");
                    });
                } else if (/pad/.test(pathname)) {
                    $('body').append(h('body', Pages[pathname]()).innerHTML);
                    require([ '/pad/main.js' ], function () {
                        console.log("Templating done");
                    });
                } else if (/code/.test(pathname)) {
                    $('body').append(h('body', Pages[pathname]()).innerHTML);
                    require([ '/code/main.js' ], function () {
                        console.log("Templating done");
                    });
                } else if (/slide/.test(pathname)) {
                    $('body').append(h('body', Pages[pathname]()).innerHTML);
                    require([ '/slide/main.js' ], function () {
                        console.log("Templating done");
                    });
                }
            });

            return;
        }
    }

    require([
        'less!/customize/src/less/cryptpad.less',
        'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    ], function () {
        $body.append($topbar).append($main).append($footer);

        if (/^\/settings\//.test(pathname)) {
            require([ '/settings/main.js', ], function () {});
        } else if (/^\/profile\//.test(pathname)) {
            require([ '/profile/main.js'], function () {});
        } else if (/^\/user\//.test(pathname)) {
            require([ '/user/main.js'], function () {});
        } else if (/^\/register\//.test(pathname)) {
            require([ '/register/main.js' ], function () {});
        } else if (/^\/login\//.test(pathname)) {
            require([ '/login/main.js' ], function () {});
        } else if (/^\/($|^\/index\.html$)/.test(pathname)) {
            // TODO use different top bar
            require([ '/customize/main.js', ], function () {});
        } else {
            require([ '/customize/main.js', ], function () {});
        }
    });
});
});
