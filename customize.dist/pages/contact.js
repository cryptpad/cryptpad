define([
    '/api/config',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/pages.js',
    '/common/outer/local-store.js'
], function (Config, h, Msg, Pages, LocalStore) {

    return function () {
        var developerEmail = "contact@cryptpad.fr";
        var adminEmail = Config.adminEmail && [
            'i.did.not.read.my.config@cryptpad.fr',
            developerEmail
        ].indexOf(Config.adminEmail) === -1;
        var adminMailbox = Config.supportMailbox && LocalStore.isLoggedIn();

        return h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.container.cp-container', [
                h('div.row.cp-page-title',[
                    h('div.col-12.text-center', h('h1', Msg.contact)),
                ]),
                (adminEmail || adminMailbox) ? h('div.row.cp-iconCont.align-items-center', [
                    h('div.col-12',
                        Pages.setHTML(h('h2.text-center'), Msg.contact_admin),
                        h('p', Msg.contact_adminHint)
                    ),
                    adminEmail ? h('div.col-12.col-sm-6.col-md-3.col-lg-3',
                        h('a.card', {href : "mailto:"+Config.adminEmail},
                            h('div.card-body',
                                h('p', [
                                    h('img', {
                                        src: '/customize/images/email.svg',
                                        alt: '',
                                        'aria-hidden': 'true'
                                    }),
                                    Msg.contact_email || 'Email'
                                ])
                            )
                        )
                    ) : undefined,
                    adminMailbox ? h('div.col-12.col-sm-6.col-md-3.col-lg-3',
                        h('a.card', {href : "/support/"},
                            h('div.card-body',
                                h('p', [
                                    h('img', {
                                        src: '/customize/images/support.svg',
                                        alt: '',
                                        'aria-hidden': 'true'
                                    }),
                                    Msg.supportPage || 'Support'
                                ])
                            )
                        )
                    ) : undefined,
                ]) : undefined,
                h('div.row.cp-iconCont.align-items-center', [
                    h('div.col-12',
                        Pages.setHTML(h('h2.text-center'), Msg.contact_dev),
                        h('p', Msg.contact_devHint)
                    ),
                    h('div.col-12.col-sm-6.col-md-3.col-lg-3',
                        h('a.card', {href : "https://twitter.com/cryptpad"},
                            h('div.card-body',
                                h('p', [
                                    // this is not a typo. adblock plus blocks images with src *twitter* apparently
                                    h('img', {
                                        src: '/customize/images/twiitter.svg',
                                        alt: '',
                                        'aria-hidden': 'true'}),
                                    'Twitter'
                                ])
                            )
                        )
                    ),
                    h('div.col-12.col-sm-6.col-md-3.col-lg-3',
                        h('a.card', {href : "https://social.weho.st/@cryptpad"},
                            h('div.card-body',
                                h('p', [
                                    h('img', {
                                        src: '/customize/images/mastodon.svg',
                                        alt: '',
                                        'aria-hidden': 'true'
                                    }),
                                    'Mastodon'
                                ])
                            )
                        )
                    ),
                    h('div.col-12.col-sm-6.col-md-3.col-lg-3',
                        h('a.card', {href : "https://github.com/xwiki-labs/cryptpad/issues/"},
                            h('div.card-body',
                                h('p', [
                                    h('img', {
                                        src: '/customize/images/github.svg',
                                        alt: '',
                                        'aria-hidden': 'true'}),
                                    Msg.contact_bug || 'Bug report'
                                ])
                            )
                        )
                    ),
                    h('div.col-12.col-sm-6.col-md-3.col-lg-3',
                        h('a.card', {href : "https://app.element.io/#/room/#cryptpad:matrix.xwiki.com"},
                            h('div.card-body',
                                h('p', [
                                    h('img', {
                                        src: '/customize/images/sayhi.svg',
                                        alt: '',
                                        'aria-hidden': 'true'
                                    }),
                                    Msg.contact_chat || 'Chat'
                                ])
                            )
                        )
                    ),
                    h('div.col-12.col-sm-6.col-md-3.col-lg-3',
                        h('a.card', {href : "mailto:" + developerEmail},
                            h('div.card-body',
                                h('p', [
                                    h('img', {
                                        src: '/customize/images/email.svg',
                                        alt: '',
                                        'aria-hidden': 'true'
                                    }),
                                    Msg.contact_email || 'Email'
                                ])
                            )
                        )
                    ),
                ]),
            ]),
            Pages.infopageFooter(),
        ]);
    };
});

