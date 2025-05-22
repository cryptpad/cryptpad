// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
const factory = AStore => {
    var create = function (config) {
        var Store = AStore.create(config);

        var Rpc = {};

        var queries = Rpc.queries = {
            // Ready
            CONNECT: Store.init,
            DISCONNECT: Store.disconnect,
            MIGRATE_ANON_DRIVE: Store.migrateAnonDrive,
            PING: function (cId, data, cb) { cb(); },
            CACHE_DISABLE: Store.disableCache,
            HAS_DRIVE: Store.hasDrive,
            // RPC
            UPDATE_PIN_LIMIT: Store.updatePinLimit,
            GET_PIN_LIMIT: Store.getPinLimit,
            CLEAR_OWNED_CHANNEL: Store.clearOwnedChannel,
            REMOVE_OWNED_CHANNEL: Store.removeOwnedChannel,
            UPLOAD_CHUNK: Store.uploadChunk,
            UPLOAD_COMPLETE: Store.uploadComplete,
            UPLOAD_STATUS: Store.uploadStatus,
            UPLOAD_CANCEL: Store.uploadCancel,
            PIN_PADS: Store.pinPads,
            UNPIN_PADS: Store.unpinPads,
            GET_DELETED_PADS: Store.getDeletedPads,
            GET_PINNED_USAGE: Store.getPinnedUsage,
            // ANON RPC
            ANON_RPC_MESSAGE: Store.anonRpcMsg,
            GET_FILE_SIZE: Store.getFileSize,
            GET_MULTIPLE_FILE_SIZE: Store.getMultipleFileSize,
            // Store
            GET: Store.get,
            SET: Store.set,
            GET_DRIVE: Store.drive.get,
            SET_DRIVE: Store.drive.set,
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
            GET_PAD_DATA_FROM_CHANNEL: Store.getPadDataFromChannel,
            GET_STRONGER_HASH: Store.getStrongerHash,
            INCREMENT_TEMPLATE_USE: Store.incrementTemplateUse,
            GET_SHARED_FOLDER: Store.getSharedFolder,
            ADD_SHARED_FOLDER: Store.addSharedFolder,
            LOAD_SHARED_FOLDER: Store.loadSharedFolderAnon,
            RESTORE_SHARED_FOLDER: Store.restoreSharedFolder,
            UPDATE_SHARED_FOLDER_PASSWORD: Store.updateSharedFolderPassword,
            // Messaging
            ANSWER_FRIEND_REQUEST: Store.answerFriendRequest,
            SEND_FRIEND_REQUEST: Store.sendFriendRequest,
            // Team invitation
            ANON_GET_PREVIEW_CONTENT: Store.anonGetPreviewContent,
            // OnlyOffice
            OO_COMMAND: Store.onlyoffice.execCommand,
            // Mailbox
            MAILBOX_COMMAND: Store.mailbox.execCommand,
            // Universal
            UNIVERSAL_COMMAND: Store.universal.execCommand,
            // Pad
            SEND_PAD_MSG: Store.sendPadMsg,
            JOIN_PAD: Store.joinPad,
            LEAVE_PAD: Store.leavePad,
            GET_FULL_HISTORY: Store.getFullHistory,
            GET_HISTORY: Store.getHistory,
            GET_HISTORY_RANGE: Store.getHistoryRange,
            IS_NEW_CHANNEL: Store.isNewChannel,
            CONTACT_PAD_OWNER: Store.contactPadOwner,
            GIVE_PAD_ACCESS: Store.givePadAccess,
            BURN_PAD: Store.burnPad,
            GET_PAD_METADATA: Store.getPadMetadata,
            SET_PAD_METADATA: Store.setPadMetadata,
            CHANGE_PAD_PASSWORD_PIN: Store.changePadPasswordPin,
            GET_LAST_HASH: Store.getLastHash,
            GET_SNAPSHOT: Store.getSnapshot,
            CORRUPTED_CACHE: Store.corruptedCache,
            DELETE_MAILBOX_MESSAGE: Store.deleteMailboxMessage,
            // Drive
            DRIVE_USEROBJECT: Store.userObjectCommand,
            // Settings,
            DELETE_ACCOUNT: Store.deleteAccount,
            REMOVE_OWNED_PADS: Store.removeOwnedPads,
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

        return Rpc;
    };

    return { create };
};

if (typeof(module) !== 'undefined' && module.exports) {
    // Code from customize can't be laoded directly in the build
    module.exports = factory(
        require('../async-store')
    );
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define([
        '/common/outer/async-store.js'
    ], factory);
} else {
    // unsupported initialization
}
})();
