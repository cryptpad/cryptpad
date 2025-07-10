define([
    '/common/hyperscript.js'
], function (h) {
    const Icons = {};

    const map = {
        "drive-trash": "trash-2",
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
        "chevron-left": "chevron-left",
        "check": "check",
        "hdd": "hard-drive",
        "grid": "layout-grid",
        "list": "list",
        "filter": "list-filter-plus",
        "folder-open": "folder-open",
        "drive-recent": "clock",
        "drive-expand": "square-plus",
        "drive-owned-document": "id-card",
        "share": "share-2",
        "drive-password-document": "file-lock",
        "ellipsis-vertical": "ellipsis-vertical",
        "ellipsis-horizontal": 'ellipsis',
        "toolbar-insert": "file-image",
        "history-prev": 'arrow-left',
        "history-next": "arrow-right",
        "history-fast-next": "arrow-right-to-line",
        "history-fast-prev": "arrow-left-to-line",
        "history-timeline-position": "flag-triangle-right",
        "history-restore": "archive-restore",
        "close": "x"
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

