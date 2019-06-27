var Meta = module.exports;

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
    if (!Array.isArray(args)) {
        throw new Error('METADATA_INVALID_OWNERS');
    }
    if (!Array.isArray(meta.owners)) {
        throw new Error("METADATA_NONSENSE_OWNERS");
    }

    args.forEach(function (owner) {
        if (meta.owners.indexOf(owner) >= 0) { return; }
        meta.owners.push(owner);
    });
};

// ["RM_OWNERS", ["CrufexqXcY-z+eKJlEbNELVy5Sb7E-EAAEFI8GnEtZ0="], 1561623439989]
commands.RM_OWNERS = function (meta, args) {
    if (!Array.isArray(args)) {
        throw new Error('METADATA_INVALID_OWNERS');
    }
    if (!Array.isArray(meta.owners)) {
        throw new Error("METADATA_NONSENSE_OWNERS");
    }

    args.forEach(function (owner) {
        var index = meta.owners.indexOf(owner);
        meta.owners.splice(index, 1);
    });
};

commands.UPDATE_EXPIRATION = function () {

};

var handleCommand = function (meta, line) {
    var command = line[0];
    var args = line[1];
    //var time = line[2];

    if (typeof(commands[command]) !== 'function') {
        throw new Error("METADATA_UNSUPPORTED_COMMAND");
    }

    commands[command](meta, args);
};

Meta.createLineHandler = function (ref, errorHandler) {
    ref.meta = {};

    errorHandler = errorHandler;

    return function (err, line, index) {
        if (err) {
            return void errorHandler('METADATA_HANDLER_LINE_ERR', {
                error: err,
                index: index,
                line: JSON.stringify(line),
            });
        }

        if (Array.isArray(line)) {
            try {
                handleCommand(ref.meta, line);
            } catch (err) {
                errorHandler("METADATA_COMMAND_ERR", {
                    error: err.stack,
                    line: line,
                });
            }
            return;
        }

        if (index === 0 && typeof(line) === 'object') {
            // special case!
            ref.meta = line;
            return;
        }

        errorHandler("METADATA_HANDLER_WEIRDLINE", {
            line: line,
            index: index
        });
    };
};
