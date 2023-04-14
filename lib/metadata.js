var Meta = module.exports;
var Core = require("./commands/core");
const Revocable = require("./revocable");

var deduplicate = require("./common-util").deduplicateString;

/*  Metadata fields and the commands that can modify them

we assume that these commands can only be performed
by owners or in some cases pending owners. Thus
the owners field is guaranteed to exist.

    * channel <STRING>
    * validateKey <STRING>
    * owners <ARRAY>
      * ADD_OWNERS
      * RM_OWNERS
      * RESET_OWNERS
    * pending_owners <ARRAY>
      * ADD_PENDING_OWNERS
      * RM_PENDING_OWNERS
    * expire <NUMBER>
      * UPDATE_EXPIRATION (NOT_IMPLEMENTED)
    * restricted <BOOLEAN>
      * RESTRICT_ACCESS
    * allowed <ARRAY>
      * ADD_ALLOWED
      * RM_ALLOWED
      * RESET_ALLOWED
      * ADD_OWNERS
      * RESET_OWNERS
    * mailbox <STRING|MAP>
      * ADD_MAILBOX
      * RM_MAILBOX
    * deleteLines <BOOLEAN>
      * ALLOW_LINE_DELETION

Revocable channels
    * access <MAP>
      * UPDATE_ACCESS (add, update, revoke)
    * moderatorsLog <ARRAY>
      * UPDATE_ACCESS (when udpdating moderator rights)
      * ADD_MODLOG_ENTRY

*/

var commands = {};
var revocationCommands = {};

var isValidPublicKey = Core.isValidPublicKey;

// isValidPublicKey is a better indication of what the above function does
// I'm preserving this function name in case we ever want to expand its
// criteria at a later time...
var isValidOwner = isValidPublicKey;

// ["RESTRICT_ACCESS", [true], 1561623438989]
// ["RESTRICT_ACCESS", [false], 1561623438989]
commands.RESTRICT_ACCESS = function (meta, args) {
    if (!Array.isArray(args) || typeof(args[0]) !== 'boolean') {
        throw new Error('INVALID_STATE');
    }

    var bool = args[0];

    // reject the proposed command if there is no change in state
    if (meta.restricted === bool) { return false; }

    // apply the new state
    meta.restricted = args[0];

    // if you're disabling access restrictions then you can assume
    // then there is nothing more to do. Leave the existing list as-is
    if (!bool) { return true; }

    // you're all set if an allow list already exists
    if (Array.isArray(meta.allowed)) { return true; }

    // otherwise define it
    meta.allowed = [];

    return true;
};

// ["ALLOW_LINE_DELETION", [true], 1561623438989]
// ["ALLOW_LINE_DELETION", [false], 1561623438989]
commands.ALLOW_LINE_DELETION = function (meta, args) {
    if (!Array.isArray(args) || typeof(args[0]) !== 'boolean') {
        throw new Error('INVALID_STATE');
    }

    var bool = args[0];

    // reject the proposed command if there is no change in state
    if (meta.deleteLines === bool) { return false; }

    // apply the new state
    meta.deleteLines = args[0];

    return true;
};

// ["ADD_ALLOWED", ["7eEqelGso3EBr5jHlei6av4r9w2B9XZiGGwA1EgZ-5I=", ...], 1561623438989]
commands.ADD_ALLOWED = function (meta, args) {
    if (!Array.isArray(args)) {
        throw new Error("INVALID_ARGS");
    }

    var allowed = meta.allowed || [];

    var changed = false;
    args.forEach(function (arg) {
        // don't add invalid public keys
        if (!isValidPublicKey(arg)) { return; }
        // don't add owners to the allow list
        if (meta.owners.indexOf(arg) >= 0) { return; }
        // don't duplicate entries in the allow list
        if (allowed.indexOf(arg) >= 0) { return; }
        allowed.push(arg);
        changed = true;
    });

    if (changed) {
        meta.allowed = meta.allowed || allowed;
    }

    return changed;
};

