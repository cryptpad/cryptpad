// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const jwt = require("jsonwebtoken");
const Sessions = require("../lib/storage/sessions.js");

/*
This script was created strictly for debugging purposes so that I could manually create an
authenticated session and a corresponding JWT to test whether the client and server would
correctly validate that JWT and allow access to the protected resource.

I'm including it in the scripts directory in case it's useful for future debugging,
but I don't expect it to be of any use to non-developers.

--Aaron

*/


var [
    secret,
    subject
] = process.argv.slice(2);

if (!(secret && subject)) {
    return void console.error(`This script creates a JSON Web Token (JWT) for a given subject.
It expects:

1. a secret known only to the issuer which is used to authenticate the token's integrity
2. a subject which the JWT is intended to protect (ie. a block id)

Call this script like so:

node ./scripts/issue-jwt.js "my_secret" "my_subject"`);

}

// the session storage module uses a pair of (subject, reference) to look up a session
// subject refers to a block public key, reference refers to a session for that block
var reference = Sessions.randomId();

jwt.sign({
    ref: reference,
    sub: subject
}, secret, {
    expiresIn: (60 * 60 * 24 * 3), // Expire three days from now
    algorithm: 'HS512',
}, function (err, token) {
    if (err) { return void console.error(err); }
    console.log(`Token:
${token}
`);

    jwt.verify(token, secret, {
        algorithm: 'HS512',
    }, function (err, result) {
        if (err) {
            return void console.error(err);
        }

        console.log("JSON Payload");
        console.log(result);
        console.log();

        // these values are in seconds, not milliseconds
        // https://www.npmjs.com/package/jsonwebtoken#token-expiration-exp-claim
        if (result.iat) {
            console.log(`Issued at ${new Date(result.iat * 1000)}`);
        }

        if (result.exp) {
            console.log(`Expires at ${new Date(result.exp * 1000)}`);
        }
    });
});

