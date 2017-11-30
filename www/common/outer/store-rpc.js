define([
    '/common/outer/async-store.js'
], function (Store) {
    var Rpc = {};

    Rpc.query = function (cmd, data, cb) {
        switch (cmd) {
            // READY
            case 'CONNECT': {
                Store.init(data, cb); break;
            }
            case 'DISCONNECT': {
                Store.disconnect(data, cb); break;
            }
            case 'CREATE_README': {
                Store.createReadme(data, cb); break;
            }
            case 'MIGRATE_ANON_DRIVE': {
                Store.migrateAnonDrive(data, cb); break;
            }
            // RPC
            case 'INIT_RPC': {
                Store.initRpc(data, cb); break;
            }
            case 'UPDATE_PIN_LIMIT': {
                Store.updatePinLimit(data, cb); break;
            }
            case 'GET_PIN_LIMIT': {
                Store.getPinLimit(data, cb); break;
            }
            case 'CLEAR_OWNED_CHANNEL': {
                Store.clearOwnedChannel(data, cb); break;
            }
            case 'UPLOAD_COMPLETE': {
                Store.uploadComplete(data, cb); break;
            }
            case 'UPLOAD_STATUS': {
                Store.uploadStatus(data, cb); break;
            }
            case 'UPLOAD_CANCEL': {
                Store.uploadCancel(data, cb); break;
            }
            case 'PIN_PADS': {
                Store.pinPads(data, cb); break;
            }
            case 'UNPIN_PADS': {
                Store.unpinPads(data, cb); break;
            }
            case 'GET_PINNED_USAGE': {
                Store.getPinnedUsage(data, cb); break;
            }
            // ANON RPC
            case 'INIT_ANON_RPC': {
                Store.initAnonRpc(data, cb); break;
            }
            case 'ANON_RPC_MESSAGE': {
                Store.anonRpcMsg(data, cb); break;
            }
            case 'GET_FILE_SIZE': {
                Store.getFileSize(data, cb); break;
            }
            case 'GET_MULTIPLE_FILE_SIZE': {
                Store.getMultipleFileSize(data, cb); break;
            }
            // Store
            case 'GET': {
                Store.get(data, cb); break;
            }
            case 'SET': {
                Store.set(data, cb); break;
            }
            case 'ADD_PAD': {
                Store.addPad(data, cb); break;
            }
            case 'SET_PAD_TITLE': {
                Store.setPadTitle(data, cb); break;
            }
            case 'MOVE_TO_TRASH': {
                Store.moveToTrash(data, cb); break;
            }
            case 'RESET_DRIVE': {
                Store.resetDrive(data, cb); break;
            }
            case 'GET_METADATA': {
                Store.getMetadata(data, cb); break;
            }
            case 'SET_DISPLAY_NAME': {
                Store.setDisplayName(data, cb); break;
            }
            case 'SET_PAD_ATTRIBUTE': {
                Store.setPadAttribute(data, cb); break;
            }
            case 'GET_PAD_ATTRIBUTE': {
                Store.getPadAttribute(data, cb); break;
            }
            case 'SET_ATTRIBUTE': {
                Store.setAttribute(data, cb); break;
            }
            case 'GET_ATTRIBUTE': {
                Store.getAttribute(data, cb); break;
            }
            case 'LIST_ALL_TAGS': {
                Store.listAllTags(data, cb); break;
            }
            case 'GET_TEMPLATES': {
                Store.getTemplates(data, cb); break;
            }
            case 'GET_SECURE_FILES_LIST': {
                Store.getSecureFilesList(data, cb); break;
            }
            case 'GET_STRONGER_HASH': {
                Store.getStrongerHash(data, cb); break;
            }
            // Messaging
            case 'INVITE_FROM_USERLIST': {
                Store.inviteFromUserlist(data, cb); break;
            }

            default: {
                
                break;
            }
        }

    };

    return Rpc;
});

