// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/common-util.js',
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/common/outer/http-command.js',
    '/auth/base32.js',
    '/customize.dist/login.js',
    '/common/outer/login-block.js',
    '/common/outer/local-store.js',

    '/lib/qrcode.min.js',
    '/components/tweetnacl/nacl-fast.min.js',

    'less!/auth/app-auth.less',
], function ($, Util, h, UI, ServerCommand, Base32, Login, Block, LocalStore) {
    var QRCode = window.QRCode;
    var Nacl = window.nacl;


    var main = h('div.centered', [
        h('h1', 'Auth prototype'),

        h('div.bordered', [
            h('h2#keys', "Key derivation"),
            h('blockquote',
`A user's name and password are used to derive:

1. a symmetric key which decrypts their "login block" and provides access to the rest of their account's credentials

2. an asymmetric signing keypair which proves they own the block (the public key is used as its identifier), allowing them to create new blocks, and overwrite or delete old ones.

With the introduction of TOTP as a second factor of authentication, the signing keypair is also used to setup multi-factor auth parameters and other actions that requrire authentication, such as:

1. configuration of the TOTP secret, optional contact field, and future parameters for other MFA mechanisms

2. authentication of new sessions

3. revoking existing sessions

Because these two cryptographic keys provide access to and control of the user's entire account, it is prudent to treat them (and the credentials from which they are derived) very carefully.

The symmetric key is kept in localStorage until logging out because it is needed to access the rest of their account, however, the signing keys should be forgotten as soon as they are no longer necessary (ie. once a session is authenticated, or once sensitive operations like password change have been completed).

Note: The login process performs many checks, confirming that crentials point to a valid block and that it yields access to a valid account, falling back to legacy methods of login where necessary. This prototype ignnores all those edge cases and is here only to derive a valid signing keypair.
`),
            h('p', h('input#username', {
                type: 'text',
                placeholder: "Username",
            })),
            h('p', h('input#password', {
                type: 'password',
                placeholder: "Password",
            })),
            h('button#derive-keys', "Derive keys"),
            h('hr'),
            h('p', [
                'Block id:',
                h('div#block-id', '???'),
            ]),
        ]),


        h('div.bordered#totp-app-config', [
            h('h2#app', "TOTP app configuration"),
            h('blockquote', `// TOTP app configuration notes
Time-based One-Time Passwords are generated using a relatively simple algorithm which uses:

1. a hash function

2. a secret known to the client and the service authenticating them

3. the current time, upon which both parties must agree

Both parties should then be able to derive the same code which is valid within a 30 second window.

The server expects the client to provide a valid code in order to configure their account for TOTP 2FA. This ensures that the client's clock matches the server's, and avoids unfortunate situations in which the client enables TOTP authentication and but is then unable to authenticate.

The secret should consist of not less than 160 bits of entropy (20 Uint8s). When encoded as base32 this should result in a 32 character string.

Some authenticator apps can be configured with manual entry of the secret, but there are additional parameters indicating the name of the service and the account or resource to which it corresponds. These parameters can all be represented with a standardized URI, which can then be represented as a QR code.

It is possible to specify a variety of other values (code length, issuer, stronger hashing algorithms) through query parameters in the URI, but not all authenticator apps will support them. The ones specified below should work basically everywhere. Note that longer URIs produce more complex QR codes, which may be more difficult to scan.

Scan the generated code with your preferred app so that you can generate a code and configure your block with TOTP 2FA.
`),

            h('p', [
                "Base32 secret",
                h('input#base32-secret', {
                    type: 'text',
                    placeholder: 'secret',
                }),
            ]),
            h('button#generate-secret', "Generate new TOTP secret"),
            h('hr'),
            h('p', [
                "Label",
                h('input#totp-label', {
                    type: 'text',
                    placeholder: 'Label',
                }),
            ]),
            h('p', [
                "Hostname",
                h('input#totp-hostname', {
                    type: 'text',
                    placeholder: 'Hostname',
                }),
            ]),
            h('p', [
                "TOTP URI",
                h('input#totp-uri', {
                    type: 'text',
                    //disabled: 'disabled',
                    placeholder: 'URI',
                }),
            ]),
            h('p', [
                'QR Code',
                h('br'),
                h('div#qr-target', ''),
            ]),
        ]),

        h('div.bordered', [
            h('h2#setup', "MFA account settings"),
            h('blockquote',
`// MFA account settings notes

Once you have:

1. derived your block signing keypair

2. generated a secret

3. configured your authenticator app to generate codes using that secret

...then you can try entering a one-time password (OTP). This will be used in a request to the server to configure your account such that your block can only be requested with a valid token.

Note: This must currently be reversed manually (by deleting the mfa config file) because block removal of these settings is not yet implemented.

`),
            h('p', [
                h('input#otp-entry', {
                    type: 'text',
                    inputmode: 'numeric',
                    autocomplete: 'one-time-code',
                    pattern: '[0-9]{6}',
                    maxlength: "6",
                    placeholder: 'One-Time Password',
                    
                }),
            ]),
            h('button#submit-otp', 'Submit OTP'),
        ]),
    ]);

    document.body.appendChild(main);

    // hack to make the page jump to a given element once the content has been rendered
    window.location.hash = window.location.hash;

    // Key derivation

    var $username = $('#username');
    var $password = $('#password');
    var $deriveKeys = $('#derive-keys');
    var $blockId = $('#block-id');

    var BUSY = false;

    var blockKeys;
    var blockId;
    $deriveKeys.click(function () {
        if (BUSY) { return; }

        var name = $username.val().trim();
        var password = $password.val();

        if (!name) { return void window.alert("Invalid name"); }
        if (!password) { return void window.alert("Invalid password"); }

        UI.log("Deriving keys..");

        BUSY = true;
        // scrypt locks up the UI before the DOM has a chance to update (displaying logs, etc.)
        // so do a set timeout
        setTimeout(function () {
            Login.Cred.deriveFromPassphrase(name, password, Login.requiredBytes, function (bytes) {
                BUSY = false;
                UI.log("DONE");
                console.log(bytes);

                var result = Login.allocateBytes(bytes);

                console.log(result);

                blockKeys = result.blockKeys;

                var blockURL = Block.getBlockUrl(blockKeys);
                console.log('block URL', blockURL);

                blockId = blockURL.replace(/.*\//, '');
                $blockId.html(blockId);
            });
        }, 1500);
    });




    // TOTP app configuration

    var $generateSecret = $('#generate-secret');
    var $b32Secret = $('#base32-secret');

    var randomSecret = () => {
        var U8 = Nacl.randomBytes(20);
        return Base32.encode(U8);
    };

    var isValidBase32 = input => {
        if (typeof(input) !== 'string') { return false; }
        try {
            var output = Base32.decode(input);
            if (!(output instanceof Uint8Array)) { return false; }
        } catch (err) {
            console.error(err);
            return false;
        }
        return true;
    };

    // use the same base32 secret across page reloads
    // by trying to read the hash and interpret it as a secret
    // otherwise use a new, random secret, and store it in the hash
    var hash = window.location.hash.slice(1);
    console.log(hash);
    console.log('isValid', isValidBase32(hash));
    if (hash && hash.length >= 32 && isValidBase32(hash)) {
        console.log("Reusing existing secret");
        $b32Secret.val(hash);
    } else {
        console.log("Generating new secret");
        let secret = randomSecret();
        $b32Secret.val(secret);
        window.location.hash = secret;
    }

    var $hostname = $('#totp-hostname');
    $hostname.val(new URL(window.location.href).hostname);

    var $label = $('#totp-label');
    $label.val('CryptPad');

    var $uri = $('#totp-uri');

    var valueOrPlaceholder = $e => {
        return $e.val().trim() || ($e.attr('placeholder') || '').trim();
    };

    var $qrTarget = $('#qr-target');

    var updateQR = Util.throttle(function () {
        var uri = $uri.val();
        $qrTarget.html("");
        new QRCode($qrTarget[0], uri);
    }, 400);
    updateQR();

    $uri.on("change keyup keydown", updateQR);

    var updateURI = Util.throttle(function () {
        var username = valueOrPlaceholder($username);

        var hostname = valueOrPlaceholder($hostname);
        var label = valueOrPlaceholder($label);
        var secret = valueOrPlaceholder($b32Secret);

        var uri = `otpauth://totp/${label}:${username}@${hostname}?secret=${secret}`;

        $uri.val(uri);

        updateQR();

    }, 400);

    updateURI();

    [$username, $b32Secret, $hostname, $label].forEach($el => {
        $el.on('change keydown keyup', updateURI);
    });

    $generateSecret.click(function () {
        //UI.log('gen secret');
        var secret = randomSecret();
        $b32Secret.val(secret);
        window.location.hash = secret;
        updateURI();
    });

    // MFA Account settings

    var $OTPEntry = $('#otp-entry');
    var $submitOTP = $('#submit-otp');

    var OTP_LOCK;
    $submitOTP.click(function () {
        if (OTP_LOCK) {
            return void window.alert("Server request already in progress");
        }

        console.log("OTP submission clicked");
        // Double-check that the secret is OK
        var secret = $b32Secret.val();
        if (!isValidBase32(secret)) {
            return void window.alert("Your base32 secret is not valid");
        }

        // Check block keys last, since they're the most expensive to derive

        // The user can't set up 2FA unless they have a signing key which corresponds to an existing block
        if (!blockKeys || !blockId) {
            return void window.alert("Derive block keys first");
        }

        var code = $OTPEntry.val();
        if (code.length !== 6 || /\D/.test(code)) {
            return void window.alert("Invalid code");
        }

        OTP_LOCK = true;
        ServerCommand(blockKeys.sign, {
            command: 'TOTP_SETUP',
            secret: secret,
            code: code,
        }, function (err, response) {
            OTP_LOCK = false;
            $OTPEntry.val("");
            if (err) {
                console.error(err);
                console.log(response);
                return void UI.warn("Error: see console");
            }
            if (!response || !response.bearer) {
                console.log(response);
                return void window.alert("Unexpected response");
            }

            // the server responded with a bearer token
            // remember it so that you aren't redirected back to the login page
            // when you access a page that enforces session persistence
            console.log(response);
            LocalStore.setSessionToken(response.bearer);
            window.alert(`Success! This device's session should already be authenticated. Try accessing this account from a different device or browser to confirm that a TOTP code is required`);
        });
    });
});
