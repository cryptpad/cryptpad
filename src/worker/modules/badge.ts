import nacl from 'tweetnacl/nacl-fast';
import nThen from 'nthen';
import { Module, ModuleObject, Callback } from '../types'
import * as Util from '../../common/common-util.js';

export interface BadgeModule<T> extends Module<T> {
    setCustomize: (data: any) => void
}

let ApiConfig:any = {};

const checkApi = (ctx, ed, cb) => {
    const badges = [];
    const origin:string = ApiConfig?.httpUnsafeOrigin;
    Util.fetchApi(origin, 'config', true, Config => {
        const isAdmin = Config?.adminKeys?.includes(ed);
        if (isAdmin) { badges.push('admin'); }
        const isModerator = Config?.moderatorKeys?.includes(ed);
        if (isModerator) { badges.push('moderator'); }
        cb(badges);
    });
};
const checkPremium = (ctx, ed, cb) => {
    ctx.Store.anonRpcMsg('', {
        msg: 'IS_PREMIUM',
        data: ed
    }, obj => {
        let premium = Array.isArray(obj) && obj[0];
        cb(premium);
    });
};

const listBadges:Callback = (ctx, data, clientId, cb) => {
    const badges = [];
    const origin:string = ApiConfig?.httpUnsafeOrigin;
    const ed = ctx.store?.proxy?.edPublic;
    nThen(waitFor => {
        checkApi(ctx, ed, waitFor(list => {
            Array.prototype.push.apply(badges, list);
        }));
    }).nThen(waitFor => {
        checkPremium(ctx, ed, waitFor(isPremium => {
            if (isPremium) { badges.push('premium'); }
        }));
    }).nThen(() => {
        cb(badges);
    });
};

const Badge: BadgeModule<ModuleObject> = {

    init: (config, cb, emit) => {

        const ctx:any = {
            store: config.store,
            Store: config.Store,
            updateMetadata: config.updateMetadata
        };

        return {
            removeClient: () => {},
            execCommand: (clientId, obj, cb) => {
                console.log('Exex command', clientId, obj);
                const cmd = obj.cmd;
                const data = obj.data;
                if (cmd === 'LIST_BADGES') {
                    return void listBadges(ctx, data, clientId, cb);
                }
                cb();
            },
        }
    },
    setCustomize: data => {
        console.error('PAICONFIG', data);
        ApiConfig = data?.ApiConfig;
    }

};

export { Badge }