// ["RM_ALLOWED", ["7eEqelGso3EBr5jHlei6av4r9w2B9XZiGGwA1EgZ-5I=", ...], 1561623438989]
commands.RM_ALLOWED = function (meta, args) {
    if (!Array.isArray(args)) {
        throw new Error("INVALID_ARGS");
    }

    // there may not be anything to remove
    if (!meta.allowed) { return false; }

    var changed = false;
    args.forEach(function (arg) {
        var index = meta.allowed.indexOf(arg);
        if (index < 0) { return; }
        meta.allowed.splice(index, 1);
        changed = true;
    });

    return changed;
};

var arrayHasChanged = function (A, B) {
    var changed;
    A.some(function (a) {
        if (B.indexOf(a) < 0) { return (changed = true); }
    });
    if (changed) { return true; }
    B.some(function (b) {
        if (A.indexOf(b) < 0) { return (changed = true); }
    });
    return changed;
};

var filterInPlace = function (A, f) {
    for (var i = A.length - 1; i >= 0; i--) {
        if (f(A[i], i, A)) { A.splice(i, 1); }
    }
};

// ["RESET_ALLOWED", ["7eEqelGso3EBr5jHlei6av4r9w2B9XZiGGwA1EgZ-5I=", ...], 1561623438989]
commands.RESET_ALLOWED = function (meta, args) {
    if (!Array.isArray(args)) { throw new Error("INVALID_ARGS"); }

    var updated = args.filter(function (arg) {
        // don't allow invalid public keys
        if (!isValidPublicKey(arg)) { return false; }
        // don't ever add owners to the allow list
        if (meta.owners.indexOf(arg)) { return false; }
        return true;
    });

    // this is strictly an optimization...
    // a change in length is a clear indicator of a functional change
    if (meta.allowed && meta.allowed.length !== updated.length) {
        meta.allowed = updated;
        return true;
    }

    // otherwise we must check that the arrays contain distinct elements
    // if there is no functional change, then return false
    if (!arrayHasChanged(meta.allowed, updated)) { return false; }

    // otherwise overwrite the in-memory data and indicate that there was a change
    meta.allowed = updated;
    return true;
};

// ["ADD_OWNERS", ["7eEqelGso3EBr5jHlei6av4r9w2B9XZiGGwA1EgZ-5I="], 1561623438989]
commands.ADD_OWNERS = function (meta, args) {
    // bail out if args isn't an array
    if (!Array.isArray(args)) {
        throw new Error('METADATA_INVALID_OWNERS');
    }

    // you shouldn't be able to get here if there are no owners
    // because only an owner should be able to change the owners
    if (!Array.isArray(meta.owners)) {
        throw new Error("METADATA_NONSENSE_OWNERS");
    }

    var changed = false;
    args.forEach(function (owner) {
        if (!isValidOwner(owner)) { return; }
        if (meta.owners.indexOf(owner) >= 0) { return; }
        meta.owners.push(owner);
        changed = true;
    });

    if (changed && Array.isArray(meta.allowed)) {
        // make sure owners are not included in the allow list
        filterInPlace(meta.allowed, function (member) {
            return meta.owners.indexOf(member) !== -1;
        });
    }

    return changed;
};

// ["RM_OWNERS", ["CrufexqXcY-z+eKJlEbNELVy5Sb7E-EAAEFI8GnEtZ0="], 1561623439989]
commands.RM_OWNERS = function (meta, args) {
    // what are you doing if you don't have owners to remove?
    if (!Array.isArray(args)) {
        throw new Error('METADATA_INVALID_OWNERS');
    }
    // if there aren't any owners to start, this is also pointless
    if (!Array.isArray(meta.owners)) {
        throw new Error("METADATA_NONSENSE_OWNERS");
    }

    var changed = false;
    // remove owners one by one
    // we assume there are no duplicates
    args.forEach(function (owner) {
        var index = meta.owners.indexOf(owner);
        if (index < 0) { return; }
        if (meta.mailbox) {
            if (typeof(meta.mailbox) === "string") {
                delete meta.mailbox;
            } else {
                delete meta.mailbox[owner];
            }
        }
        meta.owners.splice(index, 1);
        changed = true;
    });

    if (meta.owners.length === 0 && meta.restricted) {
        meta.restricted = false;
    }

    return changed;
};

