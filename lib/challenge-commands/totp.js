/* globals Buffer */
const B32 = require("thirty-two");
const OTP = require("notp");
const JWT = require("jsonwebtoken");
const nThen = require("nthen");
const Util = require("../common-util");

const MFA = require("../storage/mfa");
const Sessions = require("../storage/sessions");
const Block = require("../storage/block");

const  Commands = module.exports;

var isString = s => typeof(s) === 'string';

// basic definition of what we'll accept as an OTP code
// exactly six numerical digits
var isValidOTP = otp => {
    return isString(otp) &&
        // in the future this could be updated to support 8 digits
        otp.length === 6 &&
        // \D is non-digit characters, so this tests that it is exclusively numeric
        !/\D/.test(otp);
};

// we'll only allow users to set up multi-factor auth
// for keypairs they control which already have blocks
// this check doesn't confirm that their id is valid base64
// any attempt relying on this should fail when we can't decode
// the id they provided.
var isValidBlockId = id => {
    return id && isString(id) && id.length === 44;
};

// the base32 library can throw when decoding under various conditions.
// we have some basic requirements for the length of base32 as well,
// so we just do all the validation here. It either returns a buffer
// of length 20 or undefined, so the caller can just check whether it's
// falsey and otherwise assume it was well-formed
// Length === 20 comes from the recommendation of 160 bits of entropy
// in RFC4226 (https://www.rfc-editor.org/rfc/rfc4226#section-4)
var decode32 = S => {
    let decoded;
    try {
        decoded = B32.decode(S);
    } catch (err) { return; }
    if (!(decoded instanceof Buffer) || decoded.length !== 20) { return; }
    return decoded;
};

var createJWT = function (Env, sessionId, publicKey, cb) {
    JWT.sign({
        // this is a custom JWT field (not a standard) - we include a reference to the session
        // which is used to look up whether it has been revoked.
        ref: sessionId,
        // we specify in the token for what resource the token should be valid (their block's public key)
        sub: Util.escapeKeyCharacters(publicKey),
    }, Env.bearerSecret, {
        // token integrity is ensured with HMAC SHA512 with the server's bearerSecret
        // clients can inspect token parameters, but cannot modify them
        algorithm: 'HS512',
        // if you want it to expire you can set this for an arbitrary number of seconds in the future, but I won't assume that for now
        //expiresIn: (60 * 60 * 24 * 7)),
    }, function (err, token) {
        if (err) { return void cb(err); }
        cb(void 0, token);
    });
};

// This command allows clients to configure TOTP as a second factor protecting
// their login block IFF they:
// 1. provide a sufficiently strong TOTP secret
// 2. are able to produce a valid OTP code for that secret (indicating that their clock is sufficiently close to ours)
// 3. such a login block actually exists
// 4. are able to sign an arbitrary message for the login block's public key
// 5. have not already configured TOTP protection for this account
// (changing to a new secret can be done by disabling and re-enabling TOTP 2FA)
const TOTP_SETUP = Commands.TOTP_SETUP = function (Env, body, cb) {
    const { publicKey, secret, code, contact } = body;

    // the client MUST provide an OTP code of the expected format
    // this doesn't check if it matches the secret and time, just that it's well-formed
    if (!isValidOTP(code)) { return void cb("E_INVALID"); }

    // if they provide an (optional) point of contact as a recovery mechanism then it should be a string.
    // the intent is to allow to specify some side channel for those who inevitably lock themselves out
    // we should be able to use that to validate their identity.
    // I don't want to assume email, but limiting its length to 254 (the maximum email length) seems fair.
    if (contact && (!isString(contact) || contact.length > 254)) { return void cb("INVALID_CONTACT"); }

    // Check that the provided public key is the expected format for a block
    if (!isValidBlockId(publicKey)) {
        return void cb("INVALID_KEY");
    }

    // decode32 checks whether the secret decodes to a sufficiently long buffer
    var decoded = decode32(secret);
    if (!decoded) { return void cb('INVALID_SECRET'); }

    // Reject attempts to setup TOTP if a record of their preferences already exists
    MFA.read(Env, publicKey, function (err) {
        // There **should be** an error here, because anything else
        // means that a record already exists
        // This may need to be adjusted as other methods of MFA are added
        if (!err) { return void cb("EEXISTS"); }

        // if no MFA settings exist then we expect ENOENT
        // anything else indicates a problem and should result in rejection
        if (err.code !== 'ENOENT') { return void cb(err); }
        try {
            // allow for 30s of clock drift in either direction
            // returns an object ({ delta: 0 }) indicating the amount of clock drift
            // if successful, otherwise `null`
            var validated = OTP.totp.verify(code, decoded, {
                window: 1,
            });
            if (!validated) { return void cb("INVALID_OTP"); }
            cb();
        } catch (err2) {
            Env.Log.error('TOTP_SETUP_VERIFICATION_ERROR', {
                error: err2,
            });
            return void cb("INTERNAL_ERROR");
        }
    });
};

