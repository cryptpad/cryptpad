define([
    'jquery',
    'json.sortify',
    '/customize/login.js',
    '/common/cryptpad-common.js',
    //'/common/test.js',
    '/common/common-credential.js',
    '/common/common-interface.js',
    '/common/common-util.js',
    '/common/common-realtime.js',
    '/common/common-constants.js',
    '/common/common-feedback.js',
    '/common/outer/local-store.js',
    '/common/outer/login-block.js',
    '/common/outer/http-command.js',

    '/bower_components/tweetnacl/nacl-fast.min.js',

    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
], function ($, Sortify, Login, Cryptpad, /*Test,*/ Cred, UI, Util, Realtime, Constants, Feedback,
    LocalStore, Block, ServerCommand) {
    if (window.top !== window) { return; }

    var Messages = Cryptpad.Messages;
    var Nacl = window.nacl;

    $(function () {
        if (LocalStore.isLoggedIn()) {
            // already logged in, redirect to drive
            document.location.href = '/drive/';
            return;
        }

        // text and password input fields
        var $uname = $('#username');
        var $passwd = $('#password');
        var $recoveryKey = $('#totprecovery');

        var $step1 = $('.cp-recovery-step.step1');
        var $step2 = $('.cp-recovery-step.step2');
        var $stepInfo = $('.cp-recovery-step.step-info');
        var $totpProof = $('textarea.cp-recover-email');

        [ $uname, $passwd]
        .some(function ($el) { if (!$el.val()) { $el.focus(); return true; } });

        var totpStep2 = function () {
            $step1.hide();
            $step2.show();
        };
        var totpStepInfo = function (cls) {
            $step1.hide();
            $stepInfo.find('.alert').toggleClass('cp-hidden', true);
            $stepInfo.find(cls).toggleClass('cp-hidden', false);
            $stepInfo.show();
        };

        var addProof = function (blockKeys) {
            var pub = blockKeys.sign.publicKey;
            var sec = blockKeys.sign.secretKey;
            var toSign = {
                intent: 'Disable TOTP',
                date: new Date().toISOString(),
                blockId: Nacl.util.encodeBase64(pub),
            };
            var proof = Nacl.sign.detached(Nacl.util.decodeUTF8(Sortify(toSign)), sec);
            toSign.proof = Nacl.util.encodeBase64(proof);
            $totpProof.html(JSON.stringify(toSign, 0, 2));
        };

        var revokeTOTP = function (blockKeys) {
            var recoveryKey = $recoveryKey.val().trim();
            if (!recoveryKey || recoveryKey.length !== 32) {
                return void UI.warn(Messages.error); // XXX error message?
            }
            ServerCommand(blockKeys.sign, {
                command: 'TOTP_REVOKE',
                recoveryKey: recoveryKey
            }, function (err, response) {
                var success = !err && response && response.success;
                if (!success) {
                    console.error(err, response);
                    return void UI.warn(Messages.error);
                }
                // XXX redirect to login?
                return void UI.log(Messages.ui_success);
            });
        };

        var $recoverLogin = $('button#cp-recover-login');
        var $recoverConfirm = $('button#cp-recover');
        var blockKeys;
        $recoverLogin.click(function () {
            UI.addLoadingScreen({
                loadingText: Messages.login_hashing
            });
            var name = $uname.val();
            var pw = $passwd.val();
            setTimeout(function () {
                Login.Cred.deriveFromPassphrase(name, pw, Login.requiredBytes, function (bytes) {
                    var result = Login.allocateBytes(bytes);
                    var blockHash = result.blockHash;
                    var parsed = Block.parseBlockHash(blockHash);
                    addProof(result.blockKeys);
                    blockKeys = result.blockKeys;
                    Util.getBlock(parsed.href, {}, function (err, v) {
                        UI.removeLoadingScreen();
                        if (v && !err) {
                            return totpStepInfo('.disabled');
                        }
                        if (err === 401) {
                            return totpStep2(result.blockKeys);
                        }
                        if (err === 404) {
                            return $step1.find('.wrong-cred').toggleClass('cp-hidden', false);
                        }
                        totpStepInfo('.unknown-error');
                    });
                });
            }, 100);
        });

        UI.confirmButton($recoverConfirm[0], {
            multiple: true
        }, function () {
            if (!blockKeys) { return; }
            // XXX disable TOTP automatically
            revokeTOTP(blockKeys);
        });

    });
});
