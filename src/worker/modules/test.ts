// SPDX-FileCopyrightText: 2025 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

//import nacl from 'tweetnacl/nacl-fast';
import * as Util from '../../common/common-util.js';
import { Module, ModuleObject } from '../types'

export interface TestModuleObject extends ModuleObject {
    toBase64: (str: string) => string
}

const TestModule: Module<TestModuleObject> = {

    init: (config, cb, emit) => {
        let myTest = {};

        cb();

        return {
            removeClient: (clientId) => {
                console.log('Remove client', clientId);
            },
            execCommand: (clientId, obj, cb) => {
                console.log('Exex command', clientId, obj);
                cb();
            },
            toBase64: (str) => {
                return Util.encodeBase64(Util.decodeUTF8(str));
            }
        }
    }


};

export { TestModule }
