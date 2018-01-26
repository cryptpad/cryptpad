define([
    '/api/config',
    '/common/hyperscript.js',
    '/customize/messages.js',
    'jquery',
    '/customize/application_config.js',
], function (Config, h, Msg, $, AppConfig) {
    var Pages = {};
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
                        h('div.cp-bio-foot', [
                            h('p', Msg.main_footerText)
                        ])
                    ], ''),
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
            h('div.cp-version-footer', "CryptPad v1.25.0 (Zombie)")
        ]);
    };

    var infopageTopbar = function () {
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

        return h('nav.navbar.navbar-toggleable-md',
                     h('button.navbar-toggler.navbar-toggler-right', {'type':'button'}, {'data-toggle':'collapse'}, {'data-target':'#menuCollapse'}, {'aria-controls': 'menuCollapse'}, {'aria-expanded':'false'}, {'aria-label':'Toggle navigation'},
                    [h('i.fa.fa-bars ')
                    ]),
                    h('a.navbar-brand', { href: '/index.html'}),
                h('div.collapse.navbar-collapse.justify-content-end#menuCollapse', [  
                    h('a.nav-item.nav-link', { href: '/what-is-cryptpad.html'}, Msg.topbar_whatIsCryptpad),
                    h('a.nav-item.nav-link', { href: 'https://blog.cryptpad.fr/'}, Msg.blog),
                    h('a.nav-item.nav-link', { href: '/features.html'}, Msg.features),
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
                h('div.row', [
                    h('div.cp-develop-about.col-12',[
                            h('div.cp-icon-cent'),
                            h('h2.text-center', 'Core Developers')
                        ]),
                    ]),
                h('div.row.align-items-center', [
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.cp-bio-avatar', [
                        h('img.img-fluid', {'src': '/customize/images/CalebJames.jpg'})
                            ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.cp-profile-det', [
                        h('h3', "Caleb James Delisle"),
                        h('hr'),
                        setHTML(h('div#bioCaleb'), '<p>Caleb is a cryptography developer, Machine Technology graduate of the Franklin County Technical School and lifelong tinkerer.<br/>In 2011, he started the cjdns Open Source project to show that secure networking could be invisible and easily deployed.<br/>After joining XWiki SAS in 2014, he started the CryptPad project with the intent of bringing the same transparent security to collaborative editing.<br/>He\'s always trying to learn from more experienced colleagues and when someone passes through the Research Team office, his favorite words are "Pull up a chair!".</p>'),
                        h('a.cp-soc-media', { href : 'https://twitter.com/cjdelisle'}, [
                                h('i.fa.fa-twitter')
                            ]),
                        h('a.cp-soc-media', { href : 'https://github.com/cjdelisle'}, [
                                h('i.fa.fa-github')
                            ])
                    ]),
                ]),
                h('div.row.align-items-center',[
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.push-lg-6.cp-bio-avatar.cp-bio-avatar-right', [
                            h('img.img-fluid', {'src': '/customize/images/AaronMacSween.jpg'})
                    ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.pull-lg-6.cp-profile-det',[
                        h('h3', "Aaron MacSween"),
                        h('hr'),
                        setHTML(h('div#bioAaron'), '<p>Aaron transitioned into distributed systems development from a background in jazz and live stage performance. <br/> He appreciates the elegance of biological systems and functional programming, and focused on both as a student at the University of Toronto, where he studied cognitive and computer sciences.<br/>He moved to Paris in 2015 to work as a research engineer at XWiki SAS, after having dedicated significant time to various cryptography-related software projects.<br/>He spends his spare time experimenting with guitars, photography, science fiction, and spicy food.</p>'),
                        h('a.cp-soc-media', { href : 'https://twitter.com/fc00ansuz'}, [
                                h('i.fa.fa-twitter')
                            ]),
                        h('a.cp-soc-media', { href : 'https://github.com/ansuz/'}, [
                                h('i.fa.fa-github')
                            ])
                    ]),
                ]),
                h('div.row.align-items-center', [
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.cp-bio-avatar', [
                        h('img.img-fluid', {'src': '/customize/images/YannFlory.jpg'})
                            ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.cp-profile-det', [
                        h('h3', "Yann Flory"),
                        h('hr'),
                        setHTML(h('div#bioYann'), '<p>In 2015, Yann graduated with an engineering degree from Ecole Centrale de Lille majoring in Data Science. In his studies he worked on a project to detect defects in optical fiber using image processing technology.<br/>Upon joining XWiki SAS, Yann developed a Wiki page recommendation system, a common API for accessing data server-side and client-side, and an integrated development environment for development of XWiki applications.<br/>Yann is soft spoken but brutally efficient, he is known to say "It will take 5 minutes".</p>'),
                        h('a.cp-soc-media', { href : 'https://github.com/yflory/'}, [
                                h('i.fa.fa-github')
                            ])
                    ]),
                ]),
                h('div.row', [
                    h('div.cp-develop-about.col-12.cp-contrib',[
                            h('div.cp-icon-cent'),
                            h('h2.text-center', 'Key Contributors')
                        ]),
                    ]),
                h('div.row.align-items-center', [
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.cp-bio-avatar', [
                        h('img.img-fluid', {'src': '/customize/images/Pierre-new.jpg'})
                            ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.cp-profile-det', [
                        h('h3', "Pierre Bondoerffer"),
                        h('hr'),
                        setHTML(h('div#bioPierre'), '<p>Resident CSS wizard and emoji extraordinaire, Pierre is passionate about anything related to technology. He loves to hack around computers and put parts together.<br/>He is currently studying at 42, where he learns about algorithms, networking, kernel programming and graphics.<br/>As a part of an internship, he joined XWiki SAS and worked on CryptPad to improve user experience. He also maintains the Spanish translation.</p>'),
                        h('a.cp-soc-media', { href : 'https://twitter.com/pbondoer'}, [
                                h('i.fa.fa-twitter')
                            ]),
                        h('a.cp-soc-media', { href : 'https://github.com/pbondoer'}, [
                                h('i.fa.fa-github')
                            ])
                    ]),
                ]),
                h('div.row.align-items-center',[
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.push-lg-6.cp-bio-avatar.cp-bio-avatar-right', [
                            h('img.img-fluid', {'src': '/customize/images/Catalin.jpg'})
                    ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.pull-lg-6.cp-profile-det',[
                        h('h3', "Catalin Scripcariu"),
                        h('hr'),
                        setHTML(h('div#bioCatalin'), '<p> Catalin is a Maths majour and has worked in B2B sales for 12 years. Design was always his passion and 3 years ago he started to dedicate himself to web design and front-end.<br/>At the beginning of 2017 he joined the XWiki, where he worked both on the business and the community side of XWiki, including the research team and CryptPad. </p>'),
                        h('a.cp-soc-media', { href : 'https://twitter.com/catalinscr'}, [
                                h('i.fa.fa-twitter')
                            ]),
                        h('a.cp-soc-media', { href : 'https://www.linkedin.com/in/catalinscripcariu/'}, [
                                h('i.fa.fa-linkedin')
                            ])
                    ]),
                ]),
                h('div.row.align-items-center.cp-margin-bot', [
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.cp-bio-avatar', [
                        h('img.img-fluid', {'src': '/customize/images/LudovicDuboist.jpg'})
                            ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.cp-profile-det', [
                        h('h3', "Ludovic Dubost"),
                        h('hr'),
                        setHTML(h('div#bioLudovic'), '<p>A graduate of PolyTech (X90) and Telecom School in Paris, Ludovic Dubost started his career as a software architect for Netscape Communications Europe. He then became CTO of NetValue, one of the first French start-ups that went public. He left NetValue after the company was purchased by Nielsen/NetRatings and in 2004 launched XWiki, the next generation wiki.<br/>Since the very beginning, Ludovic has been immensely helpful to the CryptPad project. He believed in the idea when there was nothing more than the collaborative pad and his help with sales strategy for the project.</p>'),
                        h('a.cp-soc-media', { href : 'https://twitter.com/ldubost'}, [
                                h('i.fa.fa-twitter')
                            ]),
                        h('a.cp-soc-media', { href : 'https://github.com/ldubost'}, [
                                h('i.fa.fa-github')
                            ])
                    ]),
                ]),
            ]),
            infopageFooter()
        ]);
    };

    Pages['/features.html'] = function () {
        return h('div#cp-main', [
            infopageTopbar(),
            h('div.container.cp-container', [
                h('center', h('h1', Msg.features_title)),
                h('table#cp-features-table', [
                    h('thead', h('tr', [
                        h('th', Msg.features_feature),
                        h('th', Msg.features_anon),
                        h('th', Msg.features_registered),
                        h('th', Msg.features_notes)
                    ])),
                    h('tbody', [
                        h('tr', [
                            h('td', Msg.features_f_pad),
                            h('td.yes', '✔'),// u2714, u2715
                            h('td.yes', '✔'),
                            h('td', Msg.features_f_pad_notes)
                        ]),
                        h('tr', [
                            h('td', Msg.features_f_history),
                            h('td.yes', '✔'),
                            h('td.yes', '✔'),
                            h('td', Msg.features_f_history_notes)
                        ]),
                        h('tr', [
                            h('td', Msg.features_f_export),
                            h('td.yes', '✔'),
                            h('td.yes', '✔'),
                            h('td', Msg.features_f_export_notes)
                        ]),
                        h('tr', [
                            h('td', Msg.features_f_todo),
                            h('td.yes', '✔'),
                            h('td.yes', '✔'),
                            h('td')
                        ]),
                        h('tr', [
                            h('td', Msg.features_f_viewFiles),
                            h('td.yes', '✔'),
                            h('td.yes', '✔'),
                            h('td')
                        ]),
                        h('tr', [
                            h('td', Msg.features_f_drive),
                            h('td.part', '~'),
                            h('td.yes', '✔'),
                            h('td', Msg.features_f_drive_notes)
                        ]),
                        h('tr', [
                            h('td', Msg.features_f_uploadFiles),
                            h('td.no', '✕'),
                            h('td.yes', '✔'),
                            h('td')
                        ]),
                        h('tr', [
                            h('td', Msg.features_f_embedFiles),
                            h('td.no', '✕'),
                            h('td.yes', '✔'),
                            h('td')
                        ]),
                        h('tr', [
                            h('td', Msg.features_f_multiple),
                            h('td.no', '✕'),
                            h('td.yes', '✔'),
                            h('td', Msg.features_f_multiple_notes)
                        ]),
                        h('tr', [
                            h('td', Msg.features_f_logoutEverywhere),
                            h('td.no', '✕'),
                            h('td.yes', '✔'),
                            h('td', Msg.features_f_logoutEverywhere_notes || '')
                        ]),
                        h('tr', [
                            h('td', Msg.features_f_templates),
                            h('td.no', '✕'),
                            h('td.yes', '✔'),
                            h('td', Msg.features_f_templates_notes)
                        ]),
                        h('tr', [
                            h('td', Msg.features_f_profile),
                            h('td.no', '✕'),
                            h('td.yes', '✔'),
                            h('td', Msg.features_f_profile_notes)
                        ]),
                        h('tr', [
                            h('td', Msg.features_f_tags),
                            h('td.no', '✕'),
                            h('td.yes', '✔'),
                            h('td', Msg.features_f_tags_notes)
                        ]),
                        h('tr', [
                            h('td', Msg.features_f_contacts),
                            h('td.no', '✕'),
                            h('td.yes', '✔'),
                            h('td', Msg.features_f_contacts_notes)
                        ]),
                        h('tr', [
                            h('td', Msg.features_f_storage),
                            h('td.no', Msg.features_f_storage_anon),
                            setHTML(h('td.yes.left'), Msg.features_f_storage_registered),
                            h('td')
                        ]),
                    ])
                ]),
                h('div#cp-features-register', [
                    h('a', {
                        href: '/register/'
                    }, h('button.cp-features-register-button', 'Register for free'))
                ])
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
            h('div.container-fluid.cp-contdet', [
                h('row.col-12.col-sm-12',
                    h('h1.text-center', Msg.contact )
                )
            ]),
            h('div.container.cp-container', [
                h('div.row.cp-iconCont.align-items-center', [
                    h('div.col-12',
                        setHTML(h('h4.text-center'), Msg.main_about_p26)
                    ),
                    h('div.col-6.col-sm-3.col-md-3.col-lg-3',
                        h('a.card', {href : "https://twitter.com/cryptpad"}, 
                            h('div.card-body', 
                                setHTML(h('p'), Msg.main_about_p22)
                            )
                        )
                    ),
                    h('div.col-6.col-sm-3.col-md-3.col-lg-3',
                        h('a.card', {href : "https://github.com/xwiki-labs/cryptpad/issues/"},
                            h('div.card-body', 
                                setHTML(h('p'), Msg.main_about_p23)
                            )
                        )
                    ),
                    h('div.col-6.col-sm-3.col-md-3.col-lg-3',
                        h('a.card', {href : "https://riot.im/app/#/room/#cryptpad:matrix.org"},
                            h('div.card-body', 
                                setHTML(h('p'), Msg.main_about_p24)
                            )
                        )
                    ),
                    h('div.col-6.col-sm-3.col-md-3.col-lg-3',
                        h('a.card', {href : "mailto:research@xwiki.com"},
                            h('div.card-body', 
                                setHTML(h('p'), Msg.main_about_p25)
                            )
                        )
                    ),
                ]),
            ]),
            infopageFooter(),
        ]);
    };

    Pages['/what-is-cryptpad.html'] = function () {
        return h('div#cp-main', [
            infopageTopbar(),
            h('div.container-fluid.cp-what-is',[
                h('div.container',[
                    h('div.row',[
                        h('div.col-12.text-center', h('h1', Msg.whatis_title)),
                    ]),
                ]),
            ]),
            h('div.container.cp-container', [
                h('div.row.align-items-center', [
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6', [
                        setHTML(h('h2'), Msg.whatis_collaboration),
                        setHTML(h('p'), Msg.whatis_collaboration_p1),
                        setHTML(h('p'), Msg.whatis_collaboration_p2),
                        setHTML(h('p'), Msg.whatis_collaboration_p3),
                    ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6', [
                        h('img', { src: '/customize/images/pad_screenshot.png?' + urlArgs }),
                    ]),
                ]),
                h('div.row.align-items-center', [
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.push-lg-6', [
                        setHTML(h('h2'), Msg.whatis_zeroknowledge),
                        setHTML(h('p'), Msg.whatis_zeroknowledge_p1),
                        setHTML(h('p'), Msg.whatis_zeroknowledge_p2),
                        setHTML(h('p'), Msg.whatis_zeroknowledge_p3),
                    ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6.pull-lg-6', [
                        h('img#zeroknowledge', { src: '/customize/images/zeroknowledge_small.png?' + urlArgs }),
                    ]),
                ]),
                h('div.row.align-items-center', [
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6', [
                        setHTML(h('h2'), Msg.whatis_drive),
                        setHTML(h('p'), Msg.whatis_drive_p1),
                        setHTML(h('p'), Msg.whatis_drive_p2),
                        setHTML(h('p'), Msg.whatis_drive_p3),
                    ]),
                    h('div.col-12.col-sm-12.col-md-12.col-lg-6', [
                        h('img', { src: '/customize/images/drive_screenshot.png?' + urlArgs }),
                    ]),
                ]),
                h('div.row.align-items-center', [
                    h('div.col-12', [
                        setHTML(h('h2.text-center'), Msg.whatis_business),
                        setHTML(h('p'), Msg.whatis_business_p1),
                        setHTML(h('p'), Msg.whatis_business_p2),
                    ]),
                ]),
            ]),
            infopageFooter(),
        ]);
    };

    var isAvailableType = function (x) {
        if (!Array.isArray(AppConfig.availablePadTypes)) { return true; }
        return AppConfig.availablePadTypes.some(function (type) {
            return x.indexOf(type) > -1;
        });
    };

    Pages['/'] = Pages['/index.html'] = function () {
        var showingMore = false;

        var icons = [
                [ 'pad', '/pad/', Msg.main_richTextPad, 'fa-file-word-o' ],
                [ 'code', '/code/', Msg.main_codePad, 'fa-file-code-o' ],
                [ 'slide', '/slide/', Msg.main_slidePad, 'fa-file-powerpoint-o' ],
                [ 'poll', '/poll/', Msg.main_pollPad, 'fa-calendar' ],
                [ 'whiteboard', '/whiteboard/', Msg.main_whiteboardPad, 'fa-paint-brush' ],
                [ 'recent', '/drive/', Msg.main_localPads, 'fa-hdd-o' ]
            ].filter(function (x) {
                return isAvailableType(x[1]);
            })
            .map(function (x, i) {
                var s = 'div.bs-callout.cp-callout-' + x[0];
                if (i > 2) { s += '.cp-more.cp-hidden'; }
                return h('a', [
                    { href: x[1] },
                    h(s, [
                        h('i.fa.' + x[3]),
                        h('div.pad-button-text', [ h('h4', x[2]) ])
                    ])
                ]);
            });

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
            ]);

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
                            icons,
                            more
                        ])
                    ])
                ]),
            ]),
        ];
    };

    var loadingScreen = Pages.loadingScreen = function () {
        return h('div#cp-loading', 
            h('div.cp-loading-container', [
                h('img.cp-loading-cryptofist', {
                    src: '/customize/cryptpad-new-logo-colors-logoonly.png?' + urlArgs
                }),
                h('div.cp-loading-spinner-container',
                    h('span.fa.fa-circle-o-notch.fa-spin.fa-4x.fa-fw')),
                h('p'),
            ])
        );
    };

    var hiddenLoader = function () {
        var loader = loadingScreen();
        loader.style.display = 'none';
        return loader;
    };

    Pages['/user/'] = Pages['/user/index.html'] = function () {
        return h('div#container');
    };

    Pages['/register/'] = Pages['/register/index.html'] = function () {
        return [h('div#cp-main', [
            infopageTopbar(),
            h('div.container-fluid.cp-register-wel',[
                h('div.container',[
                    h('div.row',[
                        h('div.col-12',[
                            h('h1.text-center', Msg.register_header)
                        ])
                    ])
                ])
            ]),
            h('div.container.cp-container', [
                h('div.row.cp-register-det', [
                h('div#data.hidden.col-md-6', [
                    setHTML(h('p.register-explanation'), Msg.register_explanation)
                ]),
                h('div#userForm.form-group.hidden.col-md-6', [
                    h('a', {
                        href: '/features.html'
                    }, Msg.register_whyRegister),
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
                    h('button#register.btn.cp-login-register', Msg.login_register)
                ])
                ]),
                h('div.row.cp-register-test',[
                    h('hr'),
                    h('div.col-12', [
                        setHTML(h('p.test-details'), " \"Tools like Etherpad and Google Docs [...] all share a weakness, which is that whomever owns the document server can see everything you're typing. Cryptpad is a free/open project that uses some of the ideas behind blockchain to implement a \"zero-knowledge\" version of a collaborative document editor, ensuring that only the people working on a document can see it.\" "),
                        h('a.cp-test-source.pull-right', { href : 'http://boingboing.net/2016/09/26/cryptpad-a-freeopen-end-to.html'}, "Cory Doctorow")
                    ])
                ])
            ]),

            infopageFooter(),
            hiddenLoader(),
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
                        h('div.extra', [
                            h('button.login.first.btn', Msg.login_login)
                        ])
                    ])
                ]),
            ]),
            infopageFooter(),
            hiddenLoader(),
        ])];
    };

    var appToolbar = function () {
        return h('div#cp-toolbar.cp-toolbar-container');
    };

    Pages['/whiteboard/'] = Pages['/whiteboard/index.html'] = function () {
        return [
            appToolbar(),
            h('div#cp-app-whiteboard-canvas-area', h('canvas#cp-app-whiteboard-canvas', {
                width: 600,
                height: 600
            })),
            h('div#cp-app-whiteboard-controls', {
                style: {
                    display: 'block',
                }
            }, [
                h('button#cp-app-whiteboard-clear.btn.btn-danger', Msg.canvas_clear), ' ',
                h('button#cp-app-whiteboard-toggledraw.btn.btn-secondary', Msg.canvas_disable),
                h('button#cp-app-whiteboard-delete.btn.btn-secondary', {
                    style: {
                        display: 'none',
                    }
                }, Msg.canvas_delete),
                h('div.cp-app-whiteboard-range-group', [
                    h('label', {
                        'for': 'cp-app-whiteboard-width'
                    }, Msg.canvas_width),
                    h('input#cp-app-whiteboard-width', {
                        type: 'range',
                        min: "1",
                        max: "100"
                    }),
                    h('span#cp-app-whiteboard-width-val', '5px')
                ]),
                h('div.cp-app-whiteboard-range-group', [
                    h('label', {
                        'for': 'cp-app-whiteboard-opacity',
                    }, Msg.canvas_opacity),
                    h('input#cp-app-whiteboard-opacity', {
                        type: 'range',
                        min: "0.1",
                        max: "1",
                        step: "0.1"
                    }),
                    h('span#cp-app-whiteboard-opacity-val', '100%')
                ]),
                h('span.cp-app-whiteboard-selected.cp-app-whiteboard-unselectable', [
                    h('img', {
                        title: Msg.canvas_currentBrush
                    })
                ])
            ]),
            setHTML(h('div#cp-app-whiteboard-colors'), '&nbsp;'),
            h('div#cp-app-whiteboard-cursors', {
                style: {
                    display: 'none',
                    background: 'white',
                    'text-align': 'center',
                }
            }),
            h('div#cp-app-whiteboard-pickers'),
            h('div#cp-app-whiteboard-media-hidden')
        ];
    };

    Pages['/poll/'] = Pages['/poll/index.html'] = function () {
        return [
            appToolbar(),
            h('div#cp-app-poll-content', [
                h('div#cp-app-poll-form', [
                    h('div#cp-app-poll-help', [
                        h('h1', 'CryptPoll'),
                        setHTML(h('h2'), Msg.poll_subtitle),
                        h('p', Msg.poll_p_save),
                        h('p', Msg.poll_p_encryption)
                    ]),
                    h('div.cp-app-poll-realtime', [
                        h('br'),
                        h('div', [
                            h('textarea#cp-app-poll-description', {
                                rows: "5",
                                cols: "50",
                                placeholder: Msg.poll_descriptionHint,
                                disabled: true
                            }),
                            h('div#cp-app-poll-description-published'),
                            h('br')
                        ]),
                        h('div#cp-app-poll-table-container', [
                            h('div#cp-app-poll-table-scroll', [h('table')]),
                            h('button#cp-app-poll-create-user.btn.btn-secondary', {
                                title: Msg.poll_create_user
                            }, Msg.poll_commit),
                            h('button#cp-app-poll-create-option.btn.btn-secondary', {
                                title: Msg.poll_create_option
                            }, h('span.fa.fa-plus')),
                        ]),
                        h('div#cp-app-poll-comments', [
                            h('h2#cp-app-poll-comments-add-title', Msg.poll_comment_add),
                            h('div#cp-app-poll-comments-add', [
                                h('input.cp-app-poll-comments-add-name', {
                                    type: 'text',
                                    placeholder: Msg.anonymous
                                }),
                                h('textarea.cp-app-poll-comments-add-msg', {
                                    placeholder: Msg.poll_comment_placeholder
                                }),
                                h('button.cp-app-poll-comments-add-submit.btn.btn-secondary',
                                    Msg.poll_comment_submit),
                                h('button.cp-app-poll-comments-add-cancel.btn.btn-secondary',
                                    Msg.cancel)
                            ]),
                            h('h2#cp-app-poll-comments-list-title', Msg.poll_comment_list),
                            h('div#cp-app-poll-comments-list')
                        ]),
                        h('div#cp-app-poll-nocomments', Msg.poll_comment_disabled)
                    ])
                ])
            ])
        ];
    };

    return Pages;
});
