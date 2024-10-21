// Default CryptPad worker module, extended with
// specific methods for each module
type Callback = (...args: any[]) => void

declare module globalThis {
    let CryptPad_Messages: any;
    let CryptPad_AppConfig: any;
    let window: any;
}

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
