define([
    '/api/config',
    '/common/hyperscript.js',
    '/common/cryptpad-common.js',
    'jquery'
], function (Config, h, Cryptpad, $) {
    var Pages = {};
    var Msg = Cryptpad.Messages;
    var urlArgs = Config.requireConf.urlArgs;

    var setHTML = function (e, html) {
        e.innerHTML = html;
        return e;
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

    var infopageFooter = function () {
        return h('footer', [
            h('div.container', [
                h('div.row', [
                    footerCol(null, [
                        setHTML(h('div.cp-bio-foot'), '<p>With CryptPad, you can make quick collaborative documents for taking notes and writing down ideas together.</p>'),
                    ], ''),
                   /* footerCol(null, [
                        footLink('/about.html', 'about'),
                        footLink('/terms.html', 'terms'),
                        footLink('/privacy.html', 'privacy'),
                    ], 'CryptPad'),*/
                    footerCol('footer_applications', [
                        footLink('/drive/', 'main_drive'),
                        footLink('/pad/', 'main_richText'),
                        footLink('/code/', 'main_code'),
                        footLink('/slide/', 'main_slide'),
                        footLink('/poll/', 'main_poll'),
                        footLink('/whiteboard/', null, Msg.type.whiteboard)
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
            h('div.cp-version-footer', "CryptPad v1.13.0 (Naiad)")
        ]);
    };

    var infopageTopbar = function () {
        var rightLinks;
        var username = window.localStorage.getItem('User_name');
        if (username === null) {
            rightLinks = [
                h('a.nav-item.nav-link.cp-login-btn', { href: '/login'}, Msg.login_login),
                h('a.nav-item.nav-link.cp-register-btn', { href: '/register'}, Msg.login_register)
            ];
        } else {
            rightLinks = h('a.nav-item.nav-link.cp-user-btn', { href: '/drive' }, [
                h('i.fa.fa-user-circle'),
                " ",
                username
            ]);
        }

        return h('nav.navbar.navbar-toggleable-md',
                     h('button.navbar-toggler.navbar-toggler-right', {'type':'button'}, {'data-toggle':'collapse'}, {'data-target':'#menuCollapse'}, {'aria-controls': 'menuCollapse'}, {'aria-expanded':'false'}, {'aria-label':'Toggle navigation'},
                    [h('i.fa.fa-bars ')
                    ]),
                    h('a.navbar-brand', { href: '/index.html'}),
                h('div.collapse.navbar-collapse.justify-content-end#menuCollapse', [  
                    h('a.nav-item.nav-link', { href: '/what-is-cryptpad.html'}, Msg.topbar_whatIsCryptpad),
                    h('a.nav-item.nav-link', { href: 'https://blog.cryptpad.fr/'}, Msg.blog),
                    h('a.nav-item.nav-link', { href: '/contact.html'}, Msg.contact),
                    h('a.nav-item.nav-link', { href: '/about.html'}, Msg.about),
                ].concat(rightLinks))
        );
    };

    Pages['/about.html'] = function () {
        return h('div#cp-main', [
            infopageTopbar(),
            h('div.container-fluid.cp-about-intro', [
                h('div.container', [
                    h('center', [
                    h('h1', Msg.about),
                    setHTML(h('p'), 'CryptPad is created inside of the Research Team at <a href="http://xwiki.com">XWiki SAS</a>, a small business located in Paris France and Iasi Romania. There are 3 core team members working on CryptPad plus a number of contributors both inside and outside of XWiki SAS.'),
                    ]),
                ]),
            ]),
            h('div.container.cp-container', [
                /*h('center', [
                    h('h1', Msg.about)
                ]),
                setHTML(h('p'), 'CryptPad is created inside of the Research Team at <a href="http://xwiki.com">XWiki SAS</a>, a small business located in Paris France and Iasi Romania. There are 3 core team members working on CryptPad plus a number of contributors both inside and outside of XWiki SAS.'),*/
                h('div.row', [
                    h('h2.col-12', 'Core Developers'),
                    h('div.col-md-4', [
                        h('img.bio-avatar', {'src': '/customize/images/aaron.jpg'}),
                        h('h3', "Aaron MacSween"),
                        setHTML(h('div#bio'), '<p>Aaron transitioned into distributed systems development from a background in jazz and live stage performance.</p><p>He appreciates the elegance of biological systems and functional programming, and focused on both as a student at the University of Toronto, where he studied cognitive and computer sciences.</p><p>He moved to Paris in 2015 to work as a research engineer at XWiki SAS, after having dedicated significant time to various cryptography-related software projects.</p><p>He spends his spare time experimenting with guitars, photography, science fiction, and spicy food.</p>')
                    ]),
                    h('div.col-md-4', [
                        h('img.bio-avatar', {'src': '/customize/images/caleb.jpg'}),
                        h('h3', "Caleb James Delisle"),
                        setHTML(h('div#bio'), '<p>Caleb is a cryptography developer, Machine Technology graduate of the Franklin County Technical School and lifelong tinkerer.</p><p>In 2011, he started the cjdns Open Source project to show that secure networking could be invisible and easily deployed.</p><p>After joining XWiki SAS in 2014, he started the CryptPad project with the intent of bringing the same transparent security to collaborative editing.</p><p>He\'s always trying to learn from more experienced colleagues and when someone passes through the Research Team office, his favorite words are "Pull up a chair!".</p>')
                    ]),
                    h('div.col-md-4', [
                        h('img.bio-avatar', {'src': '/customize/images/yann.jpg'}),
                        h('h3', "Yann Flory"),
                        setHTML(h('div#bio'), '<p>Yann is a mysterious person.</p>')
                    ]),
                ]),
                h('h2', 'Key Contributors'),
                h('div.row', [
                    h('div.col-md-4', [
                        h('img.bio-avatar', {'src': '/customize/images/Pierre-new.jpg'}),
                        h('h3', "Pierre Bondoerffer"),
                        setHTML(h('div#bio'), '<p>Resident CSS wizard and emoji extraordinaire, Pierre is passionate about anything related to technology. He loves to hack around computers and put parts together.</p><p>He is currently studying at 42, where he learns about algorithms, networking, kernel programming and graphics.</p><p>As a part of an internship, he joined XWiki SAS and worked on CryptPad to improve user experience. He also maintains the Spanish translation.</p>')
                    ]),
                    h('div.col-md-4', [
                        h('img.bio-avatar', {'src': '/customize/images/Catalin.jpg'}),
                        h('h3', "Catalin Scripcariu"),
                        setHTML(h('div#bio'), '<p> Catalin is a Maths majour and has worked in B2B sales for 12 years. Design was always his passion and 3 years ago he started to dedicate himself to web design and front-end.</p><p>At the beginning of 2017 he joined the Xwiki family, where he worked both on the business and the community side of XWiki, including the research team and CryptPad. </p>')
                    ]),
                    h('div.col-md-4', [
                        h('img.bio-avatar', {'src': '/customize/images/ludovic.jpg'}),
                        h('h3', "Ludovic Dubost"),
                        setHTML(h('div#bio'), '<p>A graduate of PolyTech (X90) and Telecom School in Paris, Ludovic Dubost started his career as a software architect for Netscape Communications Europe. He then became CTO of NetValue, one of the first French start-ups that went public. He left NetValue after the company was purchased by Nielsen/NetRatings and in 2004 launched XWiki, the next generation wiki.</p><p>Since the very beginning, Ludovic has been immensely helpful to the CryptPad project. He believed in the idea when there was nothing more than the collaborative pad and his help with sales strategy for the project.</p>')
                    ])
                ]),
            ]),
            infopageFooter()
        ]);
    };

    Pages['/privacy.html'] = function () {
        return h('div#cp-main', [
            infopageTopbar(),
            h('div.container.cp-container', [
                h('center', h('h1', Msg.policy_title)),
                h('h2', Msg.policy_whatweknow),
                h('p', Msg.policywhatweknow_p1),

                h('h2', Msg.policy_howweuse),
                h('p', Msg.policy_howweuse_p1),
                h('p', Msg.policy_howweuse_p2),

                h('h2', Msg.policy_whatwetell),
                h('p', Msg.policy_whatwetell_p1),

                h('h2', Msg.policy_links),
                h('p', Msg.policy_links_p1),

                h('h2', Msg.policy_ads),
                h('p', Msg.policy_ads_p1),

                h('h2', Msg.policy_choices),
                h('p', Msg.policy_choices_open),
                setHTML(h('p'), Msg.policy_choices_vpn),
            ]),
            infopageFooter()
        ]);
    };

    Pages['/terms.html'] = function () {
        return h('div#cp-main', [
            infopageTopbar(),
            h('div.container.cp-container', [
                h('center', h('h1', Msg.tos_title)),
                h('p', Msg.tos_legal),
                h('p', Msg.tos_availability),
                h('p', Msg.tos_e2ee),
                h('p', Msg.tos_logs),
                h('p', Msg.tos_3rdparties),
            ]),
            infopageFooter()
        ]);
    };

    Pages['/contact.html'] = function () {
        return h('div#cp-main', [
            infopageTopbar(),
            h('div.container.cp-container', [
                h('center', h('h1', Msg.contact)),
                setHTML(h('p'), Msg.main_about_p2)
            ]),
            infopageFooter(),
        ]);
    };

    Pages['/what-is-cryptpad.html'] = function () {
        return h('div#cp-main', [
            infopageTopbar(),
            h('div.container.cp-container', [
                h('center', h('h1', Msg.whatis_title)),
                setHTML(h('h2'), Msg.whatis_collaboration),
                setHTML(h('p'), Msg.whatis_collaboration_p1),
                h('img', { src: '/customize/images/pad_screenshot.png?' + urlArgs }),
                setHTML(h('p'), Msg.whatis_collaboration_p2),
                setHTML(h('p'), Msg.whatis_collaboration_p3),
                setHTML(h('h2'), Msg.whatis_zeroknowledge),
                h('div.row', [
                    h('div.col-md-4.align-self-center', [
                        h('img#zeroknowledge', { src: '/customize/images/zeroknowledge_small.png?' + urlArgs }),
                    ]),
                    h('div.col-md-8', [
                        setHTML(h('p'), Msg.whatis_zeroknowledge_p1),
                        setHTML(h('p'), Msg.whatis_zeroknowledge_p2),
                        setHTML(h('p'), Msg.whatis_zeroknowledge_p3),
                    ]),
                ]),
                setHTML(h('h2'), Msg.whatis_drive),
                setHTML(h('p'), Msg.whatis_drive_p1),
                h('img', { src: '/customize/images/drive_screenshot.png?' + urlArgs }),
                setHTML(h('p'), Msg.whatis_drive_p2),
                setHTML(h('p'), Msg.whatis_drive_p3),
                setHTML(h('h2'), Msg.whatis_business),
                setHTML(h('p'), Msg.whatis_business_p1),
                setHTML(h('p'), Msg.whatis_business_p2),
            ]),
            infopageFooter(),
        ]);
    };

    Pages['/'] = Pages['/index.html'] = function () {
        var showingMore = false;
        return [
            h('div#cp-main', [
                infopageTopbar(),
                h('div.container.cp-container', [
                    h('div.row', [
                        h('div.cp-title.col-12.col-sm-6', [
                            h('img', { src: '/customize/cryptpad-new-logo-colors-logoonly.png?' + urlArgs }),
                            h('h1', 'CryptPad'),
                            h('p', Msg.main_catch_phrase)
                        ]),
                        h('div.col-12.col-sm-6', [
                            [
                                [ 'pad', '/pad/', Msg.main_richTextPad, 'fa-file-word-o' ],
                                [ 'code', '/code/', Msg.main_codePad, 'fa-file-code-o' ],
                                [ 'slide', '/slide/', Msg.main_slidePad, 'fa-file-powerpoint-o' ],
                                [ 'poll.cp-more.cp-hidden', '/poll/', Msg.main_pollPad, 'fa-calendar' ],
                                [ 'whiteboard.cp-more.cp-hidden', '/whiteboard/', Msg.main_whiteboardPad, 'fa-paint-brush' ],
                                [ 'recent.cp-more.cp-hidden', '/drive/', Msg.main_localPads, 'fa-hdd-o' ]
                            ].map(function (x) {
                                return h('a', [
                                    { href: x[1] },
                                    h('div.bs-callout.cp-callout-' + x[0], [
                                        h('i.fa.' + x[3]),
                                        h('div', [ h('h4', x[2]) ])
                                    ])
                                ]);
                            }),
                            h('div.bs-callout.cp-callout-more', [
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
                            ])
                        ])
                    ])
                ]),
            ]),
        ];
    };

    var loadingScreen = function () {
        return h('div#loading', 
            h('div.loadingContainer', [
                h('img.cryptofist', {
                    src: '/customize/cryptpad-new-logo-colors-logoonly.png?' + urlArgs
                }),
                h('div.spinnerContainer',
                    h('span.fa.fa-circle-o-notch.fa-spin.fa-4x.fa-fw')),
                h('p', Msg.loading)
            ])
        );
    };
    loadingScreen = loadingScreen; // TODO use this

    Pages['/user/'] = Pages['/user/index.html'] = function () {
        return h('div#container');
    };

    Pages['/register/'] = Pages['/register/index.html'] = function () {
        return [h('div#cp-main', [
            infopageTopbar(),
            h('div.container.cp-container', [
                h('div.row.align-items-center', [
                h('div#data.hidden.col-md-6', [
                    h('h1', Msg.register_header),
                    setHTML(h('p.register-explanation'), Msg.register_explanation)
                ]),
                h('div#userForm.form-group.hidden.col-md-6', [
                    h('input.form-control#username', {
                        type: 'text',
                        autocomplete: 'off',
                        autocorrect: 'off',
                        autocapitalize: 'off',
                        spellcheck: false,
                        placeholder: Msg.login_username,
                        autofocus: true,
                    }),
                    h('input.form-control#password', {
                        type: 'password',
                        placeholder: Msg.login_password,
                    }),
                    h('input.form-control#password-confirm', {
                        type: 'password',
                        placeholder: Msg.login_confirm,
                    }),
                    h('div.checkbox-container', [
                        h('input#import-recent', {
                            name: 'import-recent',
                            type: 'checkbox',
                            checked: true
                        }),
                        // hscript doesn't generate for on label for some
                        // reason... use jquery as a temporary fallback
                        setHTML($('<label for="import-recent"></label>')[0], Msg.register_importRecent)
                        /*h('label', {
                            'for': 'import-recent',
                        }, Msg.register_importRecent),*/
                    ]),
                    h('div.checkbox-container', [
                        h('input#accept-terms', {
                            name: 'accept-terms',
                            type: 'checkbox'
                        }),
                        setHTML($('<label for="accept-terms"></label>')[0], Msg.register_acceptTerms)
                        /*setHTML(h('label', {
                            'for': 'accept-terms',
                        }), Msg.register_acceptTerms),*/
                    ]),
                    h('button#register.btn.btn-primary', Msg.login_register)
                ])
                ]),
            ]),
            infopageFooter(),
        ])];
    };

    Pages['/login/'] = Pages['/login/index.html'] = function () {
        return [h('div#cp-main', [
            infopageTopbar(),
            h('div.container.cp-container', [
                h('div.row.align-items-center', [
                    h('div#data.hidden.col-md-6', setHTML(h('p.left'), Msg.main_info)),
                    h('div#userForm.form-group.hidden.col-md-6', [
                        h('input.form-control#name', {
                            name: 'name',
                            type: 'text',
                            autocomplete: 'off',
                            autocorrect: 'off',
                            autocapitalize: 'off',
                            spellcheck: false,
                            placeholder: Msg.login_username,
                            autofocus: true,
                        }),
                        h('input.form-control#password', {
                            type: 'password',
                            'name': 'password',
                            placeholder: Msg.login_password,
                        }),
                        h('div.extra', [
                            h('button.btn.btn-primary.login.first', Msg.login_login),
                            h('button#register.btn.btn-success.register', Msg.login_register)
                        ])
                    ])
                ]),
            ]),
            infopageFooter(),
        ])];
    };

    var appToolbar = function () {
        return h('div#toolbar.toolbar-container');
    };

    Pages['/whiteboard/'] = Pages['/whiteboard/index.html'] = function () {
        return [
            appToolbar(),
            h('div#canvas-area', h('canvas#canvas', {
                width: 600,
                height: 600
            })),
            h('div#controls', {
                style: {
                    display: 'block',
                }
            }, [
                h('button#clear.btn.btn-danger', Msg.canvas_clear), ' ',
                h('button#toggleDraw.btn.btn-secondary', Msg.canvas_disable),
                h('button#delete.btn.btn-secondary', {
                    style: {
                        display: 'none',
                    }
                }, Msg.canvas_delete),
                h('div.range-group', [
                    h('label', {
                        'for': 'width'
                    }, Msg.canvas_width),
                    h('input#width', {
                        type: 'range',
                        value: "5",
                        min: "1",
                        max: "100"
                    }),
                    h('span#width-val', '5px')
                ]),
                h('div.range-group', [
                    h('label', {
                        'for': 'opacity',
                    }, Msg.canvas_opacity),
                    h('input#opacity', {
                        type: 'range',
                        value: "1",
                        min: "0.1",
                        max: "1",
                        step: "0.1"
                    }),
                    h('span#opacity-val', '100%')
                ]),
                h('span.selected', [
                    h('img', {
                        title: Msg.canvas_currentBrush
                    })
                ])
            ]),
            setHTML(h('div#colors'), '&nbsp;'),
            loadingScreen(),
            h('div#cursors', {
                style: {
                    display: 'none',
                    background: 'white',
                    'text-align': 'center',
                }
            }),
            h('div#pickers'),
        ];
    };

    Pages['/poll/'] = Pages['/poll/index.html'] = function () {
        return [
            appToolbar(),
            h('div#content', [
                h('div#poll', [
                    h('div#howItWorks', [
                        h('h1', 'CryptPoll'),
                        setHTML(h('h2'), Msg.poll_subtitle),
                        h('p', Msg.poll_p_save),
                        h('p', Msg.poll_p_encryption)
                    ]),
                    h('div.upper', [
                        h('button#publish.btn.btn-success', {
                            style: { display: 'none' }
                        }, Msg.poll_publish_button),
                        h('button#admin.btn.btn-primary', {
                            style: { display: 'none' },
                            title: Msg.poll_admin_button
                        }, Msg.poll_admin_button),
                        h('button#help.btn.btn-secondary', {
                            title: Msg.poll_show_help_button
                        }, Msg.poll_show_help_button)
                    ]),
                    h('div.realtime', [
                        h('br'),
                        h('center', [
                            h('textarea#description', {
                                rows: "5",
                                cols: "50",
                                disabled: true
                            }),
                            h('br')
                        ]),
                        h('div#tableContainer', [
                            h('div#tableScroll'),
                            h('button#create-user.btn.btn-secondary', {
                                title: Msg.poll_create_user
                            }, h('span.fa.fa-plus')),
                            h('button#create-option.btn.btn-secondary', {
                                title: Msg.poll_create_option
                            }, h('span.fa.fa-plus')),
                            h('button#commit.btn.btn-secondary', {
                                title: Msg.poll_commit
                            }, h('span.fa.fa-check'))
                        ])
                    ])
                ])
            ]),
            loadingScreen()
        ];
    };

    Pages['/drive/'] = Pages['/drive/index.html'] = function () {
        return loadingScreen();
    };

    Pages['/file/'] = Pages['/file/index.html'] = function () {
        return loadingScreen();
    };

    Pages['/contacts/'] = Pages['/contacts/index.html'] = function () {
        return loadingScreen();
    };

    Pages['/pad/'] = Pages['/pad/index.html'] = function () {
        return loadingScreen();
    };

    Pages['/code/'] = Pages['/code/index.html'] = function () {
        return loadingScreen();
    };

    Pages['/slide/'] = Pages['/slide/index.html'] = function () {
        return loadingScreen();
    };

    Pages['/invite/'] = Pages['/invite/index.html'] = function () {
        return loadingScreen();
    };

    Pages['/settings/'] = Pages['/settings/index.html'] = function () {
        return [
            h('div#toolbar'),
            h('div#container'),
            loadingScreen()
        ];
    };

    Pages['/profile/'] = Pages['/profile/index.html'] = function () {
        return [
            h('div#toolbar'),
            h('div#container'),
            loadingScreen()
        ];
    };

    Pages['/todo/'] = Pages['/todo/index.html'] = function () {
        return [
            h('div#toolbar'),
            h('div#container'),
            loadingScreen()
        ];
    };

    return Pages;
});
