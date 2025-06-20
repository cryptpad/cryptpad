// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/common/outer/local-store.js',
    '/customize/pages.js',
    '/api/config',
    '/common/common-ui-elements.js',
    '/common/common-constants.js',
    '/common/pad-types.js',
    '/common/extensions.js'
], function ($, h, Msg, AppConfig, LocalStore, Pages, Config, UIElements, Constants, PadTypes, Extensions) {
    var accounts = Pages.accounts;

    return function () {
        document.title = Msg.features;
        Msg.features_f_apps_note = PadTypes.availableTypes.map(function (app) {
            if (AppConfig.registeredOnlyTypes.indexOf(app) !== -1) { return; }
            if (AppConfig.premiumTypes && AppConfig.premiumTypes.includes(app)) { return; }
            if (Constants.earlyAccessApps && Constants.earlyAccessApps.includes(app) &&
                  AppConfig.enableEarlyAccess) { return; }
            return Msg.type[app];
        }).filter(function (x) { return x; }).join(', ');

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
                Msg['features_f_' + f], // .features_f_storage0
                Msg._getKey('features_f_' + f + '_note', [Config.inactiveTime]) // .features_f_storage0_note
            );
        };
        SPECIAL_GROUP_ITEMS.file1 = function (f) {
            return groupItemTemplate(
                Msg['features_f_' + f], // .features_f_file1
                Msg._getKey('features_f_' + f + '_note', [Config.maxUploadSize / 1024 / 1024]) // .features_f_file1_note
            );
        };
        SPECIAL_GROUP_ITEMS.storage1 = function (f) {
            return groupItemTemplate(
                Msg._getKey('features_f_' + f, [UIElements.prettySize(Config.defaultStorageLimit)]), // .features_f_storage1
                Msg['features_f_' + f + '_note'] // .features_f_storage1_note
            );
        };
        SPECIAL_GROUP_ITEMS.storage2 = function (f) {
            return groupItemTemplate(
                Msg['features_f_' + f], // .features_f_storage2
                Msg._getKey('features_f_' + f + '_note', [Config.premiumUploadSize / 1024 / 1024]) // .features_f_storage2_note
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
                    h('ul.list-group.list-group-flush', [
                        'apps',
                        'file0', // Msg.features_f_file0, .features_f_file0_note
                        'core', // Msg.features_f_core, Msg.features_f_core_note
                        'cryptdrive0', // Msg.features_f_cryptdrive0, .features_f_cryptdrive0_note
                        'storage0'
                    ].map(groupItem)),
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
                    h('ul.list-group.list-group-flush', [
                        'anon', // Msg.features_f_anon, .features_f_anon_note
                        'social', // Msg.features_f_social, .features_f_social_note
                        'file1',
                        'cryptdrive1', // Msg.features_f_cryptdrive1, .features_f_cryptdrive1_note
                        'devices', // Msg.features_f_devices, .features_f_devices_note
                        'storage1' // Msg.features_f_storage1, .features_f_storage1_note
                    ].map(groupItem)),
                    h('div.card-body',[
                        h('div.cp-features-register#cp-features-register', [
                            h('a', {
                                href: '/register/',
                                class: 'cp-features-register-button',
                            }, Msg.features_f_register)
                        ]),
                    ]),
                ]),
            ]);

        var availableFeatures = [
            anonymousFeatures,
            registeredFeatures,
        ];

        // Msg.features_premium
        // Msg.features_pricing
        // Msg.features_emailRequired
        // Msg.features_f_subscribe, .features_f_subscribe_note
        // Msg.features_f_reg, .features_f_reg_note
        // Msg.features_f_support, .features_f_support_note
        // Msg.features_f_supporter, .features_f_supporter_note
        Extensions.getExtensionsSync('EXTRA_PRICING').forEach(ext => {
            if (!ext.getContent) { return; }
            availableFeatures.push(ext.getContent(groupItem));
        });

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

