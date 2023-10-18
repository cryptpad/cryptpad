define([
    '/api/config',
    'jquery',
    '/common/hyperscript.js',
    '/common/common-util.js',
    '/common/common-credential.js',
    '/common/common-interface.js',
    '/common/common-login.js',
    '/common/common-constants.js',
    '/common/outer/http-command.js',
    '/common/outer/local-store.js',
    '/common/outer/login-block.js',
    '/customize/messages.js',

    '/components/tweetnacl/nacl-fast.min.js',
], function (ApiConfig, $, h, Util, Cred, UI, Login, Constants,
        ServerCommand, LocalStore, Block, Messages) {
    if (window.top !== window) { return; }

    let Nacl = window.nacl;

    let ssoAuthCb = function (cb) {
        var b64Keys = Util.tryParse(localStorage.CP_sso_auth);
        if (!b64Keys) {
            UI.errorLoadingScreen("MISSING_SIGNATURE_KEYS");
            return;
        }
        var keys = {
            secretKey: Nacl.util.decodeBase64(b64Keys.s),
            publicKey: Nacl.util.decodeBase64(b64Keys.p)
        };
        ServerCommand(keys, {
            command: 'SSO_AUTH_CB',
            url: window.location.href
        }, function (err, data) {
            delete localStorage.CP_sso_auth;
            document.cookie = 'ssotoken=; Max-Age=-99999999;';
            cb(err, data);
        });
    };
    let ssoLoginRegister = function (seed, pw, jwt, name, isRegister) {
        Login.loginOrRegister({
            uname: seed,
            passwd: pw,
            isRegister: isRegister,
            onOTP: UI.getOTPScreen,
            ssoAuth: {
                name: name,
                type: 'SSO',
                data: jwt
            }
        }, function (err) {
            if (err) {
                UI.removeLoadingScreen();
                var msg = Messages.error;
                if (err === 'NO_SUCH_USER') { msg = Messages.drive_sfPasswordError;  }
                let $button = $('button#cp-ssoauth-button');
                $button.prop('disabled', '');
                return void UI.warn(msg);
            }
            window.location.href = '/drive/';
        });
    };

    $(function () {
        if (!ApiConfig.sso) { return void UI.errorLoadingScreen(Messages.error); }

        UI.addLoadingScreen();
        ssoAuthCb(function (err, data) {
            if (err || !data || !data.jwt) {
                console.error(err || 'NO_DATA');
                return void UI.warn(Messages.error);
            }
            let jwt = data.jwt;
            let seed = data.seed;
            let name = data.name;
            $('body').addClass(data.register ? 'cp-register' : 'cp-login');

            UI.removeLoadingScreen();


            // Login with a password OR register and password allowed
            let $button = $('button#cp-ssoauth-button');
            let $pw = $('#password');
            let $pw2 = $('#passwordconfirm');
            let next = (pw) => {
                // TODO login err ==> re-enable button

                setTimeout(() => { // First setTimeout to remove mobile devices' keyboard
                UI.addLoadingScreen({
                    loadingText: Messages.login_hashing,
                    hideTips: true,
                });
                setTimeout(function () { // Second timeout for the loading screen befofe Scrypt
                    ssoLoginRegister(seed, pw, jwt, name, data.register);
                }, 100);
                }, 100);

            };

            // Existing account, no CP password, continue
            if (!data.register && !data.password) {
                return void next('');
            }

            // Registration and CP password disabled, continue
            if (data.register && !ApiConfig.sso.password) {
                return void next('');
            }

            $('div.cp-ssoauth-pw').show();

            $button.click(() => {
                let pw = $pw.val();
                if (data.register && pw !== $pw2.val()) {
                    return void UI.warn(Messages.register_passwordsDontMatch);
                }
                if (data.register && pw && !Cred.isLongEnoughPassword(pw)) {
                    return void UI.warn(Messages.register_passwordTooShort);
                }
                $button.prop('disabled', 'disabled');

                if (data.register) {
                    var span = h('span', [
                        h('h2', [
                            h('i.fa.fa-warning'),
                            ' ',
                            Messages.register_warning,
                        ]),
                        Messages.register_warning_note
                    ]);
                    UI.confirm(span, function (yes) {
                        if (!yes) {
                            $button.removeAttr('disabled');
                            return;
                        }
                        next(pw);
                    });
                    return;
                }

                next(pw);
            });
        });
    });
});
