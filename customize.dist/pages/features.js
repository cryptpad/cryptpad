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
    '/common/common-icons.js',
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

        var featureCard = function (feature) {
            return h('div.cp-card-item', [
                h('div.cp-feature-card', [
                    h('div.title-card', [
                        h('h3', feature.title)
                    ]),
                    h('div.feature-card-section.cp-feature-icon', [
                        h('div', Icons.get(feature.icon))
                    ]),
                    h('div.feature-title', feature.subtitle),
                    h('div.feature-content', feature.content),
                    h('div.feature-card-section', [
                        h('div.cp-features-docs', [
                            h('a.cp-features-docs-button', {
                                href: feature.href || 'https://docs.cryptpad.org/',
                                target: '_blank',
                                rel: 'noopener noreferrer'
                            }, Icons.get('documentation'), 'Learn more')
                        ])
                    ])
                ])
            ]);
        };

        var infoCard = function (info) {
            return h('div.cp-card-item.cp-small-feature', [
                h('div.cp-feature-small-card', [
                    h('div.feature-icon', Icons.get(info.icon)),
                    h('div.feature-title', info.title),
                    h('div.feature-content', info.content)
                ])
            ]);
        };

        var trySection = function () {
            return h('div.cp-container.cp-features-web', [
                h('div.cp-features-try', [
                    h('div.cp-features-try-text', [
                        h('h2.cp-features-try-title', Msg.features_try_title),
                        h('p.cp-features-try-subtitle', Msg.features_try_subtitle),
                        h('p.cp-features-try-content', Msg.features_try_content)
                    ]),
                    h('div.cp-features-docs', [
                        h('a.cp-features-docs-button', {
                            href: '/drive/'
                        }, Msg.features_try_button)
                    ])
                ])
            ]);
        };

        var docsApps = 'https://docs.cryptpad.org/en/user_guide/apps/';

        var featureList = [
            {
                title: Msg.type.code,
                icon: 'code',
                subtitle: Msg.features_code_subtitle,
                content: Msg.features_code_content,
                href: docsApps + 'code.html'
            },
            {
                title: Msg.type.diagram,
                icon: 'diagram',
                subtitle: Msg.features_diagram_subtitle,
                content: Msg.features_diagram_content,
                href: docsApps + 'diagram.html'
            },
            {
                title: Msg.type.form,
                icon: 'form',
                subtitle: Msg.features_forms_subtitle,
                content: Msg.features_forms_content,
                href: docsApps + 'form.html'
            },
            {
                title: Msg.type.kanban,
                icon: 'kanban',
                subtitle: Msg.features_kanban_subtitle,
                content: Msg.features_kanban_content,
                href: docsApps + 'kanban.html'
            },
            {
                title: Msg.type.presentation,
                icon: 'presentation',
                subtitle: Msg.features_presentation_subtitle,
                content: Msg.features_presentation_content,
                href: docsApps + 'presentation.html'
            },
            {
                title: Msg.type.sheet,
                icon: 'sheet',
                subtitle: Msg.features_sheet_subtitle,
                content: Msg.features_sheet_content,
                href: docsApps + 'sheets.html'
            },
            {
                title: Msg.type.doc,
                icon: 'doc',
                subtitle: Msg.features_doc_subtitle,
                content: Msg.features_doc_content,
                href: docsApps + 'document.html'
            },
            {
                title: Msg.type.slide,
                icon: 'slide',
                subtitle: Msg.features_slide_subtitle,
                content: Msg.features_slide_content,
                href: docsApps + 'slides.html'
            },
            {
                title: Msg.type.pad,
                icon: 'pad',
                subtitle: Msg.features_pad_subtitle,
                content: Msg.features_pad_content,
                href: docsApps + 'richtext.html'
            }
        ];

        var infoList = [
            {
                icon: 'lock',
                title: Msg.features_info_private_title,
                content: Msg.features_info_private_content
            },
            {
                icon: 'teams',
                title: Msg.features_info_collab_title,
                content: Msg.features_info_collab_content
            },
            {
                icon: 'folder',
                title: Msg.features_info_workspace_title,
                content: Msg.features_info_workspace_content
            },
            {
                icon: 'limit',
                title: Msg.features_info_control_title,
                content: Msg.features_info_control_content
            }
        ];

        var bottomInfoList = [
            {
                icon: 'drive',
                title: Msg.type.drive,
                content: Msg.features_info_drive_content
            },
            {
                icon: 'teams',
                title: Msg.type.teams,
                content: Msg.features_info_teams_content
            },
            {
                icon: 'calendar',
                title: Msg.calendar,
                content: Msg.features_info_calendar_content
            },
            {
                icon: 'contacts',
                title: Msg.type.contacts,
                content: Msg.features_info_contacts_content
            }
        ];

        var availableFeatures = featureList.map(featureCard);
        var info = infoList.map(infoCard);
        var bottomInfo = bottomInfoList.map(infoCard);

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
            h('div.cp-container',[
                h('div.cp-page-title',[
                    h('h1', "One private workspace. Everything connected.")
                ]),
                h('div.cp-container.cp-features-web', h('div.info-cards-container', info)),
                h('div.cp-container.cp-features-web', h('div.features-grid-container', availableFeatures)),
                h('div.cp-page-title', [
                    h('h2', Msg.features_teamwork_title)
                ]),
                h('div.cp-container.cp-features-web', h('div.info-cards-container', bottomInfo)),
                trySection()
            ]),
            Pages.infopageFooter()
        ]);
    };
});

