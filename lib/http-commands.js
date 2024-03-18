// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

var Nacl = require("tweetnacl/nacl-fast");
var Util = require('./common-util.js');
const plugins = require("./plugin-manager");

var Challenge = require("./storage/challenge.js");
    // C.read(Env, id, cb)
    // C.write(Env,id, data, cb)
    // C.delete(Env, id, cb)


/*
The API for command definition consists of two stages:

Clients first send a command and its associated parameters.
The server validates that the command is supported, and that
the provided parameters are valid. If it fails validation for any reason,
the server responds with an error and the protocol is aborted.

COMMANDS[COMMAND_NAME] = function (Env, body, cb) {
    // inspect parameters in the request body
    if (!body.essential_parameter) {
        return void cb('NO');
    }
    cb();
};

Commands whose parameters are successfully validated
have those parameters stored on the disk (or a relational DB in the future).
The server then requests that the client sign their well-formulated
command along with a server-generated transaction id ('txid': randomized to prevent replays)
and a date (so that it can ensure that the client responds within a reasonable window.

Clients then respond with a txid and a cryptographic signature
which matches the parameters of the command. The server loads the command
with the corresponding txid, checks that it was signed within a reasonable time window,
validates the signature, and attempts to complete the command's execution:

COMMAND[COMMAND_NAME].complete = function (Env, body, cb) {
    doAThing(function (err, values) {
        if (err) {
            // Log the error and respond that the command was not successful
            return void cb("SORRY_BUT_IM_NOT_OK");
        }
        cb(void 0, {
            arbitrary: values,
        });
    });
};

In this second stage the protocol can be aborted if the client has done something wrong:
(ie. if it did not produce a valid signature for the command)
or it can can fail because the server was not able to complete the requested task
(ie. because of an I/O error or because an error was thrown and caught).

It is intended that the server will respond with an appropriate error if
the request cannot be completed, and it will respond OK if everything completed successfully.

*/

var COMMANDS = {};

// Methods allowing clients to configure Time-based One-Time Passwords for their login-block,
// and to authenticate new sessions once a TOTP secret has been associated with their account,
const NOAUTH = require("./challenge-commands/base.js");
COMMANDS.MFA_CHECK = NOAUTH.MFA_CHECK;
COMMANDS.WRITE_BLOCK = NOAUTH.WRITE_BLOCK; // Account creation + password change
COMMANDS.REMOVE_BLOCK = NOAUTH.REMOVE_BLOCK;

const TOTP = require("./challenge-commands/totp.js");
COMMANDS.TOTP_SETUP = TOTP.TOTP_SETUP;
COMMANDS.TOTP_VALIDATE = TOTP.TOTP_VALIDATE;
COMMANDS.TOTP_MFA_CHECK = TOTP.TOTP_MFA_CHECK;
COMMANDS.TOTP_REVOKE = TOTP.TOTP_REVOKE;
COMMANDS.TOTP_WRITE_BLOCK = TOTP.TOTP_WRITE_BLOCK; // Password change only for now (v5.5.0)
COMMANDS.TOTP_REMOVE_BLOCK = TOTP.TOTP_REMOVE_BLOCK;

try {
    // SSO plugin may not be installed
    const SSO = plugins.SSO && plugins.SSO.challenge;
    COMMANDS.SSO_AUTH = SSO.SSO_AUTH;
    COMMANDS.SSO_AUTH_CB = SSO.SSO_AUTH_CB;
    COMMANDS.SSO_WRITE_BLOCK = SSO.SSO_WRITE_BLOCK; // Account creation only
    COMMANDS.SSO_UPDATE_BLOCK = SSO.SSO_UPDATE_BLOCK; // Password change
    COMMANDS.SSO_VALIDATE = SSO.SSO_VALIDATE;
} catch (e) {}

