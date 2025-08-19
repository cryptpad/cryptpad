define([
    '/common/hyperscript.js'
], function (h) {
    const Icons = {};

    const map = {
        // Drive
        "homepage": "house",
        "drive": "hard-drive",
        "drive-search": "search",
        "drive-shared-folder": "folder-git-2", // XXX change icon
        "drive-upload-file": "file-up",
        "drive-upload-folder": "folder-up",
        "file": "file",
        "drive-recent": "clock",
        "drive-owned-document": "id-card",
        "drive-password-document": "file-lock",
        "folder": "folder",
        "folder-open": "folder-open",
        "folder-nocolor": "folder-minus",
        "folder-check": "folder-check",
        "file-template": "file-type", // XXX
        "file-pad": "file-text",
        "grid": "layout-grid",
        "list": "list",
        "owner": "id-card-lanyard",
        // Teams
        "promote": "chevrons-up",
        "downgrade": "chevrons-down",
        // CryptPad apps - icon to be changed
        // Pad
        "pad": "file",
        "pad-settings": "file-cog",
        "expand-pad": "maximize-2",
        "shrink-pad": "minimize-2",
        "slide": "file",
        "poll": "file",
        // Form
        "form": "file",
        "form-text": "minus",
        "form-paragraph": "text",
        "form-grid-radio": "list-todo", // XXX
        "form-grid-check": "list-todo",
        "form-list-check": "list-todo",
        "form-list-radio": "list-todo",
        "form-list-ordered": "list-ordered",
        "form-poll": "vote",
        "form-page-break": "chevrons-left-right-ellipsis",
        "form-conditional": "workflow",
        "form-poll-maybe": "circle-slash",
        "form-poll-switch": "arrow-right-left",
        "whiteboard": "file",
        "diagram": "file",
        "todo": "file",
        // Kanban
        "kanban": "file",
        "kanban-tags": "tags",
        "kanban-minimize": "minus",
        "kanban-maximize": "menu",
        "touch-mode": "hand",
        "kanban-add-top": "between-horizontal-end", // TEMP, TO BE UPDATED
        "kanban-add-bottom": "between-horizontal-start",
        // Doc
        "doc": "file",
        // Presentation
        "presentation": "file",
        // Actions
        "add": "plus",
        "check": "check",
        "filter": "list-filter-plus",
        "share": "share-2",
        "download": "hard-drive-download",
        "destroy": "shredder",
        "donate": "hand-coins",
        "send": "send",
        "cloud-upload": "cloud-upload",
        "print": "printer",
        "play": "circle-play",
        "grip-move": "grip-horizontal",
        "grip-move-vertical": "grip-vertical",
        "refresh": "refresh-ccw",
        "select": "move",
        // General
        "trash-empty": "trash", // XXX change name
        "trash-full": "trash-2", // XXX
        "features": "info", // XXX
        "documentation": "book-open-text",
        "user-profile": "circle-user-round",
        "language": "languages",
        "link": "link",
        "external-link": "external-link",
        "chevron-left": "chevron-left",
        "chevron-right": "chevron-right",
        "chevron-down": "chevron-down",
        "chevron-up": "chevron-up",
        "copy": "files",
        "close": "x",
        "teams": "users-round", // XXX change name, multiple usages
        "square": "square",
        "timer": "hourglass",
        "map-pin": "map-pin",
        "checked-box": "square-check",
        "unchecked-box": "square",
        "table": "table",
        "inbox": "inbox",
        "server": "server",
        "minus": "minus",
        "alert": "triangle-alert",
        "sort-amount-desc": "arrow-down-wide-narrow",
        "sheet": "sheet", // change name
        "announcement": "megaphone",
        "reply": "message-square-reply",
        "comment": "message-square",
        "file-image": "file-image",
        "snapshot": "camera",
        "certificate": "shield-check",
        "secret-user": "venetian-mask",
        "circle-question": "circle-question-mark",
        "list-ol": "list-ordered",
        "list-todo": "list-todo",
        "ellipsis-vertical": "ellipsis-vertical",
        "ellipsis-horizontal": 'ellipsis',
        "toolbar-insert": "image-plus",
        // Login + Register
        "login": "log-in",
        "logout": "log-out",
        "logout-everywhere": "unplug",
        "register": "user-round-plus",
        "register-homepage": "user", // XXX change name
        // History
        "history": "history",
        "history-prev": 'arrow-left',
        "history-next": "arrow-right",
        "history-fast-next": "arrow-right-to-line",
        "history-fast-prev": "arrow-left-to-line",
        "history-timeline-position": "flag-triangle-right",
        "history-restore": "archive-restore",
        "remove-history": "eraser",
        // Calendar
        "calendar": "calendar-days",
        "calendar-inactive": "calendar",
        "calendar-add": "calendar-plus-2",
        "calendar-repeat": "calendar-sync",
        "calendar-reminder": "bell-ring",
        "calendar-location": "map-pin",
        "calendar-description": "align-justify",
        // Contacts
        "contacts": "contact-round",
        "contact-request": "book-user", // XXX change name
        "unfriend": "user-round-x",
        "add-friend": "user-round-plus",
        "sort-asc": "chevron-down",
        "sort-desc": "chevron-up",
        "access": "lock-open",
        "rename": "pen-line",
        "color-palette": "palette",
        "customize": "brush",
        "upload": "hard-drive-upload",
        "read-only": "pen-off", // XXX
        "preview": "eye",
        "tag": "hash",
        "default-error": "circle-x",
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
        "chat": "message-circle-more",
        "mail": "mail", // XXX
        "upload-avatar": "image-up",
        "edit": "pencil",
        "save": "save",
        "loading": "loader", // XXX
        "notification" : "bell",
        "mute": "bell-off",
        "cursor": "text-cursor",
        // Settings + Admin
        "settings": "settings",
        "administration": "monitor-cog",
        "support": "life-buoy",
        "support-mailbox": "ambulance", // XXX
        "broadcast": "radio",
        "apps-settings": "wrench", // XXX multiple usages
        "support-ticket": "ticket",
        "user-directory": "id-card",
        "database": "database",
        "stats": "chart-line",
        "performance": "heart-pulse",
        "network": "network",
        "survey": "graduation-cap",
        // Markdown toolbar
        "undo": "undo",
        "redo": "redo",
        "type": "type",
        "clear-canvas": "brush-cleaning",
        "key": "key",
        "bold": "bold",
        "italic": "italic",
        "heading": "heading",
        "strikethrough": "strikethrough",
        "quote": "quote",
        "toc": "newspaper",
        "embed": "image-plus",
        // Badges
        "badge-admin": "star",
        "badge-moderator": "life-buoy",
        "badge-premium": "ticket-check",
        "badge-error": "circle-alert",
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

