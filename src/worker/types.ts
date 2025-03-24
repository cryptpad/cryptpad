// Default CryptPad worker module, extended with
// specific methods for each module
export type Callback = (...args: any[]) => void

export type ModuleConfig = {
    emit: Function
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
    init: (config: ModuleConfig, cb: Callback) => T
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
