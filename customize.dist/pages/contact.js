define([
    '/api/config',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/pages.js',
    '/common/outer/local-store.js'
], function (Config, h, Msg, Pages, LocalStore) {

    return function () {
        document.title = Msg.contact;
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
                        h('h2.text-center', Msg._getKey('contact_admin', [ Pages.Instance.name ])),
                        h('p.center', Msg.contact_adminHint)
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
                        h('p.center', Msg.contact_devHint)
                    ),
                    h('div',
                        h('a.card-small', {href : "https://matrix.to/#/#cryptpad:matrix.xwiki.com"},
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
                    h('div',
                        h('a.card-small', {href : "https://fosstodon.org/@cryptpad"},
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
                    h('div',
                        h('a.card-small', {href : "https://twitter.com/cryptpad"},
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
                    h('div',
                        h('a.card-small', {href : "https://github.com/xwiki-labs/cryptpad/issues/"},
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
                    h('div',
                        h('a.card-small', {href : "mailto:" + developerEmail},
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

