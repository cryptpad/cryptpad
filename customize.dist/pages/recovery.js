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

        var termsLink = Pages.customURLs.terms;
        $(tos).find('a').attr({
            href: termsLink,
            target: '_blank',
            tabindex: '-1',
        });

Msg.recovery_header = "Recover account"; // XXX
Msg.recovery_totp = "Disable TOTP on your account"; // XXX
Msg.recovery_totp_description = "If you've locked yourselves out of your CryptPad account because of a TOTP (Time based One Time Password) multi-factor authentication, you can use this form to disable this protection.";
Msg.recovery_totp_beta = 'The TOTP multi-factor authentication has just been released. To avoid accidentaly locking accounts, the support team will temporarily agree to disable the protection even if you forgot your secret recovery key. <strong>If you forgot your recovery key, please copy the proof of ownership and send it to <a href="mailto:{0}">{0}</a></strong>';
Msg.recovery_totp_login = "Please enter your login credentials";
Msg.recovery_totp_secret = "Please enter your secret recovery key";
Msg.recovery_totp_secret_ph = "Secret recovery key";
Msg.recovery_totp_proof = "Proof of ownership";
Msg.recovery_totp_continue = "Continue";
Msg.recovery_totp_disable = "Disable TOTP";

Msg.recovery_totp_method_email = "Manual recovery by email";
Msg.recovery_totp_method_secret = "Automatic recovery by secret key";

Msg.recovery_totp_wrong = "Invalid username or password";
Msg.recovery_totp_error = "Unknown error. Please reload and try again.";
Msg.recovery_totp_disabled = "Multi-factor authentication is already disabled for this account.";

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

        if (Config.restrictRegistration) {
            return frame([
                h('div.cp-restricted-registration', [
                    h('p', Msg.register_registrationIsClosed),
                ])
            ]);
        }

        var termsCheck;
        if (termsLink) {
            termsCheck = h('div.checkbox-container', tos);
        }

        return frame([
            h('div.row.cp-recovery-det', [
                h('div#userForm.form-group.hidden.col-md-12', [
                    h('h2', Msg.recovery_totp),
                    h('div.cp-recovery-desc', [
                        Msg._getKey('recovery_totp_description', [ Pages.Instance.name ]),
                    ]),
                    h('div.cp-recovery-step.step1', [
                        h('div.alert.alert-danger.wrong-cred.cp-hidden', Msg.recovery_totp_wrong),
                        h('label', Msg.recovery_totp_login),
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
                            h('button.btn.btn-primary#cp-recover-login', Msg.recovery_totp_continue)
                        )
                    ]),
                    h('div.cp-recovery-step.step2', { style: 'display: none;' }, [
                        h('div.cp-recovery-method', [
                            h('h3', Msg.recovery_totp_method_secret),
                            h('label', Msg.recovery_totp_secret),
                            h('input.form-control#totprecovery', {
                                type: 'text',
                                autocomplete: 'off',
                                autocorrect: 'off',
                                autocapitalize: 'off',
                                spellcheck: false,
                                placeholder: Msg.recovery_totp_secret_ph,
                                autofocus: true,
                            }),
                            h('div.cp-recover-button',
                                h('button.btn.btn-primary#cp-recover', Msg.recovery_totp_disable)
                            )
                        ]),
                        h('div.cp-recovery-desc', Msg.settings_kanbanTagsOr),
                        h('div.cp-recovery-method', [
                            h('h3', Msg.recovery_totp_method_email),
                            Config.adminEmail ? UI.setHTML(h('div.alert.alert-warning'),
                                Msg._getKey('recovery_totp_beta', [Config.adminEmail])) : undefined,
                            h('label', Msg.recovery_totp_proof),
                            h('textarea.cp-recover-email', {readonly: 'readonly'}),
                            h('button.btn.btn-secondary', Msg.copyToClipboard),
                        ]),
                    ]),
                    h('div.cp-recovery-step.step-info', { style: 'display: none;' }, [
                        h('div.alert.alert-info.cp-hidden.disabled', Msg.recovery_totp_disabled),
                        h('div.alert.alert-danger.cp-hidden.unknown-error', Msg.recovery_totp_error),
                    ]),
                ])
            ])
        ]);
    };

});

