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

        return h('div#cp-main', [
            Pages.infopageTopbar(),
            h('div.cp-container',[
                h('div.cp-page-title',[
                    h('h1', Msg.features_page_title)
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