// ["ADD_PENDING_OWNERS", ["7eEqelGso3EBr5jHlei6av4r9w2B9XZiGGwA1EgZ-5I="], 1561623438989]
commands.ADD_PENDING_OWNERS = function (meta, args) {
    // bail out if args isn't an array
    if (!Array.isArray(args)) {
        throw new Error('METADATA_INVALID_PENDING_OWNERS');
    }

    // you shouldn't be able to get here if there are no owners
    // because only an owner should be able to change the owners
    if (meta.pending_owners && !Array.isArray(meta.pending_owners)) {
        throw new Error("METADATA_NONSENSE_PENDING_OWNERS");
    }

    var changed = false;
    // Add pending_owners array if it doesn't exist
    if (!meta.pending_owners) {
        meta.pending_owners = deduplicate(args);
        return true;
    }
    // or fill it
    args.forEach(function (owner) {
        if (!isValidOwner(owner)) { return; }
        if (meta.pending_owners.indexOf(owner) >= 0) { return; }
        meta.pending_owners.push(owner);
        changed = true;
    });

    return changed;
};

// ["RM_PENDING_OWNERS", ["CrufexqXcY-z+eKJlEbNELVy5Sb7E-EAAEFI8GnEtZ0="], 1561623439989]
commands.RM_PENDING_OWNERS = function (meta, args) {
    // what are you doing if you don't have owners to remove?
    if (!Array.isArray(args)) {
        throw new Error('METADATA_INVALID_PENDING_OWNERS');
    }
    // if there aren't any owners to start, this is also pointless
    if (!Array.isArray(meta.pending_owners)) {
        throw new Error("METADATA_NONSENSE_PENDING_OWNERS");
    }

    var changed = false;
    // remove owners one by one
    // we assume there are no duplicates
    args.forEach(function (owner) {
        var index = meta.pending_owners.indexOf(owner);
        if (index < 0) { return; }
        meta.pending_owners.splice(index, 1);
        changed = true;
    });

    return changed;
};

// ["RESET_OWNERS", ["7eEqelGso3EBr5jHlei6av4r9w2B9XZiGGwA1EgZ-5I="], 1561623439989]
commands.RESET_OWNERS = function (meta, args) {
    // expect a new array, even if it's empty
    if (!Array.isArray(args)) {
        throw new Error('METADATA_INVALID_OWNERS');
    }
    // assume there are owners to start
    if (!Array.isArray(meta.owners)) {
        throw new Error("METADATA_NONSENSE_OWNERS");
    }

    // overwrite the existing owners with the new one
    meta.owners = deduplicate(args.filter(isValidOwner));

    if (Array.isArray(meta.allowed)) {
        // make sure owners are not included in the allow list
        filterInPlace(meta.allowed, function (member) {
            return meta.owners.indexOf(member) !== -1;
        });
    }

    if (meta.owners.length === 0 && meta.restricted) {
        meta.restricted = false;
    }

    return true;
};

// ["ADD_MAILBOX", {"7eEqelGso3EBr5jHlei6av4r9w2B9XZiGGwA1EgZ-5I=": mailbox, ...}, 1561623439989]
commands.ADD_MAILBOX = function (meta, args) {
    // expect a new array, even if it's empty
    if (!args || typeof(args) !== "object") {
        throw new Error('METADATA_INVALID_MAILBOX');
    }
    // assume there are owners to start
    if (!Array.isArray(meta.owners)) {
        throw new Error("METADATA_NONSENSE_OWNERS");
    }

    var changed = false;

    // For each mailbox we try to add, check if the associated edPublic is an owner
    // If they are, add or replace the mailbox
    Object.keys(args).forEach(function (edPublic) {
        if (meta.owners.indexOf(edPublic) === -1) { return; }

        if (typeof(meta.mailbox) === "string") {
            var str = meta.mailbox;
            meta.mailbox = {};
            meta.mailbox[meta.owners[0]] = str;
        }

        // Make sure mailbox is defined
        if (!meta.mailbox) { meta.mailbox = {}; }

        meta.mailbox[edPublic] = args[edPublic];
        changed = true;
    });

    return changed;
};

