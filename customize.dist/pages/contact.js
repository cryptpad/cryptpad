// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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

        let contacts = [
            {
                name: Msg.contact_chat || "Chat",
                image: "/customize/images/sayhi.svg",
                href: "https://matrix.to/#/#cryptpad:matrix.xwiki.com",
            },
            {
                name: Msg.contact_mastodon || "Mastodon",
                image: "/customize/images/mastodon.svg",
                href: "https://social.xwiki.com/@CryptPad",
            },
            {
                name: Msg.contact_bug || "Bug report",
                image: "/customize/images/github.svg",
                href: "https://github.com/cryptpad/cryptpad/issues/",
            },
            {
                name: Msg.contact_forum || "Forum",
                image: "/customize/images/forum.svg",
                href: "https://forum.cryptpad.org/",
            },
            {
                name: Msg.contact_email || "Email",
                image: "/customize/images/email.svg",
                href: 'mailto:' + developerEmail,
            },
        ];

        return h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.container.cp-container', [
                h('div.row.cp-page-title', [
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
                ].concat(contacts.map(item =>
                    h('div',
                        h('a.card-small', { href: item.href },
                            h('div.card-body',
                                h('p', [
                                    h('img', {
                                        src: item.image,
                                        alt: '',
                                        'aria-hidden': 'true'
                                    }),
                                    item.name
                                ])
                            )
                        )
                    )
                ))),
            ]),
            Pages.infopageFooter(),
        ]);
    };
});

