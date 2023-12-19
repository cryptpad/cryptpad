// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/api/config',
    'jquery',
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/customize/messages.js',
    '/customize/pages.js'
], function (Config, $, h, UI, Msg, Pages) {
    return function () {
        document.title = Msg.register_header;
        var tos = $(UI.createCheckbox('accept-terms')).find('.cp-checkmark-label').append(Msg.register_acceptTerms).parent()[0];

        var ssoEnabled = (Config.sso && Config.sso.list && Config.sso.list.length) ?'': '.cp-hidden';
        var ssoEnforced = (Config.sso && Config.sso.force) ? '.cp-hidden' : '';

        var termsLink = Pages.customURLs.terms;
        $(tos).find('a').attr({
            href: termsLink,
            target: '_blank',
            tabindex: '-1',
        });

        var frame = function (content) {
            return [
                h('div#cp-main', [
                    Pages.infopageTopbar(),
                    h('div.container.cp-container', [
                        h('div.row.cp-page-title', h('h1', Msg.register_header)),
                    ].concat(content)),
                    Pages.infopageFooter(),
                ]),
            ];
        };

        var termsCheck;
        if (termsLink) {
            termsCheck = h('div.checkbox-container', tos);
        }

        var closed = Config.restrictRegistration;
        if (closed) {
            $('body').addClass('cp-register-closed');
        }


        return frame([
            h('div.cp-restricted-registration', [
                h('p', Msg.register_registrationIsClosed),
            ]),
            h('div.row.cp-register-det', [
                h('div#data.hidden.col-md-6', [
                    h('h2', Msg.register_notes_title),
                    Pages.setHTML(h('div.cp-register-notes'), Msg.register_notes)
                ]),
                h('div.col-md-3.cp-closed-filler'+ssoEnabled, h('div')),
                h('div.cp-reg-form.col-md-6', [
                    h('div#userForm.form-group'+ssoEnforced, [
                        h('div.cp-register-instance', [
                            Msg._getKey('register_instance', [Pages.Instance.name]),
                            h('br'),
                            h('a', {
                                href: '/features.html'
                            }, Msg.register_whyRegister)
                        ]),
                        h('div.big-container', [
                            h('div.input-container', [
                                h('label.cp-register-label', { for: 'username' }, Msg.login_username),
                                h('input.form-control#username', {
                                    type: 'text',
                                    autocomplete: 'off',
                                    autocorrect: 'off',
                                    autocapitalize: 'off',
                                    spellcheck: false,
                                    placeholder: Msg.login_username,
                                    autofocus: true,
                                }),
                            ]),
                            h('div.input-container', [
                                h('label.cp-register-label', { for: 'password' }, Msg.login_password),
                                h('input.form-control#password', {
                                    type: 'password',
                                    placeholder: Msg.login_password,
                                    autocomplete: "new-password"
                                }),
                            ]),
                            h('div.input-container', [
                                h('label.cp-register-label', { for: 'password-confirm' }, Msg.login_confirm),
                                h('input.form-control#password-confirm', {
                                    type: 'password',
                                    placeholder: Msg.login_confirm,
                                    autocomplete: "new-password"
                                }),
                            ]),
                        ]),
                        h('div.checkbox-container', [
                            UI.createCheckbox('import-recent', Msg.register_importRecent, true)
                        ]),
                        termsCheck,
                        h('button#register', Msg.login_register),
                    ]),
                    h('div#ssoForm.form-group.col-md-6'+ssoEnabled, [
                        h('div.cp-register-sso', Msg.sso_register_description)
                    ]),
                ]),
                h('div.col-md-3.cp-closed-filler'+ssoEnabled),
            ])
        ]);
    };
});
