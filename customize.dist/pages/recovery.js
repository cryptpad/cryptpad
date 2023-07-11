define([
    '/api/config',
    'jquery',
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/customize/messages.js',
    '/customize/pages.js'
], function (Config, $, h, UI, Msg, Pages) {

Msg.recovery_header = "Account recovery"; // XXX
Msg.recovery_mfa_description = "If you have lost access to your Two-Factor Authentication method you can disable 2FA for your account using your recovery code. Please start by entering your login and password:";
Msg.recovery_mfa_secret = "Please enter your recovery code to disable 2FA for your account:";
Msg.recovery_mfa_secret_ph = "Recovery code";

Msg.mfa_disable = "Disable 2FA"; // XXX also in settings
Msg.continue = "Continue"; // XXX also in settings

Msg.recovery_forgot = 'Forgot recovery code';
Msg.recovery_forgot_text = 'Please copy the following information and <a href="mailto:{0}">email it</a> toyour instance administrators';

Msg.recovery_mfa_wrong = "Invalid username or password";
Msg.recovery_mfa_error = "Unknown error. Please reload and try again.";
Msg.recovery_mfa_disabled = "Multi-factor authentication is already disabled for this account.";

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
                        h('div.alert.alert-danger.wrong-cred.cp-hidden', Msg.recovery_mfa_wrong),
                        h('input.form-control#username', {
                            type: 'text',
                            autocomplete: 'off',
                            autocorrect: 'off',
                            autocapitalize: 'off',
                            spellcheck: false,
                            placeholder: Msg.login_username,
                            autofocus: true,
                        }),
                        h('input.form-control#password', {
                            type: 'password',
                            placeholder: Msg.login_password,
                        }),
                        h('div.cp-recover-button',
                            h('button.btn.btn-primary#cp-recover-login', Msg.continue)
                        )
                    ]),
                    h('div.cp-recovery-step.step2', { style: 'display: none;' }, [
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
                        h('div.cp-recovery-alt', { style: 'display: none;' }, [
                            UI.setHTML(h('div'),
                                Msg._getKey('recovery_forgot_text', [Config.adminEmail || ''])),
                            h('textarea.cp-recover-email', {readonly: 'readonly'}),
                            h('button.btn.btn-secondary#mfacopyproof', Msg.copyToClipboard),
                        ]),
                        h('div.cp-recover-button',
                            h('button.btn.btn-primary#cp-recover', Msg.mfa_disable)
                        )
                    ]),
                    h('div.cp-recovery-step.step-info', { style: 'display: none;' }, [
                        h('div.alert.alert-info.cp-hidden.disabled', Msg.recovery_mfa_disabled),
                        h('div.alert.alert-danger.cp-hidden.unknown-error', Msg.recovery_mfa_error),
                    ]),
                ]),
                h('div.hidden.col-md-3'),
            ])
        ]);
    };

});

