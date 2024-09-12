// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// This is the initialization loading the CryptPad libraries
define([
    'jquery',
    '/common/sframe-app-framework.js',
    '/customize/messages.js', // translation keys
    '/common/hyperscript.js',
    '/common/common-interface.js',
    '/common/common-util.js',
    '/components/tweetnacl/nacl-fast.min.js',
    'less!/game/app-game.less'
    /* Here you can add your own javascript or css to load */
], function (
    $,
    Framework,
    Messages,
    h,
    UI,
    Util
    ) {


    let createPageStructure = () => {
        let $editor = $('#cp-app-game-editor');
        let $container = $(h('div#cp-app-game-container')).appendTo($editor);

        let map = h('div#cp-app-game-map');
        let config = h('div#cp-app-game-config');
        $container.append([map, config]);
        return {
            $map: $(map),
            $config: $(config)
        };
    };

    let DEFAULT = {
        x: 1000,
        y: 600,
        hp: 10,
        moveRate: 10
    };

    // This is the main initialization loop
    var onFrameworkReady = function (framework) {
        let {$map, $config} = createPageStructure();
        let APP = {};
        let sharedContent = {};

        let initConfig = () => {
            $config.empty();
            /*
            let Nacl = window.nacl;
            let hashPw = (pw) => {
                let pw_u8 = Nacl.util.decodeUTF8(pw);
                return Nacl.util.encodeBase64(Nacl.hash(pw_u8));
            };
            let content = sharedContent;
            // If no config, first user has to set up a password
            if (!content.config || !content.config.pw) {
                let label = h('label', {for:'cp-config-pw1'}, 'Add a password');
                let pw = UI.passwordInput({id:'cp-config-pw1'}, true);
                let label2 = h('label', {for:'cp-config-pw2'}, 'Confirm password');
                let pw2 = UI.passwordInput({id:'cp-config-pw2'}, true);
                let button = h('button.btn.btn-primary', Messages.settings_save);
                $config.append([label, pw, h('br'), label2, pw2, h('br'), button]);
                $(button).click(function () {
                    let val = $(pw).val();
                    let val2 = $(pw2).val();
                    if (!val || val !== val2) {
                        return void UI.warn(Messages.register_passwordsDontMatch);
                    }
                    content.config = {
                        pw: hashPw(val)
                    };
                    framework.localChange();
                    $config.empty();
                    initConfig();
                });
                return;
            }
            // We already have a config password configured!
            let isAdmin = APP.myHash === content.config.pw;
            if (!isAdmin) {
                // Show config and add an input to type the password
                let button = h('button.btn.btn-primary', "Confirm");
                let pwInput = UI.passwordInput({id:'cp-config-pw'}, true);
                $config.append(h('div', [pwInput, button]));
                $(button).click(function () {
                    let val = $(pwInput).find('input').val();
                    APP.myHash = hashPw(val);
                    initConfig();
                });
                // XXX and show the configured values
                return;
            }
            // XXX Display config form for admin
            */
        };

        let initMap = () => {
            let config = Util.find(sharedContent, ['config','values']) || DEFAULT;
            $map.css('width', `${config.x+24}px`); // 24 ==> padding + border
            $map.css('height', `${config.y+24}px`);
        };

        // Clean offline characters
        let cleanCharacters = () => {
            let metadataMgr = framework._.cpNfInner.metadataMgr;
            let clean = () => {
                let all = sharedContent.players || {};
                let online = metadataMgr.getChannelMembers();
                Object.keys(all).forEach(netfluxId => {
                    if (!online.includes(netfluxId)) {
                        delete sharedContent.players[netfluxId];
                    }
                });
                framework.localChange();
            };
            metadataMgr.onChange(clean);
            clean();
        };

        let me = {};
        let others = {};

        let redrawAll = (onlyMe) => {
            if (onlyMe && me.el) {
                console.error(onlyMe, me.el);
                let $el = $(me.el);
                $el.css('left', `${me.x}px`);
                $el.css('top', `${me.y}px`);
                return;
            }
            let metadataMgr = framework._.cpNfInner.metadataMgr;
            let users = metadataMgr.getMetadata().users || {};
            $map.empty();
            let redrawOne = (data) => {
                let user = users[data.id];
                if (!user) {
                    delete others[data.id];
                    if (data.el) { data.el.remove(); }
                    return;
                }
                if (!data.el) {
                    let isMe = data.id === me.id ? '.cp-me' : '';
                    data.el = h('div.cp-avatar.cp-character'+isMe, {
                        style: `border-color:${user.color};`
                    });
                    let $el = $(data.el);
                    framework._.sfCommon.displayAvatar($el, user.avatar, user.name, function () {}, user.uid);
                }
                let $el = $(data.el);
                $el.css('left', `${data.x}px`);
                $el.css('top', `${data.y}px`);
                $el.appendTo($map);
            };
            redrawOne(me);
            Object.keys(others).forEach(key => {
                redrawOne(others[key]);
            });
        };

        let updateOther = (obj) => {
            if (!obj.cursor) { return console.error('WTF'); }
            let data = obj.cursor;
            let other = others[data.id];
            if (!other) {
                other = others[data.id] = {
                    id: data.id
                };
            }
            other.x = data.x;
            other.y = data.y;
            redrawAll();
        };

        let addKeyboard = () => {
            let config = Util.find(sharedContent, ['config','values']) || DEFAULT;
            $(window).off('keydown', APP.onKeyDown);
            $(window).off('keyup', APP.onKeyUp);
            let keys = {};
            let last = 0;
            APP.onKeyDown = ev => {
                if (![37,38,39,40].includes(ev.which)) { return; }
                keys[ev.which] = true;
                let step = 5;
                let now = +new Date();
                if (last !== 0) {
                    let diff = now - last;
                    step = Math.max(1, Math.floor(diff/5)); // Max 1 step per 5ms
                    if (step > 20) { step = 20; }
                }
                last = now;

                let oldY = me.y;
                let oldX = me.x;
                if (keys[38]) { // Up
                    me.y = Math.max(0, me.y-step);
                }
                if (keys[40]) { // Down
                    me.y = Math.min(config.y, me.y+step);
                }
                if (keys[37]) { // Left
                    me.x = Math.max(0, me.x-step);
                }
                if (keys[39]) { // Right
                    me.x = Math.min(config.x, me.x+step);
                }
                if (oldX === me.x && oldY === me.y) { return; }
                framework.updateCursor();
                redrawAll(true);
            };
            APP.onKeyUp = ev => {
                if (![37,38,39,40].includes(ev.which)) { return; }
                delete keys[ev.which];
                if (!Object.keys(keys).length) { last = 0; }
            };
            $(window).on('keydown', APP.onKeyDown);
            $(window).on('keyup', APP.onKeyUp);
        };
        let initCharacter = () => {
            let config = Util.find(sharedContent, ['config','values']) || DEFAULT;
            me.x = Math.floor(config.x/2);
            me.y = Math.floor(config.y/2);
            me.id = framework._.cpNfInner.metadataMgr.getNetfluxId();
            redrawAll(true);
            // Add my data
            if (sharedContent[me.id]) {
                return UI.errorLoadingScreen("ALREADY JOINED");
            }
            sharedContent.players = sharedContent.players || {};
            sharedContent.players[me.id] = {
                hp: config.hp
            };
            framework.localChange();
            // Send cursor
            framework.updateCursor();
            addKeyboard();
        };

        framework.setCursorGetter(() => {
            let data = Util.clone(me);
            delete data.el;
            return data;
        });
        framework.onCursorUpdate(data => {
            updateOther(data);
        });

        let getContent = () => {
            return sharedContent;
        };
        framework.onContentUpdate(function (newContent) {
            sharedContent = newContent.content;
        });

        framework.setContentGetter(function () {
            var content = getContent();
            return {
                content: content
            };
        });

        framework.onReady(function () {
            initConfig();
            initMap();
            cleanCharacters();
            let metadataMgr = framework._.cpNfInner.metadataMgr;
            let myId = metadataMgr.getNetfluxId();
            metadataMgr.onChange(() => {
                let users = metadataMgr.getMetadata().users || {};
                if (!users[myId]) { return; }
                initCharacter();
            });
        });

        framework.start();
    };

    // Framework initialization
    Framework.create({
        toolbarContainer: '#cme_toolbox',
        contentContainer: '#cp-app-game-editor'
    }, function (framework) {
        onFrameworkReady(framework);
    });
});
