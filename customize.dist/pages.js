define([
    '/common/hyperscript.js',
    '/common/cryptpad-common.js',
], function (h, Cryptpad) {
    var Pages = {};
    var Msg = Cryptpad.Messages;

    var setHTML = function (e, html) {
        e.innerHTML = html;
        return e;
    };

    Pages['/about.html'] = function () {
        return h('div#main_other', [
            h('center', [
                h('h1', Msg.about)
            ]),
            setHTML(h('p'), Msg.main_p2),
            h('h2', Msg.main_howitworks),
            setHTML(h('p', Msg.main_howitworks_p1))
        ]);
    };

    Pages['/privacy.html'] = function () {
        return h('div#main_other', [
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

            h('br')
        ]);
    };

    Pages['/terms.html'] = function () {
        return h('div#main_other', [
            h('center', h('h1', Msg.tos_title)),
            h('p', Msg.tos_legal),
            h('p', Msg.tos_availability),
            h('p', Msg.tos_e2ee),
            h('p', Msg.tos_logs),
            h('p', Msg.tos_3rdparties),
        ]);
    };

    Pages['/contact.html'] = function () {
        return h('div#main_other', [
            h('center', h('h1', Msg.contact)),
            setHTML(h('p'), Msg.main_about_p2)
        ]);
    };

    var userForm = function () {
        return h('div#userForm.form-group.hidden', [
            h('input#name.form-control', {
                name: 'name',
                type: 'text',
                placeholder: Msg.login_username
            }),
            h('input#password.form-control', {
                name: 'password',
                type: 'password',
                placeholder: Msg.login_password
            }),
            h('div', {
                style: { display: 'none' }
            }, [
                h('span.remember.form-check', [
                    h('label.form-check-label', {
                        'for': 'rememberme',
                        placeholder: Msg.login_remember,
                    }, [
                        h('input#rememberme.form-check-input', {
                            type: 'checkbox',
                            checked: true
                        })
                    ])
                ])
            ]),
            h('button.btn.btn-secondary.login.half.first', Msg.login_login),
            h('button.btn.btn-success.register.half.first', Msg.login_register),
            h('p.separator', Msg.login_orNoLogin),
            h('p#buttons.buttons'),
            h('p.driveLink', [
                h('a.gotodrive', {
                    href: '/drive/'
                }, Msg.login_nologin)
            ])
        ]);
    };

    var indexContent = function () {
        return [
            h('div.page.category.first#knowmore', [
                h('center', [
                    h('h1', Msg.main_howitworks)
                ])
            ]),
            h('div.page', [
                h('div.info-container', [
                    h('div.left.image', [
                        h('img', {
                            src: '/customize/images/zeroknowledge_small.png',
                            alt: 'Zero Knowledge'
                        })
                    ]),
                    h('div.right', [
                        h('h2', Msg.main_zeroKnowledge),
                        setHTML(h('p'), Msg.main_zeroKnowledge_p)
                    ])
                ])
            ]),
            h('div.page.even', [
                h('div.info-container', [
                    h('div.left', [
                        h('h2', Msg.main_writeItDown),
                        h('p', Msg.main_writeItDown_p)
                    ]),
                    h('div.right.image', [
                        h('img', {
                            alt: "User account",
                            src: '/customize/images/realtime_small.png',
                        })
                    ])
                ])
            ]),
            h('div.page', [
                h('div.info-container', [
                    h('div.left.image', [
                        h('img', {
                            src: '/customize/images/key_small.png',
                            alt: 'User account'
                        })
                    ]),
                    h('div.right', [
                        h('h2', Msg.main_share),
                        h('p', Msg.main_share_p)
                    ])
                ])
            ]),
            h('div.page.even', [
                h('div.info-container', [
                    h('div.left', [
                        h('h2', Msg.main_organize),
                        h('p', Msg.main_organize_p)
                    ]),
                    h('div.right.image', [
                        h('img', {
                            src: '/customize/images/organize.png',
                            alt: 'User account'
                        })
                    ])
                ])
            ])
        ];
    };

    var appButton = function (alt, h2, img, p, url, btn, id) {
        return h('div.app', [
            h('center', [
                h('h2', h2),
                h('img', {
                    alt: 'Rich Text application',
                    src: img,
                })
            ]),
            setHTML(h('p'), p),
            h('p.buttons', [
                h('a#' + id, {
                    href: url,
                }, [
                    h('button.btn.btn-secondary', btn),
                ])
            ])
        ]);
    };

    var tryIt = function () {
        return [
            h('div.class.category#tryit', [
                h('center', [
                    h('h1', Msg.tryIt)
                ])
            ]),
            h('div.page', [
                h('div.app-container', [
                    h('div.app-row', [
                        appButton("Rich Text application",
                            Msg.main_richText,
                            '/customize/images/pad.png',
                            Msg.main_richText_p,
                            '/pad/',
                            Msg.button_newpad,
                            'create-pad'),
                        appButton('Code application',
                            Msg.main_code,
                            '/customize/images/code.png',
                            Msg.main_code_p,
                            '/code/',
                            Msg.button_newcode,
                            'create-code'),
                        appButton('Slide application',
                            Msg.main_slide,
                            '/customize/images/slide.png',
                            Msg.main_slide_p,
                            '/slide/',
                            Msg.button_newslide,
                            'create-slide'),
                        appButton('Poll application',
                            Msg.main_poll,
                            '/customize/images/poll.png',
                            Msg.main_poll_p,
                            '/poll/',
                            Msg.button_newpoll,
                            'create-poll')
                    ])
                ])
            ])
        ];
    };

    Pages['/'] = Pages['/index.html'] = function () {
        return [
            h('div#main', [
                h('div.mainOverlay'),
                h('div#align-container', [
                    h('div#main-container', [
                        h('div#data.hidden', [
                            setHTML(h('p.left'), Msg.main_info),
                        ]),
                        userForm(),
                        h('div#loggedIn.hidden', [
                            h('p#loggedInHello'),
                            h('p', [
                                h('button.btn.btn-primary.gotodrive', Msg.login_accessDrive),
                            ]),
                            h('p', [
                                h('button#loggedInLogout.btn.btn-secondary', Msg.logoutButton)
                            ])
                        ])
                    ])
                ]),
            ])
        ]
        .concat(tryIt())
        .concat(indexContent());
    };

    Pages['/settings/'] = Pages['/settings/index.html'] = function () {
        return h('div#container');
    };

    Pages['/user/'] = Pages['/user/index.html'] = function () {
        return h('div#container');
    };

    Pages['/register/'] = Pages['/register/index.html'] = function () {
        return [h('div#main', [
            h('div.mainOverlay'),
            h('div#align-container', [
                h('div#data.hidden', [
                    h('h1', Msg.register_header),
                    h('br'),
                    setHTML(h('p.left.register-explanation'), Msg.register_explanation)
                ]),
                h('div#userForm.form-group.hidden', [
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
                    h('input#import-recent', {
                        type: 'checkbox',
                        checked: true
                    }),
                    h('label', {
                        'for': 'import-recent',
                    }, Msg.register_importRecent),
                    h('br'),
                    h('input#accept-terms', {
                        type: 'checkbox'
                    }),
                    setHTML(h('label', {
                        'for': 'accept-terms',
                    }), Msg.register_acceptTerms),
                    h('br'),
                    h('button#register.btn.btn-primary', Msg.login_register)
                ])
            ])
        ])];
    };

    Pages['/login/'] = Pages['/login/index.html'] = function () {
        return [h('div#main', [
            h('div.mainOverlay'),
            h('div#align-container',
                h('div#main-container', [
                    h('div#data.hidden', setHTML(h('p.left'), Msg.main_info)),
                    h('div#userForm.form-group.hidden', [
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
                        h('button.btn.btn-primary.login.first', Msg.login_login),
                        h('div.extra', [
                            h('p', Msg.login_notRegistered),
                            h('button#register.btn.btn-success.register.first', Msg.login_register)
                        ])
                    ])
                ])
            )
        ])];
    };

    return Pages;
});
