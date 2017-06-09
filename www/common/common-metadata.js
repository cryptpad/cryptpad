define(function () {
    var module = {};

    module.create = function (UserList, Title, cfg) {
        var exp = {};

        exp.update = function (shjson) {
            // Extract the user list (metadata) from the hyperjson
            var json = (!shjson || typeof shjson !== "string") ? "" : JSON.parse(shjson);
            var titleUpdated = false;
            var metadata;
            if (Array.isArray(json)) {
                metadata = json[3] && json[3].metadata;
            } else {
                metadata = json.metadata;
            }
            if (typeof metadata === "object") {
                if (metadata.users) {
                    var userData = metadata.users;
                    // Update the local user data
                    UserList.addToUserData(userData);
                }
                if (metadata.defaultTitle) {
                    Title.updateDefaultTitle(metadata.defaultTitle);
                }
                if (typeof metadata.title !== "undefined") {
                    Title.updateTitle(metadata.title || Title.defaultTitle);
                    titleUpdated = true;
                }
                if (metadata.slideOptions && cfg.slideOptions) {
                    cfg.slideOptions(metadata.slideOptions);
                }
                if (metadata.color && cfg.slideColors) {
                    cfg.slideColors(metadata.color, metadata.backColor);
                }
                if (typeof(metadata.palette) !== 'undefined' && cfg.updatePalette) {
                    cfg.updatePalette(metadata.palette);
                }
            }
            if (!titleUpdated) {
                Title.updateTitle(Title.defaultTitle);
            }
        };

        return exp;
    };

    return module;
});


