// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
    '/common/clipboard.js',
    '/common/outer/local-store.js',
    '/common/outer/login-block.js',
    '/common/outer/http-command.js',

    '/components/tweetnacl/nacl-fast.min.js',

    'css!/components/components-font-awesome/css/font-awesome.min.css',
], function ($, Sortify, Login, Cryptpad, /*Test,*/ Cred, UI, Util, Realtime, Constants, Feedback,
    Clipboard, LocalStore, Block, ServerCommand) {
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
        var $recoveryKey = $('#mfarecovery');
        var $copyProof = $('#mfacopyproof');

        var $step1 = $('.cp-recovery-step.step1');
        var $step2 = $('.cp-recovery-step.step2');
        var $stepInfo = $('.cp-recovery-step.step-info');
        var $mfaProof = $('textarea.cp-recover-email');
        var $forgot = $('.cp-recovery-forgot');
        var $alt = $('.cp-recovery-alt');

        [ $uname, $passwd]
        .some(function ($el) { if (!$el.val()) { $el.focus(); return true; } });

        var mfaStep2 = function () {
            $step1.hide();
            $step2.show();
        };
        var mfaStepInfo = function (cls) {
            $step1.hide();
            $stepInfo.find('.alert').toggleClass('cp-hidden', true);
            $stepInfo.find(cls).toggleClass('cp-hidden', false);
            $stepInfo.show();
        };

        $forgot.click(function () {
            $alt.toggle();
            if ($alt.is(':visible')) { $forgot.find('i').attr('class', 'fa fa-caret-down'); }
            else { $forgot.find('i').attr('class', 'fa fa-caret-right'); }
        });

        var proofStr;
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
            proofStr = JSON.stringify(toSign, 0, 2);
            $mfaProof.html(proofStr);
        };

        $copyProof.click(function () {
            if (!proofStr) { return; }
            Clipboard.copy(proofStr, (err) => {
                if (!err) { return UI.log(Messages.genericCopySuccess); }
                UI.warn(Messages.error);
            });
        });

        var blockKeys, blockHash, uname;

        var revokeTOTP = function () {
            var recoveryKey = $recoveryKey.val().trim();
            if (!recoveryKey || recoveryKey.length !== 32) {
                return void UI.warn(Messages.error);
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
                UI.log(Messages.ui_success);
                LocalStore.login(undefined, blockHash, uname, function () {
                    Login.redirect();
                });
            });
        };

        var $recoverLogin = $('button#cp-recover-login');
        var $recoverConfirm = $('button#cp-recover');
        $recoverLogin.click(function () {
            UI.addLoadingScreen({
                loadingText: Messages.login_hashing
            });
            uname = $uname.val();
            var pw = $passwd.val();
            setTimeout(function () {
                Login.Cred.deriveFromPassphrase(uname, pw, Login.requiredBytes, function (bytes) {
                    var result = Login.allocateBytes(bytes);
                    blockHash = result.blockHash;
                    var parsed = Block.parseBlockHash(blockHash);
                    addProof(result.blockKeys);
                    blockKeys = result.blockKeys;
                    Util.getBlock(parsed.href, {}, function (err, v) {
                        UI.removeLoadingScreen();
                        if (v && !err) {
                            return mfaStepInfo('.disabled');
                        }
                        if (err === 401) {
                            return mfaStep2(result.blockKeys);
                        }
                        if (err === 404) {
                            return $step1.find('.wrong-cred').toggleClass('cp-hidden', false);
                        }
                        mfaStepInfo('.unknown-error');
                    });
                });
            }, 100);
        });

        $recoverConfirm[0].onclick = function () {
            if (!blockKeys) { return; }
            revokeTOTP();
        };

    });
});