// The 'complete' step for TOTP_SETUP will only be called if the client
// passed earlier validation and successfully signed the server's challenge.
// There's still a little bit more to do and it could still fail.
TOTP_SETUP.complete = function (Env, body, cb) {
    // the OTP code should have already been validated
    var { publicKey, secret, contact } = body;

    // the device from which they configure MFA settings
    // is assumed to be safe, so we'll respond with a JWT token
    // the remainder of the setup is successfully completed.
    // Otherwise they would have to reauthenticate.
    // The session id is used as a reference to this particular session.
    const sessionId = Sessions.randomId();
    var token;
    nThen(function (w) {
        // confirm that the block exists
        Block.check(Env, publicKey, w(function (err) {
            if (err) {
                Env.Log.error("TOTP_SETUP_NO_BLOCK", {
                    publicKey,
                });
                w.abort();
                return void cb("NO_BLOCK");
            }
            // otherwise the block exists, continue
        }));
    }).nThen(function (w) {
        // store the data you'll need in the future
        var data = {
            method: 'TOTP', // specify this so it's easier to add other methods later?
            secret: secret, // the 160 bit, base32-encoded secret that is used for OTP validation
            creation: new Date(), // the moment at which the MFA was configured
        };

        if (isString(contact)) {
            // 'contact' is an arbitary (and optional) string for manual recovery from 2FA auth fails
            // it should already be validated
            data.contact = contact;
        }

        // We attempt to store a record of the above preferences
        // if it fails then we abort and inform the client of an error.
        MFA.write(Env, publicKey, JSON.stringify(data), w(function (err) {
            if (err) {
                w.abort();
                Env.Log.error("TOTP_SETUP_STORAGE_FAILURE", {
                    publicKey: publicKey,
                    error: err,
                });
                return void cb('STORAGE_FAILURE');
            }
            // otherwise continue
        }));
    }).nThen(function (w) {
        // generate a bearer token and store it
        createJWT(Env, sessionId, publicKey, w(function (err, _token) {
            if (err) {
// we have already stored the MFA data, which will cause access to the resource to be restricted to the provided TOTP secret.
// we attempt to create a session as a matter of convenience - so if it fails
// that just means they'll be forced to authenticate
                Env.Log.error("TOTP_SETUP_JWT_SIGN_ERROR", {
                    error: err,
                    publicKey: publicKey,
                });
                return void cb('TOKEN_ERROR');
            }
            token = _token;
        }));
    }).nThen(function (w) {
        // store the token
        Sessions.write(Env, publicKey, sessionId, token, w(function (err) {
            if (err) {
                // again, if there's a failure here the user should automatically
                // be forced to reauthenticate because their block is protected
                // but they will not have a valid JWT allowing them to access it
                Env.Log.error("TOTP_SETUP_SESSION_WRITE", {
                    error: err,
                    publicKey: publicKey,
                    sessionId: sessionId,
                });
                w.abort();
                return void cb("SESSION_WRITE_ERROR");
            }
            // else continue
        }));
    }).nThen(function () {
        // respond with the stored token that they can now use to authenticate
        cb(void 0, {
            bearer: token,
        });
    });
};

// This command is somewhat simpler than TOTP_SETUP
// Issue a client a JWT which will allow them to access a login block IFF:
// 1. That login block exists
// 2. That login block is protected by TOTP 2FA
// 3. They can produce a valid OTP for that block's TOTP secret
// 4. They can sign for the block's public key
const validate = Commands.TOTP_VALIDATE = function (Env, body, cb) {
    var { publicKey, code } = body;

    // they must provide a valid OTP code
    if (!isValidOTP(code)) { return void cb('E_INVALID'); }

    // they must provide a valid block public key
    if (!isValidBlockId(publicKey)) { return void cb("INVALID_KEY"); }

    var secret;
    nThen(function (w) {
        // check that there is an MFA configuration for the given account
        MFA.read(Env, publicKey, w(function (err, content) {
            if (err) {
                w.abort();
                Env.Log.error('TOTP_VALIDATE_MFA_READ', {
                    error: err,
                    publicKey: publicKey,
                });
                return void cb('NO_MFA_CONFIGURED');
            }

            var parsed = Util.tryParse(content);

            if (!parsed) {
                w.abort();
                return void cb("INVALID_CONFIGURATION");
            }

            secret = parsed.secret;
        }));
    }).nThen(function () {
        let decoded = decode32(secret);
        if (!decoded) {
            Env.Log.error("TOTP_VALIDATE_INVALID_SECRET", {
                publicKey, // log the public key so the admin can investigate further
                // don't log the problematic secret directly as
                // logs are likely to be pasted in random places
            });
            return void cb("E_INVALID_SECRET");
        }

        // validate the code
        var validated = OTP.totp.verify(code, decoded, {
            window: 1,
        });

        if (!validated) {
            // I won't worry about logging these OTPs as they shouldn't leak any useful information
            Env.Log.error("TOTP_VALIDATE_BAD_OTP", {
                code,
            });
            return void cb("INVALID_OTP");
        }

        // call back to indicate that their request was well-formed and valid
        cb();
    });
};

validate.complete = function (Env, body, cb) {
/*
if they are here then they:

1. have a valid block configured with TOTP-based 2FA
2. were able to provide a valid TOTP for that block's secret
3. were able to sign their messages for the block's public key

So, we should:

1. instanciate a session for them by generating and storing a token for their public key
2. send them the token

*/
    var { publicKey } = body;

    const sessionId = Sessions.randomId();

    var token;
    nThen(function (w) {
        createJWT(Env, sessionId, publicKey, w(function (err, _token) {
            if (err) {
                Env.Log.error("TOTP_VALIDATE_JWT_SIGN_ERROR", {
                    error: err,
                    publicKey: publicKey,
                });
                return void cb("TOKEN_ERROR");
            }
            token = _token;
        }));
    }).nThen(function (w) {
        // store the token
        Sessions.write(Env, publicKey, sessionId, token, w(function (err) {
            if (err) {
                Env.Log.error("TOTP_VALIDATE_SESSION_WRITE", {
                    error: err,
                    publicKey: publicKey,
                    sessionId: sessionId,
                });
                w.abort();
                return void cb("SESSION_WRITE_ERROR");
            }
            // else continue
        }));
    }).nThen(function () {
        cb(void 0, {
            bearer: token,
        });
    });
};