var randomToken = () => Nacl.util.encodeBase64(Nacl.randomBytes(24)).replace(/\//g, '-');

// this function handles the first stage of the protocol
// (the server's validation of the client's request and the generation of its challenge)
var handleCommand = function (Env, req, res) {
    var body = req.body;
    var command = body.command;

    // reject if the command does not have a corresponding function
    if (typeof(COMMANDS[command]) !== 'function') {
        Env.Log.error('CHALLENGE_UNSUPPORTED_COMMAND', command);
        return void res.status(500).json({
            error: 'invalid command',
        });
    }

    var publicKey = body.publicKey;
    // reject if they did not provide a valid public key
    if (!publicKey || typeof(publicKey) !== 'string' || publicKey.length !== 44) {
        Env.Log.error('CHALLENGE_INVALID_KEY', publicKey);
        return void res.status(500).json({
            error: 'Invalid key',
        });
    }

    try {
        COMMANDS[command](Env, body, function (err) {
            if (err) {
                Env.Log.error('CHALLENGE_COMMAND_EXECUTION_ERROR', {
                    body: body,
                    error: Util.serializeError(err),
                });
                // errors returned from commands are passed back to the client
                // as a weak precaution, we try to only send an error's message
                // if one exists. This makes it less likely that we'll respond with any
                // sensitive information in a stack trace. Ideally functions should
                // only return error messages or codes in the form of a string or number,
                // but mistakes happen.
                return void res.status(500).json({
                    error: (err && err.message) || err,
                });
            }

            var txid = randomToken();
            var date = new Date().toISOString();

            var copy = Util.clone(body);
            copy.txid = txid;
            copy.date = date;

            // Write the command and challenge to disk, because the challenge protocol
            // is interactive and the subsequent response might be handled by a different http worker
            // this makes it so we can avoid holding state in memory
            Challenge.write(Env, txid, JSON.stringify(copy), function (err) {
                if (err) {
                    Env.Log.error('CHALLENGE_WRITE_ERROR', Util.serializeError(err));
                    return void res.status(500).json({
                        // arbitrary error message, only intended for debugging
                        error: 'Internal server error 6250',
                    });
                }
                // respond with challenge parameters
                return void res.status(200).json({
                    txid: txid,
                    date: date,
                });
            });
        }, req);
    } catch (err) {
        Env.Log.error("CHALLENGE_COMMAND_THROWN_ERROR", {
            error: Util.serializeError(err),
        });
        return void res.status(500).json({
            // arbitrary error message, only intended for debugging
            error: 'Internal server error 7692',
        });
    }
};

// this function handles the second stage of the protocol
// (the client's response to the server's challenge)
var handleResponse = function (Env, req, res) {
    var body = req.body;

    if (Object.keys(body).some(k => !/(sig|txid)/.test(k))) {
        Env.Log.error("CHALLENGE_RESPONSE_DEBUGGING", body);
        // we expect the response to only have two keys
        // if any more are present then the response is malformed
        return void res.status(500).json({
            error: 'extraneous parameters',
        });
    }


    // transaction ids are issued to the client by the server
    // they allow it to recall the full details of the challenge
    // to which the client is responding
    var txid = body.txid;

    // if no txid is present, then the server can't look up the corresponding challenge
    // the response is definitely malformed, so reject it.
    // Additionally, we expect txids to be 32 characters long (24 Uint8s as base64)
    // reject txids of any other length
    if (!txid || typeof(txid) !== 'string' || txid.length !== 32) {
        Env.Log.error('CHALLENGE_RESPONSE_BAD_TXID', body);
        return void res.status(500).json({
            error: "Invalid txid",
        });
    }

    var sig = body.sig;
    if (!sig || typeof(sig) !== 'string' || sig.length !== 88) {
        Env.Log.error("CHALLENGE_RESPONSE_BAD_SIG", body);
        return void res.status(500).json({
            error: "Missing signature",
        });
    }

    Challenge.read(Env, txid, function (err, text) {
        if (err) {
            Env.Log.error("CHALLENGE_READ_ERROR", {
                txid: txid,
                error: Util.serializeError(err),
            });
            return void res.status(500).json({
                error: "Unexpected response",
            });
        }

        // garbage collection can clean this up later
        Challenge.delete(Env, txid, function (err) {
            if (err) {
                Env.Log.error("CHALLENGE_DELETION_ERROR", {
                    txid: txid,
                    error: Util.serializeError(err),
                });
            }
        });

        var json = Util.tryParse(text);

        if (!json) {
            Env.Log.error("CHALLENGE_PARSE_ERROR", {
                txid: txid,
            });
            return void res.status(500).json({
                error: "Internal server error 129",
            });
        }

        var publicKey = json.publicKey;
        if (!publicKey || typeof(publicKey) !== 'string') {
            // This shouldn't happen, as we expect that the server
            // will have validated the key to an extent before storing the challenge
            Env.Log.error('CHALLENGE_INVALID_PUBLICKEY', {
                publicKey: publicKey,
            });
            return res.status(500).json({
                error: "Invalid public key",
            });
        }

        var action;
        try {
            action = COMMANDS[json.command].complete;
        } catch (err2) {}

        if (typeof(action) !== 'function') {
            Env.Log.error("CHALLENGE_RESPONSE_ACTION_NOT_IMPLEMENTED", json.command);
            return res.status(501).json({
                error: 'Not implemented',
            });
        }

        var u8_toVerify,
            u8_sig,
            u8_publicKey;

        try {
            u8_toVerify = Nacl.util.decodeUTF8(text);
            u8_sig = Nacl.util.decodeBase64(sig);
            u8_publicKey = Nacl.util.decodeBase64(publicKey);
        } catch (err3) {
            Env.Log.error('CHALLENGE_RESPONSE_DECODING_ERROR', {
                text: text,
                sig: sig,
                publicKey: publicKey,
                error: Util.serializeError(err3),
            });
            return res.status(500).json({
                error: "decoding error"
            });
        }

        // validate the response
        var success = Nacl.sign.detached.verify(u8_toVerify, u8_sig, u8_publicKey);
        if (success !== true) {
            Env.Log.error("CHALLENGE_RESPONSE_SIGNATURE_FAILURE", {
                publicKey,
            });
            return void res.status(500).json({
                error: 'Failed signature validation',
            });
        }

        // execute the command
        action(Env, json, function (err, content) {
            if (err) {
                Env.Log.error("CHALLENGE_RESPONSE_ACTION_ERROR", {
                    error: Util.serializeError(err),
                });
                return res.status(500).json({
                    error: 'Execution error',
                    errorCode: Util.serializeError(err)
                });
            }
            res.status(200).json(content);
        }, req, res);
    });
};


module.exports.handle = function (Env, req, res /*, next */) {
    var body = req.body;
    // we expect that the client has posted some JSON data
    if (!body) {
        return void res.status(500).json({
            error: 'invalid request',
        });
    }

    // we only expect responses to challenges to have a 'txid' attribute
    // further validation is performed in handleResponse
    if (body.txid) {
        return void handleResponse(Env, req, res);
    }

    // we only expect initial requests to have a 'command' attribute
    // further validation is performed in handleCommand
    if (body.command) {
        return void handleCommand(Env, req, res);
    }

    // if a request is neither a command nor a response, then reject it with an error
    res.status(500).json({
        error: 'invalid request',
    });
};
