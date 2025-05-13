// SPDX-FileCopyrightText: 2025 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Default CryptPad worker module, extended with
// specific methods for each module
export type Callback = (...args: any[]) => void

export type ModuleConfig = {
    store: any,
    Store: any,
    updateMetadata: Callback,
    pinPads: Callback,
    unpinPads: Callback
}

export type CommandData = {
    cmd: string,
    data: any
}

export interface ModuleObject {
    removeClient: (clientId: string) => void
    execCommand: (clientId: string, obj: CommandData, cb: Callback) => void
}

export interface Module<T> {
    init: (config: ModuleConfig, cb: Callback, emit: Callback) => T
}


export type AccountConfig = {
    anonHash: string,
    userHash: string,
    store: any,
    cache: boolean,
    form_seed: string,

    broadcast: (exclude: object, cmd: string, data?: any, cb?: any) => void,
    postMessage: (clientId: string, cmd: string, data?: any, cb?: any) => void
}
export interface AccountObject {
    channel: string,
    onAccountCacheReady: any,
    onAccountReady: any,
    onDisconnect: any,
    onReconnect: any
}
export interface Account {
    init: (config: AccountConfig) => AccountObject,
    setCustomize: Callback
}

export type DriveConfig = {
    store: any,
    broadcast: (exclude: object, cmd: string, data?: any, cb?: any) => void,
    postMessage: (clientId: string, cmd: string, data?: any, cb?: any) => void
}
export interface DriveObject {
    channel: string,
    onDriveCacheReady: any,
    onDriveReady: any,
    onDisconnect: any,
    onReconnect: any
}
export interface Drive {
    init: (config: DriveConfig) => DriveObject
}
