// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-util.js',
], function (Util) {
    var module = {};

    module.create = function (
        Common,
        onLocal,
        chainpad,
        saveHandler,
        unsavedChangesHandler) {

        var exp = {};
        var metadataMgr = Common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();

        var config = privateData.integrationConfig;
        if (!config.autosave) { return; }
        if (typeof(saveHandler) !== "function") {
            throw new Error("Incorrect save handler");
        }
        if (typeof(unsavedChangesHandler) !== "function") {
            throw new Error("Incorrect unsaves changes handler");
        }

        var debug = console.warn;
        //debug = function () {};
        var execCommand = function () {}; // placeholder

        var state = {
            changed: false,
            last: +new Date(),
            lastTmp: undefined,
            other: false, // save lock
            me: false // save lock
        };

        var saveTo;
        var onSettleTo;
        var alreadySaved = false;

        var BASE_TIMER = config.autosave * 1000;
        var autosaveTimer = BASE_TIMER;
        var SETTLE_TO = 3000;
        var SAVE_TO = Math.min((BASE_TIMER / 2), 10000);

        const setStateChanged = function(newValue) {
            if (state.changed === newValue) {
                return;
            }
            state.changed = newValue;
            unsavedChangesHandler(state.changed, function() {});
        };
        var requestSave = function () {}; // placeholder
        var saved = function () {}; // placeholder;
        var save = function (id) {
            id = id || Util.uid();
            requestSave(id, function (allowed) {
                if (!allowed) { return; }

                var onError = function (err) {
                    state.me = false;
                    // Increase my timer up to 1.5 times the normal timer
                    if (autosaveTimer < (BASE_TIMER*1.5)) {
                        autosaveTimer += 1000;
                    }
                    if (!err) { return; } // "err" is undefined in case of timeout
                    // If err while saving, warn others
                    execCommand('SEND', {
                        msg: 'IFAILED',
                        uid: id
                    }, function (err) {
                        if (err) { console.error(err); }
                    });
                };
                var myTo = setTimeout(onError, SAVE_TO);

                saveHandler(function (err) {
                    clearTimeout(myTo);
                    if (err) { return void onError(err); }
                    saved();
                });
            });
        };

        var onMessage = function (data) {
            if (!data || !data.msg) { return; }
            debug('Integration onMessage', data);
            if (data.msg === "ISAVE") {
                if (state.me) { return; } // I have the lock: abort
                if (state.other && state.other !== data.uid) { return; } // someone else has the lock
                // If state.other === data.uid ==> save failed and someone else tries again
                if (!state.changed) { return; }
                // If !state.other: nobody has the lock, give them
                state.other = data.uid;
                state.lastTmp = +new Date();
                // Add timeout to make sure the save is done
                clearTimeout(saveTo);
                clearTimeout(onSettleTo);

                setStateChanged(false);
                saveTo = setTimeout(function () {
                    // They weren't able to save in time, try ourselves
                    var id = state.other;
                    state.other = false;
                    save(id);
                }, SAVE_TO);
                return;
            }
            if (data.msg === "ISAVED") {
                // Save confirmed: update current state
                state.last = state.lastTmp || +new Date();
                state.other = false;
                state.me = false;
                alreadySaved = true;
                // And clear timeout
                clearTimeout(saveTo);
                clearTimeout(onSettleTo);
                // Make sure pending changes will be save at next interval
                if (state.changed) { exp.changed(); }
            }
            if (data.msg === "IFAILED") {
                if (state.me) { return; } // I already have the lock
                if (state.other !== data.uid) { return; } // Someone else took the lock
                state.other = false;
                if (!state.changed) { return; }
                clearTimeout(saveTo);
                clearTimeout(onSettleTo);
                save();
            }
        };

        var onEvent = function (obj) {
            var cmd = obj.ev;
            var data = obj.data;
            if (cmd === 'MESSAGE') {
                onMessage(data);
                return;
            }
        };

        var module = Common.makeUniversal('integration', {
            onEvent: onEvent
        });
        execCommand = module.execCommand;

        // Request a save lock.
        // Callback with "true" if allowed to save or "false" if someone else
        // is already saving
        requestSave = function (id, cb) {
            if (state.other || state.me) { return void cb(false); } // save in progress
            debug('Integration send ISAVE');
            alreadySaved = false; // someone may have saved while we were waiting for our callback
            execCommand('SEND', {
                msg: 'ISAVE',
                uid: id
            }, function (err) {
                if (err) { console.error(err); return void cb(false); }
                debug('Integration cb ISAVE', !(state.other || state.me || alreadySaved));
                if (state.other || state.me || alreadySaved) {
                    // someone else requested before me
                    return void cb(false);
                }
                state.me = true;
                state.lastTmp = +new Date();
                setStateChanged(false);
                cb(true);
            });
        };
        saved = function () {
            state.last = state.lastTmp || +new Date();
            state.other = false;
            state.me = false;
            debug('Integration send ISAVED');
            execCommand('SEND', {
                msg: 'ISAVED'
            }, function (err) {
                debug('Integration cb ISAVED');
                if (err) { console.error(err); }
                // Make sure pending changes will be save at next interval
                if (state.changed) { exp.changed(); }
            });
        };

        var changedTo;

        // Wait for SETTLE_TO ms without changes to start the saving process
        var addOnSettleTo = function () {
            clearTimeout(onSettleTo);
            onSettleTo = setTimeout(save, SETTLE_TO);
        };

        exp.changed = function () {
            setStateChanged(true);

            var timeSinceLastSave = +new Date() - state.last; // in ms
            var to = autosaveTimer - timeSinceLastSave; //  negative if we can save
            if (to > 0) { // try again in "to"
                if (!changedTo) { changedTo = setTimeout(exp.changed, to+1); }
                return;
            }

            // Clear existing timeouts
            clearTimeout(changedTo);
            changedTo = undefined;
            clearTimeout(onSettleTo);

            // If someone is saving, nothing to do
            if (state.other || state.me) { return; }

            // We need a save: refresh TO
            addOnSettleTo();
        };

        return exp;
    };

    return module;
});


