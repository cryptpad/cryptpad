define([
    '/common/hyperscript.js'
], function (h) {
    const Icons = {};

    const map = {
        "drive-trash-empty": "trash-2",
        "drive-search": "search",
        "add": "plus",
        "features": "info",
        "documentation": "book-open-text",
        "user-profile": "circle-user-round",
        "language": "languages",
        "link": "link",
        "donate": "hand-coins",
        "login": "log-in",
        "register": "user",
        "chevron-left": "chevron-left"
    };

    Icons.get = (name, attrs = {}) => {
        if (!map[name]) {
            throw new Error(`Invalid icon: ${name}`);
        }
        attrs['data-lucide'] = map[name];
        attrs['aria-hidden'] = "true";

        return h('i', attrs);
    };

    return Icons;
});

