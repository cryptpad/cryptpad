define([
    'jquery',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/common/outer/local-store.js',
    '/customize/pages.js'
], function ($, h, Msg, AppConfig, LocalStore, Pages) {
    var origin = encodeURIComponent(window.location.hostname);
    var accounts = {
        donateURL: 'https://accounts.cryptpad.fr/#/donate?on=' + origin,
        upgradeURL: 'https://accounts.cryptpad.fr/#/?on=' + origin,
    };
    return function () {
        Msg.features_f_apps_note = AppConfig.availablePadTypes.map(function (app) {
            if (AppConfig.registeredOnlyTypes.indexOf(app) !== -1) { return; }
            return Msg.type[app];
        }).filter(function (x) { return x; }).join(', ');
        var premiumButton = h('a', {
            href: accounts.upgradeURL,
            target: '_blank',
            rel: 'noopener noreferrer'
        }, h('button.cp-features-register-button', Msg.features_f_subscribe));
        /*$(premiumButton).click(function (e) {
            if (LocalStore.isLoggedIn()) { return; }
            // Not logged in: go to /login with a redirect to this page
            e.preventDefault();
            e.stopPropagation();
            sessionStorage.redirectTo = '/features.html';
            window.location.href = '/login/';
        });*/
        return h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.container-fluid.cp_cont_features',[
                h('div.container',[
                    h('center', h('h1', Msg.features_title)),
                ]),
            ]),
            h('div.container',[
                h('div.row.cp-container.cp-features-web.justify-content-sm-center',[
                    h('div.col-12.col-sm-4.cp-anon-user',[
                        h('div.card',[
                            h('div.card-body',[
                                h('h3.text-center',Msg.features_anon)
                            ]),
                            h('div.card-body.cp-pricing',[
                                h('div.text-center', '0€'),
                                h('div.text-center', Msg.features_noData),
                            ]),
                            h('ul.list-group.list-group-flush',
                                ['apps', 'core', 'file0', 'cryptdrive0', 'storage0'].map(function (f) {
                                    return h('li.list-group-item', [
                                        h('div.cp-check'),
                                        h('div.cp-content', [
                                            h('div.cp-feature', Msg['features_f_' + f]),
                                            h('div.cp-note', Msg['features_f_' + f + '_note'])
                                        ])
                                    ]);
                                })
                            ),
                        ]),
                    ]),
                    h('div.col-12.col-sm-4.cp-regis-user',[
                        h('div.card',[
                            h('div.card-body',[
                                h('h3.text-center',Msg.features_registered)
                            ]),
                            h('div.card-body.cp-pricing',[
                                h('div.text-center', '0€'),
                                h('div.text-center', Msg.features_noData),
                            ]),
                            h('ul.list-group.list-group-flush', [
                                ['anon', 'social', 'file1', 'cryptdrive1', 'devices', 'storage1'].map(function (f) {
                                    return h('li.list-group-item', [
                                        h('div.cp-check'),
                                        h('div.cp-content', [
                                            h('div.cp-feature', Msg['features_f_' + f]),
                                            h('div.cp-note', Msg['features_f_' + f + '_note'])
                                        ])
                                    ]);
                                }),
                            ]),
                            h('div.card-body',[
                                h('div.cp-features-register#cp-features-register', [
                                    h('a', {
                                        href: '/register/'
                                    }, h('button.cp-features-register-button', Msg.features_f_register))
                                ]),
                                h('div.cp-note', Msg.features_f_register_note)
                            ]),
                        ]),
                    ]),
                    h('div.col-12.col-sm-4.cp-anon-user',[
                        h('div.card',[
                            h('div.card-body',[
                                h('h3.text-center',Msg.features_premium)
                            ]),
                            h('div.card-body.cp-pricing',[
                                h('div.text-center', h('a', {
                                    href: accounts.upgradeURL,
                                    target: '_blank'
                                }, Msg._getKey('features_pricing', ['5', '10', '15']))),
                                h('div.text-center', Msg.features_emailRequired),
                            ]),
                            h('ul.list-group.list-group-flush', [
                                ['reg', 'storage2', 'support', 'supporter'].map(function (f) {
                                    return h('li.list-group-item', [
                                        h('div.cp-check'),
                                        h('div.cp-content', [
                                            h('div.cp-feature', Msg['features_f_' + f]),
                                            h('div.cp-note', Msg['features_f_' + f + '_note'])
                                        ])
                                    ]);
                                }),
                            ]),
                            h('div.card-body',[
                                h('div.cp-features-register#cp-features-subscribe', [
                                    premiumButton
                                ]),
                                LocalStore.isLoggedIn() ? undefined : h('div.cp-note', Msg.features_f_subscribe_note)
                            ]),
                        ]),
                    ]),
                ]),
            ]),
            Pages.infopageFooter()
        ]);
    };
});