commands.RM_MAILBOX = function (meta, args) {
    if (!Array.isArray(args)) { throw new Error("INVALID_ARGS"); }
    if (!meta.mailbox || typeof(meta.mailbox) === 'undefined') {
        return false;
    }
    if (typeof(meta.mailbox) === 'string' && args.length === 0) {
        delete meta.mailbox;
        return true;
    }

    var changed = false;
    args.forEach(function (arg) {
        if (meta.mailbox[arg] === 'undefined') { return; }
        delete meta.mailbox[arg];
        changed = true;
    });
    return changed;
};

commands.UPDATE_EXPIRATION = function () {
    throw new Error("E_NOT_IMPLEMENTED");
};


// Revocation

/*
NOTE: requires signature when adding/removing moderator
["UPDATE_ACCESS", {
    user: "7eEqelGso3EBr5jHlei6av4r9w2B9XZiGGwA1EgZ-5I=",
    access: {rights, etc.},
    signature: signature
}, 1561623439989]
*/
revocationCommands.UPDATE_ACCESS = function (meta, args, myKey) {
    if (!args || typeof(args) !== "object") {
        throw new Error('METADATA_INVALID_ACCESS');
    }

    // Check revocable pad state
    const access = meta.access;
    const log = meta.moderatorsLog;
    if (!access || !Array.isArray(log) || !log.length) { throw new Error("E_INVALID_CHAN_VERSION"); }
    const old = JSON.stringify(access);

    const myAccess = access[myKey];
    if (!myAccess || !myAccess.rights) { throw new Error("E_FORBIDDEN"); }
    const moderator = Revocable.isModerator(myAccess);

    // Make sure you're allowed to applied this change
    const user = args.user;
    const signature = args.signature;
    const newValue = args.access;
    const oldValue = access[user];

    const forbidden = Revocable.isAllowedAccessUpdate(access, myKey, oldValue, newValue);

    if (moderator && forbidden) { throw new Error('INVALID_DATA'); }
    if (forbidden) { throw new Error('E_FORBIDDEN'); }

    // Allowed: Update moderators log if applicable
    const wasModerator = Revocable.isModerator(oldValue);
    const isModerator = Revocable.isModerator(newValue);
    let newLog;
    if (wasModerator && !isModerator) {
        newLog = Revocable.removeLog(user, Revocable.hashMsg(log[log.length - 1]));
    } else if (!wasModerator && isModerator) {
        newLog = Revocable.addLog(user, Revocable.hashMsg(log[log.length - 1]));
    }
    if (newLog) {
        const check = Revocable.checkLog(newLog, myKey, signature);
        if (!check) { throw new Error('E_SIGNATURE_ERROR'); }
        Revocable.addSignatureLog(newLog, myKey, signature);
        log.push(newLog);
    }

    // Update metadata.access map
    if (!newValue) { // Revoke
        delete access[user];
    } else if (!oldValue) { // Create
        newValue.from = myKey;
        access[user] = newValue;
        return true;
    } else { // Update
        oldValue.rights = newValue.rights;
        oldValue.from = myKey; // XXX to decide: when updating an access, put it under your tree
    }

    return old !== JSON.stringify(access);
};
revocationCommands.ROTATE_KEYS = function (meta, args, myKey) {
    const access = meta.access;
    const log = meta.moderatorsLog;
    if (!access || !Array.isArray(log) || !log.length) { throw new Error("E_INVALID_CHAN_VERSION"); }

    const myAccess = access[myKey];
    if (!myAccess || !myAccess.rights) { throw new Error("E_FORBIDDEN"); }
    const moderator = Revocable.isModerator(myAccess);

    if (!moderator) { throw new Error("E_FORBIDDEN"); }

    if (!args || !args.notes || !args.hash || !args.uid || !args.validateKey
                || !args.signature) { throw new Error("E_MISSING_ARGS"); }

    // Make sure all "access" values have updated data
    const abort = Object.keys(access).some(function (key) {
        return !args.notes[key] || !args.notes[key].mailbox || !args.notes[key].notes;
    });
    if (abort) { throw new Error('E_MISSING_DATA'); }

    // Add ROTATE message to moderatorsLog
    const prev = log[log.length - 1];
    const msg = Revocable.rotateLog(args.hash, args.validateKey, args.uid, Revocable.hashMsg(prev));
    const check = Revocable.checkLog(msg, myKey, args.signature);
    if (!check) { throw new Error('E_SIGNATURE_ERROR'); }
    Revocable.addSignatureLog(msg, myKey, args.signature);
    log.push(msg);

    // Update encrypted data in access (mailbox and notes)
    Object.keys(access).forEach(function (key) {
        const update = args.notes[key]; // we've already checked that it exists
        access[key].mailbox = update.mailbox;
        access[key].notes = update.notes;
    });

    // Update validateKey
    meta.validateKey = args.validateKey;

    return true;
};
revocationCommands.ADD_MODLOG_ENTRY = function (meta, args, user) {
    throw new Error("E_NOT_IMPLEMENTED");
};

