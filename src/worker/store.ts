// SPDX-FileCopyrightText: 2025 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

//import nacl from 'tweetnacl/nacl-fast';
import { Module } from './types';
//import { TestModule, TestModuleObject } from './modules/test';

import { Account } from './components/account';

// Manage all imports in order to provide them ApiConfig, AppConfig, etc.

// Common
import * as Util from '../common/common-util.js';
import * as Hash from '../common/common-hash.js';
import * as Feedback from '../common/common-feedback.js';
import * as Realtime from '../common/common-realtime.js';
import * as Constants from '../common/common-constants.js';
import * as Credential from '../common/common-credential.js';
import * as ProxyManager from '../common/proxy-manager.js';
import * as UO from '../common/user-object.js';
import * as UOSetter from '../common/user-object-setter.js';
import * as Pinpad from '../common/pinpad.js';
import * as PadTypes from '../common/pad-types.js';
import * as NetworkConfig from '../common/network-config.js';
import * as LoginBlock from '../common/outer/login-block.js';

// Core
import * as Store from './async-store.js';
import * as StoreRpc from './core/store-rpc.js';
import * as Interface from './core/interface.js';
import * as SWConnector from './core/sw-connector.js';
import * as WWConnector from './core/ww-connector.js';
import * as AsyncConnector from './core/async-connector.js';

// Components
import * as Migrate from './components/migrate-user-object.js';
import * as Messaging from './components/messaging.js';

// Modules
import * as Mailbox from './modules/mailbox.js';
import * as Cursor from './modules/cursor.js';
import * as Support from './modules/support.js';
import * as Integration from './modules/integration.js';
import * as OnlyOffice from './modules/onlyoffice.js';
import * as Profile from './modules/profile.js';
import * as Team from './modules/team.js';
import * as Messenger from './modules/messenger.js';
import * as History from './modules/history.js';
import * as Calendar from './modules/calendar.js';
import { Badge } from './modules/badge';

declare var WorkerGlobalScope: any
declare var SharedWorkerGlobalScope: any

interface StoreConfig {
    ApiConfig: any,
    AppConfig: any,
    Broadcast: any,
    Messages: any
}

let start = (cfg: StoreConfig):void => {
    // Provide custom data to the modules
    [
        Feedback,
        UO,
        Constants,
        ProxyManager,
        NetworkConfig,
        Migrate,
        LoginBlock,
        PadTypes,
        Credential,
        Cursor,
        Support,
        Calendar,
        Store,
        Account,
        Mailbox,
        Messenger,
        Badge
    ].forEach(dep => {
        if (typeof(dep.setCustomize) === "function") {
            dep.setCustomize(cfg);
        }
    });
};

let inWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
let inSharedWorker = typeof SharedWorkerGlobalScope !== 'undefined' && self instanceof SharedWorkerGlobalScope;
let store = {};
if (inSharedWorker) {
    SWConnector.start(start);
} else if (inWorker) {
    WWConnector.start(start);
} else if (typeof module !== 'undefined' && typeof module.exports) {
    store = AsyncConnector.start(start);
} else {
    store = AsyncConnector.start(start);
}


export {
    start,
    store
};

