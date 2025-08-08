define([
    '/common/hyperscript.js'
], function (h) {
    const Icons = {};

    const map = {
        "trash-empty": "trash", // XXX change name
        "trash-full": "trash-2", // XXX
        "drive-search": "search",
        "add": "plus",
        "features": "info", // XXX
        "documentation": "book-open-text",
        "user-profile": "circle-user-round",
        "language": "languages",
        "link": "link",
        "donate": "hand-coins",
        "login": "log-in",
        "logout": "log-out",
        "logout-everywhere": "unplug",
        "register-homepage": "user", // XXX
        "register": "user-round-plus",
        "chevron-left": "chevron-left",
        "chevron-right": "chevron-right",
        "chevron-down": "chevron-down",
        "chevron-up": "chevron-up",
        "check": "check",
        "drive": "hard-drive",
        "grid": "layout-grid",
        "list": "list",
        "filter": "list-filter-plus",
        "folder-open": "folder-open",
        "drive-recent": "clock",
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
        "close": "x",
        "drive-folder": "folder",
        "drive-shared-folder": "folder-git-2", // XXX
        "drive-upload-file": "file-up",
        "drive-upload-folder": "folder-up",
        "drive-file": "file",
        "teams": "users-round", // XXX change name, multiple usages
        "calendar": "calendar-days",
        "calendar-inactive": "calendar",
        "calendar-add": "calendar-plus-2",
        "contacts": "contact-round",
        "contact-request": "book-user",
        "settings": "settings",
        "administration": "monitor-cog",
        "support": "life-buoy",
        "support-mailbox": "ambulance", // XXX
        "homepage": "house",
        "file-template": "file-type", // XXX
        "file-pad": "file-text",
        "sort-asc": "chevron-down",
        "sort-desc": "chevron-up",
        "access": "lock-open",
        "rename": "pen-line",
        "color-palette": "palette",
        "customize": "brush",
        "upload": "hard-drive-upload",
        "download": "hard-drive-download",
        "destroy": "shredder",
        "read-only": "pen-off", // XXX
        "preview": "eye",
        "tag": "hash",
        "copy": "files",
        "default-error": "circle-x",
        "owner": "id-card-lanyard",
        "password-reveal": "eye",
        "password-hide": "eye-closed",
        "arrow-left": "arrow-left",
        "arrow-up": "arrow-up",
        "code": "code-xml",
        "code-file": "file-code",
        "qr-code": "qr-code",
        "lock": "lock",
        "help": "info",
        "expand-menu": "chevron-right",
        "location": "navigation",
        "collapse": "square-minus",
        "expand": "square-plus",
        "expire": "clock-alert",
        "restricted": "ban",
        "renamed": "flag", // XXX
        "restore": "restore", // XXX
        "all": "menu",
        "history": "archive",
        "chat": "message-circle-more",
        "mail": "mail", // XXX
        "upload-avatar": "image-up",
        "edit": "pencil",
        "calendar-repeat": "calendar-sync",
        "calendar-reminder": "bell-ring",
        "calendar-location": "map-pin",
        "calendar-description": "align-justify",
        "save": "save",
        "loading": "loader", // XXX
        "notification" : "bell",
        "cursor": "text-cursor",
        "broadcast": "radio",
        "apps-settings": "wrench",
        "user-directory": "id-card",
        "database": "database",
        "stats": "chart-line",
        "performance": "heart-pulse",
        "network": "network",
        "select": "move",
        "undo": "undo",
        "redo": "redo",
        "type": "type",
        "clear-canvas": "brush-cleaning",
    };

    Icons.get = (name, attrs = {}) => {
        // if (!map[name]) {
        //     throw new Error(`Invalid icon: ${name}`);
        // }
        const iconName = map[name] ? name : 'default-error';
        attrs['data-lucide'] = map[iconName];
        attrs['aria-hidden'] = "true";

        return h('i', attrs);
    };

    return Icons;
});

