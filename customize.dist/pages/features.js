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
    '/common/extensions.js',
    '/common/common-icons.js'
], function ($, h, Msg, AppConfig, LocalStore, Pages, Config, UIElements, Constants, PadTypes, Extensions, Icons) {
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
                Icons.get('check'),
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

        var featureCard = function (feature) {
            return h('div.col-12.col-sm-4.cp-regis-user', [
                h('div.card', [
                    h('div.title-card', [
                        h('h3.text-center', feature.title)
                    ]),
                    h('div.card-body.cp-pricing', [
                        h('div', Icons.get(feature.icon))
                    ]),
                    h('div.feature-title', feature.subtitle),
                    h('div.text-center.feature-content', feature.content),
                    h('div.card-body', [
                        h('div.cp-features-register', [
                            h('a.cp-features-register-button', {
                                href: feature.href || '/register/'
                            }, Icons.get('documentation'), 'Learn more')
                        ])
                    ])
                ])
            ]);
        };

        var infoCard = function (info) {
            return h('div.col-12.col-md-6.col-lg-3.cp-regis-user.cp-small-feature', [
                h('div.card', [
                    h('div.feature-icon', Icons.get(info.icon)),
                    h('div.feature-title', info.title),
                    h('div.text-center.feature-content', info.content)
                ])
            ]);
        };

        var featureList = [
            {
                title: 'Code',
                icon: 'code',
                subtitle: 'An encrypted markdown code editor',
                content: 'In addition to the basic lightweight syntax, CryptPad supports diagrams with Mermaid.js, mindmaps with Markmap, and mathematical equations with Mathjax.'
            },
            {
                title: 'Diagram',
                icon: 'diagram',
                subtitle: 'Versatile diagramming options',
                content: 'CryptPad Diagram is the collaboration diagram tool for secure mind-mapping, flowcharts, whiteboard, and more.'
            },
            {
                title: 'Forms',
                icon: 'form',
                subtitle: 'Customizable and responsive design',
                content: 'The privacy-first Google Forms alternative to create and share surveys, without sharing your data with unwanted third-parties.'
            },
            {
                title: 'Kanban',
                icon: 'kanban',
                subtitle: 'Drag-and-drop interface',
                content: 'A secure and customizable kanban board app for organizing tasks, ideas, and workflows, all end-to-end encrypted and hosted in EU.'
            },
            {
                title: 'Presentation',
                icon: 'presentation',
                subtitle: 'Presentations made with familiar tools',
                content: "Format slides with text, images, shapes, and transitions. This presentation editor gives you the functionality you'd expect, without the surveillance."
            },
            {
                title: 'Sheet',
                icon: 'sheet',
                subtitle: 'Flexible file support',
                content: "Import .xlsx, .ods, or .csv. Export .xlsx, .pdf, or .html. Sheets delivers the same experience as popular spreadsheets. If you've used Excel or Google Sheets, CryptPad's interface will feel instantly natural."
            },
            {
                title: 'Word',
                icon: 'doc',
                subtitle: 'Comprehensive editing tools',
                content: 'CryptPad Document is a privacy-first Microsoft Word and Google Docs alternative that allows you to create and collaborate in real time.'
            },
            {
                title: 'Markdown slides',
                icon: 'slide',
                subtitle: 'Code-driven presentations',
                content: 'Create sleek, fast presentations using simple Markdown syntax with instant side-by-side preview.'
            },
            {
                title: 'Richtext',
                icon: 'pad',
                subtitle: 'Quick and collaborative text editing',
                content: 'A lightweight and straightforward rich-text pad for quick notes, documentation, and real-time collaborative writing.'
            }
        ];

        var infoList = [
            {
                icon: 'lock',
                title: 'Private by design',
                content: 'Work in a suite designed for privacy-first collaboration.'
            },
            {
                icon: 'teams',
                title: 'Real-time collaboration',
                content: 'Keep the team in the same document, board or plan.'
            },
            {
                icon: 'folder',
                title: 'One connected workspace',
                content: 'Move naturally between creation, planning and storage.'
            },
            {
                icon: 'limit',
                title: 'Fine-grained control',
                content: 'Choose who can access, view and contribute to your work.'
            }
        ];

        var availableFeatures = featureList.map(featureCard);
        var info = infoList.map(infoCard);

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
                    h('div.col-12.text-center', h('h1', "One private workspace. Everything connected.")),
                ]),
                h('div.row.cp-container.cp-features-web.justify-content-sm-center', info),
                h('div.row.cp-container.cp-features-web.justify-content-sm-center', availableFeatures),
            ]),
            Pages.infopageFooter()
        ]);
    };
});

