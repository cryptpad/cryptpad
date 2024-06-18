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
        document.title = Msg.recovery_header;
        var frame = function (content) {
            return [
                h('div#cp-main', [
                    Pages.infopageTopbar(),
                    h('div.container.cp-container', [
                        h('div.row.cp-page-title', h('h1', Msg.recovery_header)),
                    ].concat(content)),
                    Pages.infopageFooter(),
                ]),
            ];
        };
        return frame([
            h('div.row.cp-recovery-det', [
                h('div.hidden.col-md-3'),
                h('div#userForm.form-group.hidden.col-md-6', [
                    h('div.cp-recovery-step.step1', [
                        h('p', Msg.recovery_mfa_description),
                        h('div.alert.alert-danger.wrong-cred.cp-hidden', Msg.login_noSuchUser),
                        h('div.big-container', [
                            h('div.input-container', [
                                h('label.cp-default-label', {for: 'username'}, Msg.login_username),
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
                                h('label.cp-default-label', {for: 'password'}, Msg.login_password),
                                h('input.form-control#password', {
                                    type: 'password',
                                    placeholder: Msg.login_password,
                                }),
                            ]),
                        ]),
                        h('div.cp-recover-button',
                            h('button.btn.btn-primary#cp-recover-login', Msg.continue)
                        )
                    ]),
                    h('div.cp-recovery-step.step2', {style: 'display: none;'}, [
                        h('label', Msg.recovery_mfa_secret),
                        h('input.form-control#mfarecovery', {
                            type: 'text',
                            autocomplete: 'off',
                            autocorrect: 'off',
                            autocapitalize: 'off',
                            spellcheck: false,
                            placeholder: Msg.recovery_mfa_secret_ph,
                            autofocus: true,
                        }),
                        h('div.cp-recovery-forgot', [
                            h('i.fa.fa-caret-right'),
                            h('span', Msg.recovery_forgot)
                        ]),
                        h('div.cp-recovery-alt', {style: 'display: none;'}, [
                            UI.setHTML(h('div'),
                                Msg._getKey('recovery_forgot_text', [Config.adminEmail || ''])),
                            h('textarea.cp-recover-email', {readonly: 'readonly'}),
                            h('button.btn.btn-secondary#mfacopyproof', Msg.copyToClipboard),
                        ]),
                        h('div.cp-recover-button',
                            h('button.btn.btn-primary#cp-recover', Msg.mfa_disable)
                        )
                    ]),
                    h('div.cp-recovery-step.step-info', {style: 'display: none;'}, [
                        h('div.cp-hidden.disabled', Msg.recovery_mfa_disabled),
                        h('div.alert.alert-danger.cp-hidden.unknown-error', Msg.recovery_mfa_error),
                    ]),
                ]),
                h('div.hidden.col-md-3'),
            ])
        ]);
    };

});