var handleCommand = Meta.handleCommand = function (meta, line) {
    var command = line[0];
    var args = line[1];
    //var time = line[2];

    if (typeof(commands[command]) !== 'function') {
        throw new Error("METADATA_UNSUPPORTED_COMMAND");
    }

    return commands[command](meta, args);
};
var handleRevocationCommand = Meta.handleRevocationCommand = function (meta, line) {
    var command = line[0];
    var args = line[1];
    var key = line[2];
    //var time = line[2];

    if (typeof(revocationCommands[command]) !== 'function') {
        throw new Error("METADATA_UNSUPPORTED_COMMAND");
    }

    return revocationCommands[command](meta, args, key);
};
Meta.commands = Object.keys(commands);
Meta.revocationCommands = Object.keys(revocationCommands);

Meta.createLineHandler = function (ref, errorHandler) {
    ref.meta = {};
    ref.index = 0;
    ref.logged = {};
    var overwritten = false;

    return function (err, line) {
        if (err) {
            // it's not abnormal that metadata exists without a corresponding log
            // so ENOENT is fine
            if (ref.index === 0 && err.code === 'ENOENT') { return; }
            // any other errors are abnormal
            return void errorHandler('METADATA_HANDLER_LINE_ERR', {
                error: err,
                index: ref.index,
                line: JSON.stringify(line),
            });
        }

        // the case above is special, everything else should increment the index
        var index = ref.index++;
        if (typeof(line) === 'undefined') { return; }


        if (Array.isArray(line)) {
            try {
                var command = line[0];
                if (Meta.commands.includes(commands)) {
                    handleCommand(ref.meta, line);
                } else {
                    handleRevocationCommand(ref.meta, line);
                }
            } catch (err2) {
                var code = err2.message;
                if (ref.logged[code]) { return; }

                ref.logged[code] = true;
                errorHandler("METADATA_COMMAND_ERR", {
                    error: err2.stack,
                    line: line,
                });
            }
            return;
        }

        // the first line of a channel is processed before the dedicated metadata log.
        // it can contain a map, in which case it should be used as the initial state.
        // it's possible that a trim-history command was interrupted, in which case
        // this first message might exist in parallel with the more recent metadata log
        // which will contain the computed state of the previous metadata log
        // which has since been archived.
        // Thus, accept both the first and second lines you process as valid initial state
        // preferring the second if it exists
        if (index < 2 && line && typeof(line) === 'object') {
            if (overwritten) { return; } // hack to avoid overwriting metadata a second time
            overwritten = true;
            // special case!
            ref.meta = line;
            return;
        }

        errorHandler("METADATA_HANDLER_WEIRDLINE", {
            line: line,
            index: index,
        });
    };
};

