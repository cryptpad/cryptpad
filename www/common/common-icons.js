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
        "register-homepage": "user",
        "register": "user-round-plus",
        "chevron-left": "chevron-left",
        "chevron-right": "chevron-right",
        "chevron-down": "chevron-down",
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
        "drive-shared-folder-open": "folder-open-dot", // XXX
        "drive-upload-file": "file-up",
        "drive-upload-folder": "folder-up",
        "drive-file": "file",
        "teams": "users-round",
        "calendar": "calendar-days",
        "calendar-inactive": "calendar",
        "calendar-add": "calendar-plus-2",
        "contacts": "contact-round",
        "contact-request": "book-user",
        "settings": "settings",
        "administration": "monitor-cog",
        "support": "life-buoy",
        "support-mailbox": "ambulance",
        "homepage": "house",
        "file-template": "file-type", // XXX
        "file-pad": "file-text",
        "sort-asc": "chevron-down",
        "sort-desc": "chevron-up",
        "access": "lock-open",
        "rename": "pen-line",
        "color-palette": "palette",
        "download": "hard-drive-download",
        "destroy": "shredder",
        "read-only": "pen-off",
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

