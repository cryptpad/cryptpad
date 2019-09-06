var Meta = module.exports;

var deduplicate = require("./deduplicate");

/*  Metadata fields:

    * channel <STRING>
    * validateKey <STRING>
    * owners <ARRAY>
      * ADD_OWNERS
      * RM_OWNERS
    * expire <NUMBER>

*/

var commands = {};

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
        if (meta.owners.indexOf(owner) >= 0) { return; }
        meta.owners.push(owner);
        changed = true;
    });

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
    meta.owners = deduplicate(args);
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

commands.UPDATE_EXPIRATION = function () {
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
Meta.commands = Object.keys(commands);

Meta.createLineHandler = function (ref, errorHandler) {
    ref.meta = {};
    ref.index = 0;

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

        if (Array.isArray(line)) {
            try {
                handleCommand(ref.meta, line);
                ref.index++;
            } catch (err2) {
                errorHandler("METADATA_COMMAND_ERR", {
                    error: err2.stack,
                    line: line,
                });
            }
            return;
        }

        if (ref.index === 0 && typeof(line) === 'object') {
            ref.index++;
            // special case!
            ref.meta = line;
            return;
        }

        errorHandler("METADATA_HANDLER_WEIRDLINE", {
            line: line,
            index: ref.index++,
        });
    };
};

