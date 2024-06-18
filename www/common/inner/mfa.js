// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/customize/messages.js',
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/components/nthen/index.js',
    '/customize.dist/login.js',
    '/common/common-util.js',

], function ($, Messages, h, UI, nThen, Login, Util) {
    const MFA = {};

    MFA.totpSetup = function (common, config, content, enabled, cb) {

        var sframeChan = common.getSframeChannel();
        // NOTE privateData may not be defined yet
        var accountName = config.accountName;
        var origin = config.origin;

        var $content = $(content).empty();
        $content.append(h('div.cp-settings-mfa-hint.cp-settings-mfa-status' + (enabled ? '.mfa-enabled' : '.mfa-disabled'), [
            h('i.fa' + (enabled ? '.fa-check' : '.fa-times')),
            h('span', enabled ? Messages.mfa_status_on : Messages.mfa_status_off)
        ]));

        if (enabled) {
            (function () {
            var button = h('button.btn', Messages.mfa_disable);
            button.classList.add('disable-button');
            var $mfaRevokeBtn = $(button);
            var pwInput;
            var pwContainer = h('div.cp-password-container', [
                h('label.cp-settings-mfa-hint', { for: 'cp-mfa-password' }, Messages.mfa_revoke_label),
                pwInput = h('input#cp-mfa-password', {
                    type: 'password',
                    placeholder: Messages.login_password,
                }),
                button
            ]);
            $content.append(pwContainer);

            // submit password on enter keyup
            $(pwInput).on('keyup', e => {
                if (e.which === 13) { $mfaRevokeBtn.click(); }
            });

            var spinner = UI.makeSpinner($mfaRevokeBtn);
            $mfaRevokeBtn.click(function () {
                var name = accountName;
                var password = $(pwInput).val();
                if (!password) { return void UI.warn(Messages.login_noSuchUser); }

                spinner.spin();
                $(pwInput).prop('disabled', 'disabled');
                $mfaRevokeBtn.prop('disabled', 'disabled');
                var blockKeys;
                var ssoSeed;

                nThen(function (waitFor) {
                    sframeChan.query("Q_SETTINGS_GET_SSO_SEED", {
                    }, waitFor(function (err, obj) {
                        if (!obj || !obj.seed) { return; } // Not an sso account?
                        ssoSeed = obj.seed;
                    }));
                }).nThen(function (waitFor) {
                    var next = waitFor();
                    // scrypt locks up the UI before the DOM has a chance
                    // to update (displaying logs, etc.), so do a set timeout
                    setTimeout(function () {
                    var salt = ssoSeed || name;
                    Login.Cred.deriveFromPassphrase(salt, password, Login.requiredBytes, function (bytes) {
                        var result = Login.allocateBytes(bytes);
                        sframeChan.query("Q_SETTINGS_CHECK_PASSWORD", {
                            blockHash: result.blockHash,
                        }, function (err, obj) {
                            if (!obj || !obj.correct) {
                                spinner.hide();
                                UI.warn(Messages.login_noSuchUser);
                                $mfaRevokeBtn.removeAttr('disabled');
                                $(pwInput).removeAttr('disabled');
                                waitFor.abort();
                                return;
                            }
                            spinner.done();
                            blockKeys = result.blockKeys;
                            next();
                        });
                    });
                    }, 100);
                }).nThen(function () {
                    $(pwContainer).remove();
                    var OTPEntry;
                    var disable = h('button.btn.disable-button', Messages.mfa_revoke_button);
                    $content.append(h('div.cp-password-container', [
                        h('label.cp-settings-mfa-hint', { for: 'cp-mfa-password' }, Messages.mfa_revoke_code),
                        OTPEntry = h('input', {
                            placeholder: Messages.settings_otp_code
                        }),
                        disable
                    ]));
                    var $OTPEntry = $(OTPEntry);
                    var $d = $(disable).click(function () {
                        $d.prop('disabled', 'disabled');
                        var code = $OTPEntry.val();
                        sframeChan.query("Q_SETTINGS_TOTP_REVOKE", {
                            key: blockKeys.sign,
                            data: {
                                command: 'TOTP_REVOKE',
                                code: code,
                            }
                        }, function (err, obj) {
                            $OTPEntry.val("");
                            if (err || !obj || !obj.success) {
                                $d.removeAttr('disabled');
                                return void UI.warn(Messages.settings_otp_invalid);
                            }
                            cb(false);
                        }, {raw: true});

                    });
                    OTPEntry.focus();
                    // submit OTP on enter keyup
                    $OTPEntry.on('keyup', e => {
                        if (e.which === 13) { $d.click(); }
                    });
                });
            });

            })();
            return;
        }

        var button = h('button.btn.btn-primary', Messages.mfa_setup_button);
        var $mfaSetupBtn = $(button);
        var pwInput;
        $content.append(h('div.cp-password-container', [
            h('label.cp-settings-mfa-hint', { for: 'cp-mfa-password' }, Messages.mfa_setup_label),
            pwInput = h('input#cp-mfa-password', {
                type: 'password',
                placeholder: Messages.login_password,
            }),
            button
        ]));
        var spinner = UI.makeSpinner($mfaSetupBtn);

        // submit password on enter keyup
        $(pwInput).on('keyup', e => {
            if (e.which === 13) { $(button).click(); }
        });

        $(button).click(function () {
            var name = accountName;
            var password = $(pwInput).val();
            if (!password) { return void UI.warn(Messages.login_noSuchUser); }

            spinner.spin();
            $(pwInput).prop('disabled', 'disabled');
            $mfaSetupBtn.prop('disabled', 'disabled');

            var Base32, QRCode, Nacl;
            var blockKeys;
            var recoverySecret;
            var ssoSeed;
            nThen(function (waitFor) {
                require([
                    '/auth/base32.js',
                    '/lib/qrcode.min.js',
                    '/components/tweetnacl/nacl-fast.min.js',
                ], waitFor(function (_Base32) {
                    Base32 = _Base32;
                    QRCode = window.QRCode;
                    Nacl = window.nacl;
                }));
            }).nThen(function (waitFor) {
                sframeChan.query("Q_SETTINGS_GET_SSO_SEED", {
                }, waitFor(function (err, obj) {
                    if (!obj || !obj.seed) { return; } // Not an sso account?
                    ssoSeed = obj.seed;
                }));
            }).nThen(function (waitFor) {
                var next = waitFor();
                // scrypt locks up the UI before the DOM has a chance
                // to update (displaying logs, etc.), so do a set timeout
                setTimeout(function () {
                    var salt = ssoSeed || name;
                    Login.Cred.deriveFromPassphrase(salt, password, Login.requiredBytes, function (bytes) {
                        console.error(bytes);
                        var result = Login.allocateBytes(bytes);
                        sframeChan.query("Q_SETTINGS_CHECK_PASSWORD", {
                            blockHash: result.blockHash,
                        }, function (err, obj) {
                            console.error(obj);
                            if (!obj || !obj.correct) {
                                spinner.hide();
                                UI.warn(Messages.login_noSuchUser);
                                $mfaSetupBtn.removeAttr('disabled');
                                $(pwInput).removeAttr('disabled');
                                waitFor.abort();
                                return;
                            }
                            console.warn(obj);
                            spinner.done();
                            blockKeys = result.blockKeys;
                            next();
                        });
                    });
                }, 100);
            }).nThen(function (waitFor) {
                $content.empty();
                var next = waitFor();
                recoverySecret = Nacl.util.encodeBase64(Nacl.randomBytes(24));
                var button = h('button.btn.btn-primary', [
                    h('i.fa.fa-check'),
                    h('span', Messages.done)
                ]);
                $content.append(h('div.alert.alert-danger', [
                    h('h2', Messages.mfa_recovery_title),
                    h('p', Messages.mfa_recovery_hint),
                    h('p', Messages.mfa_recovery_warning),
                    h('div.cp-password-container', [
                        UI.dialog.selectable(recoverySecret),
                        button
                    ])
                ]));

                var nextButton = h('button.btn.btn-primary', {
                    'disabled': 'disabled'
                }, Messages.continue);
                $(nextButton).click(function () {
                    next();
                }).appendTo($content);

                $(button).click(function () {
                    $content.find('.alert-danger').removeClass('alert-danger').addClass('alert-success');
                    $(button).prop('disabled', 'disabled');
                    $(nextButton).removeAttr('disabled');
                });
            }).nThen(function () {
                var randomSecret = function () {
                    var U8 = Nacl.randomBytes(20);
                    return Base32.encode(U8);
                };
                $content.empty();

                var updateQR = Util.mkAsync(function (uri, target) {
                    new QRCode(target, uri);
                });
                var updateURI = function (secret) {
                    var username = accountName;
                    var hostname = new URL(origin).hostname;
                    var label = "CryptPad";

                    var uri = `otpauth://totp/${encodeURI(label)}:${encodeURI(username)}@${hostname}?secret=${secret}`;

                    var qr = h('div.cp-settings-qr');
                    var uriInput = UI.dialog.selectable(uri);

                    updateQR(uri, qr);

                    var OTPEntry = h('input', {
                        placeholder: Messages.settings_otp_code
                    });
                    var $OTPEntry = $(OTPEntry);

                    var description = h('p.cp-settings-mfa-hint', Messages.settings_otp_tuto);
                    var confirmOTP = h('button.btn.btn-primary', [
                        h('i.fa.fa-check'),
                        h('span', Messages.mfa_enable)
                    ]);
                    var lock = false;

                    confirmOTP.addEventListener('click', function () {
                        var code = $OTPEntry.val();
                        if (code.length !== 6 || /\D/.test(code)) {
                            return void UI.warn(Messages.settings_otp_invalid);
                        }
                        if (lock) { return; }
                        confirmOTP.disabled = true;
                        lock = true;

                        var data = {
                            secret: secret,
                            contact: "secret:" + recoverySecret, // TODO other recovery options
                            code: code,
                        };

                        sframeChan.query("Q_SETTINGS_TOTP_SETUP", {
                            key: blockKeys.sign,
                            data: data
                        }, function (err, obj) {
                            lock = false;
                            $OTPEntry.val("");
                            if (err || !obj || !obj.success) {
                                confirmOTP.disabled = false;
                                console.error(err);
                                return void UI.warn(Messages.error);
                            }
                            cb(true);
                        }, { raw: true });
                    });

                    $content.append([
                        description,
                        uriInput,
                        h('div.cp-settings-qr-container', [
                            qr,
                            h('div.cp-settings-qr-code', [
                                OTPEntry,
                                h('br'),
                                confirmOTP
                            ])
                        ])
                    ]);
                    OTPEntry.focus();
                    // submit OTP on enter keyup
                    $OTPEntry.on('keyup', e => {
                        if (e.which === 13) { $(confirmOTP).click(); }
                    });
                };


                var secret = randomSecret();
                updateURI(secret);
            });

        });
    };

    return MFA;
});
