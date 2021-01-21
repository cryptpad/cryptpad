define([
    'jquery',
    '/common/hyperscript.js',
    '/common/common-util.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/common/outer/local-store.js',
    '/customize/pages.js',
    '/api/config',
], function ($, h, Util, Msg, AppConfig, LocalStore, Pages, Config) {
    var accounts = {
        donateURL: AppConfig.donateURL || "https://opencollective.com/cryptpad/",
        upgradeURL: AppConfig.upgradeURL
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

        var groupItemTemplate = function (title, content) {
            return h('li.list-group-item', [
                h('div.cp-check'),
                h('div.cp-content', [
                    h('div.cp-feature', title),
                    h('div.cp-note', content),
                ])
            ]);
        };

        var defaultGroupItem = function (key) {
            return groupItemTemplate(
                Msg['features_f_' + key],
                Msg['features_f_' + key + '_note']
            );
        };

        var SPECIAL_GROUP_ITEMS = {};
        SPECIAL_GROUP_ITEMS.storage0 = function (f) {
            return groupItemTemplate(
                Msg['features_f_' + f],
                Msg._getKey('features_f_' + f + '_note', [Config.inactiveTime])
            );
        };
        SPECIAL_GROUP_ITEMS.file1 = function (f) {
            return groupItemTemplate(
                Msg['features_f_' + f],
                Msg._getKey('features_f_' + f + '_note', [Config.maxUploadSize / 1024 / 1024])
            );
        };
        SPECIAL_GROUP_ITEMS.storage1 = function (f) {
            return groupItemTemplate(
                Msg._getKey('features_f_' + f, [Util.getPrettySize(Config.defaultStorageLimit, Msg)]),
                Msg['features_f_' + f + '_note']
            );
        };
        SPECIAL_GROUP_ITEMS.storage2 = function (f) {
            return groupItemTemplate(
                Msg['features_f_' + f],
                Msg._getKey('features_f_' + f + '_note', [Config.premiumUploadSize / 1024 / 1024])
            );
        };

        var groupItem = function (key) {
            return (SPECIAL_GROUP_ITEMS[key] || defaultGroupItem)(key);
        };

        var anonymousFeatures =
            h('div.col-12.col-sm-4.cp-anon-user',[
                h('div.card',[
                    h('div.title-card',[
                        h('h3.text-center',Msg.features_anon)
                    ]),
                    h('div.card-body.cp-pricing',[
                        h('div.text-center', '0€'),
                        h('div.text-center', Msg.features_noData),
                    ]),
                    h('ul.list-group.list-group-flush', ['apps', 'file0', 'core', 'cryptdrive0', 'storage0'].map(groupItem)),
                ]),
            ]);

        var registeredFeatures =
            h('div.col-12.col-sm-4.cp-regis-user',[
                h('div.card',[
                    h('div.title-card',[
                        h('h3.text-center',Msg.features_registered)
                    ]),
                    h('div.card-body.cp-pricing',[
                        h('div.text-center', '0€'),
                        h('div.text-center', Msg.features_noData),
                    ]),
                    h('ul.list-group.list-group-flush', ['anon', 'social', 'file1', 'cryptdrive1', 'devices', 'storage1'].map(groupItem)),
                    h('div.card-body',[
                        h('div.cp-features-register#cp-features-register', [
                            h('a', {
                                href: '/register/'
                            }, h('button.cp-features-register-button', Msg.features_f_register))
                        ]),
                    ]),
                ]),
            ]);
        var premiumFeatures =
            h('div.col-12.col-sm-4.cp-anon-user',[
                h('div.card',[
                    h('div.title-card',[
                        h('h3.text-center',Msg.features_premium)
                    ]),
                    h('div.card-body.cp-pricing',[
                        h('div.text-center', h('a', {
                            href: accounts.upgradeURL,
                            target: '_blank'
                        }, Msg._getKey('features_pricing', ['5', '10', '15']))),
                        h('div.text-center', Msg.features_emailRequired),
                    ]),
                    h('ul.list-group.list-group-flush', ['reg', 'storage2', 'support', 'supporter'].map(groupItem)),
                    h('div.card-body',[
                        h('div.cp-features-register#cp-features-subscribe', [
                            premiumButton
                        ]),
                        LocalStore.isLoggedIn() ? undefined : h('div.cp-note', Msg.features_f_subscribe_note)
                    ]),
                ]),
            ]);
        var availableFeatures =
            (Config.allowSubscriptions && accounts.upgradeURL) ?
                [anonymousFeatures, registeredFeatures, premiumFeatures] :
                [anonymousFeatures, registeredFeatures];

        return h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.container.cp-container',[
                h('div.row.cp-page-title',[
                    h('div.col-12.text-center', h('h1', Msg.features_title)),
                ]),
                h('div.row.cp-container.cp-features-web.justify-content-sm-center', availableFeatures),
            ]),
            Pages.infopageFooter()
        ]);
    };
});

