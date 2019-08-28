define([
    '/common/outer/async-store.js'
], function (AStore) {

    var create = function () {
        var Store = AStore.create();

        var Rpc = {};

        var queries = Rpc.queries = {
            // Ready
            CONNECT: Store.init,
            DISCONNECT: Store.disconnect,
            CREATE_README: Store.createReadme,
            MIGRATE_ANON_DRIVE: Store.migrateAnonDrive,
            // RPC
            INIT_RPC: Store.initRpc,
            UPDATE_PIN_LIMIT: Store.updatePinLimit,
            GET_PIN_LIMIT: Store.getPinLimit,
            CLEAR_OWNED_CHANNEL: Store.clearOwnedChannel,
            REMOVE_OWNED_CHANNEL: Store.removeOwnedChannel,
            UPLOAD_CHUNK: Store.uploadChunk,
            UPLOAD_COMPLETE: Store.uploadComplete,
            UPLOAD_STATUS: Store.uploadStatus,
            UPLOAD_CANCEL: Store.uploadCancel,
            WRITE_LOGIN_BLOCK: Store.writeLoginBlock,
            REMOVE_LOGIN_BLOCK: Store.removeLoginBlock,
            PIN_PADS: Store.pinPads,
            UNPIN_PADS: Store.unpinPads,
            GET_DELETED_PADS: Store.getDeletedPads,
            GET_PINNED_USAGE: Store.getPinnedUsage,
            // ANON RPC
            INIT_ANON_RPC: Store.initAnonRpc,
            ANON_RPC_MESSAGE: Store.anonRpcMsg,
            GET_FILE_SIZE: Store.getFileSize,
            GET_MULTIPLE_FILE_SIZE: Store.getMultipleFileSize,
            // Store
            GET: Store.get,
            SET: Store.set,
            ADD_PAD: Store.addPad,
            SET_PAD_TITLE: Store.setPadTitle,
            MOVE_TO_TRASH: Store.moveToTrash,
            RESET_DRIVE: Store.resetDrive,
            GET_METADATA: Store.getMetadata,
            IS_ONLY_IN_SHARED_FOLDER: Store.isOnlyInSharedFolder,
            SET_DISPLAY_NAME: Store.setDisplayName,
            SET_PAD_ATTRIBUTE: Store.setPadAttribute,
            GET_PAD_ATTRIBUTE: Store.getPadAttribute,
            SET_ATTRIBUTE: Store.setAttribute,
            GET_ATTRIBUTE: Store.getAttribute,
            LIST_ALL_TAGS: Store.listAllTags,
            GET_TEMPLATES: Store.getTemplates,
            GET_SECURE_FILES_LIST: Store.getSecureFilesList,
            GET_PAD_DATA: Store.getPadData,
            GET_STRONGER_HASH: Store.getStrongerHash,
            INCREMENT_TEMPLATE_USE: Store.incrementTemplateUse,
            GET_SHARED_FOLDER: Store.getSharedFolder,
            ADD_SHARED_FOLDER: Store.addSharedFolder,
            LOAD_SHARED_FOLDER: Store.loadSharedFolderAnon,
            RESTORE_SHARED_FOLDER: Store.restoreSharedFolder,
            // Messaging
            ANSWER_FRIEND_REQUEST: Store.answerFriendRequest,
            SEND_FRIEND_REQUEST: Store.sendFriendRequest,
            // Chat
            CHAT_COMMAND: Store.messenger.execCommand,
            // OnlyOffice
            OO_COMMAND: Store.onlyoffice.execCommand,
            // Cursor
            CURSOR_COMMAND: Store.cursor.execCommand,
            // Mailbox
            MAILBOX_COMMAND: Store.mailbox.execCommand,
            // Universal
            UNIVERSAL_COMMAND: Store.universal.execCommand,
            // Pad
            SEND_PAD_MSG: Store.sendPadMsg,
            JOIN_PAD: Store.joinPad,
            LEAVE_PAD: Store.leavePad,
            GET_FULL_HISTORY: Store.getFullHistory,
            GET_HISTORY_RANGE: Store.getHistoryRange,
            IS_NEW_CHANNEL: Store.isNewChannel,
            REQUEST_PAD_ACCESS: Store.requestPadAccess,
            GIVE_PAD_ACCESS: Store.givePadAccess,
            GET_PAD_METADATA: Store.getPadMetadata,
            SET_PAD_METADATA: Store.setPadMetadata,
            // Drive
            DRIVE_USEROBJECT: Store.userObjectCommand,
            // Settings,
            DELETE_ACCOUNT: Store.deleteAccount,
            // Admin
            ADMIN_RPC: Store.adminRpc,
            ADMIN_ADD_MAILBOX: Store.addAdminMailbox,
        };

        Rpc.query = function (cmd, data, cb) {
            if (queries[cmd]) {
                queries[cmd]('0', data, cb);
            } else {
                console.error('UNHANDLED_STORE_RPC');
            }
        };

        // Internal calls
        Rpc._removeClient = Store._removeClient;
        Rpc._subscribeToDrive = Store._subscribeToDrive;
        Rpc._subscribeToMessenger = Store._subscribeToMessenger;

        return Rpc;
    };

    return create;
});

