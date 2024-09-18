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


    const CHAR_SIZE = 40;

    let onTargetUpdate = Util.mkEvent();
    let onPosUpdate = Util.mkEvent();

    let createPageStructure = () => {
        let $editor = $('#cp-app-game-editor');
        let $container = $(h('div#cp-app-game-container')).appendTo($editor);

        let help = h('div#cp-app-game-help');
        let map = h('div#cp-app-game-map');
        let players = h('div#cp-app-game-players');
        let level = h('div#cp-app-game-level', [map, players]);
        let config = h('div#cp-app-game-config');
        let hud = h('div#cp-app-game-hud');
        $container.append([help, level, hud, config]);
        return {
            $map: $(map),
            $players: $(players),
            $config: $(config),
            $hud: $(hud),
            $help: $(help)
        };
    };

    let DEFAULT = {
        x: 1000,
        y: 600,
        range: 60,
        hp: 10,
        cd: 5
    };

    // This is the main initialization loop
    var onFrameworkReady = function (framework) {
        let {$map, $players, $hud, $help, $config} = createPageStructure();
        let APP = {};
        let sharedContent = {};

        let me = {};
        let others = {};
        let selected;


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

        let getConfig = () => {
            return Util.find(sharedContent, ['config','values']) || DEFAULT;
        };

        let initMap = () => {
            let config = getConfig();
            $map.css('width', `${config.x+4+CHAR_SIZE}px`);
            $map.css('height', `${config.y+4+CHAR_SIZE}px`);
        };

        let initHelp = () => {
            $help.append(h('pre.alert.alert-info', 'N: next target\nSpace: Attack'));
        };
        let lastHit = 0;
        let cdTo;
        let checkCd = () => {
            let config = getConfig();
            let cd = +new Date() - lastHit;
            return cd > (config.cd * 1000);
        };
        let checkHp = () => {
            sharedContent.players = sharedContent.players || {};
            let myTarget = others[selected];
            let targetData = sharedContent.players[selected];
            return myTarget && targetData && targetData.hp > 0;
        };
        let checkRange = () => {
            let config = getConfig();
            let myTarget = others[selected];
            if (!myTarget) { return; }
            let x1 = me.x;
            let x2 = myTarget.x;
            let y1 = me.y;
            let y2 = myTarget.y;
            let x = Math.abs(x2-x1);
            let y = Math.abs(y2-y1);
            let r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
            return r < (config.range + CHAR_SIZE);
        };
        let initHud = () => {
            let config = getConfig();
            let target = h('div.cp-app-game-target');
            let $target = $(target).appendTo($hud);
            let skills = h('div.cp-app-game-skills');
            let $skills = $(skills).appendTo($hud);
            onTargetUpdate.reg(function () {
                $target.empty();
                let metadataMgr = framework._.cpNfInner.metadataMgr;
                let users = metadataMgr.getMetadata().users || {};
                let user = users[selected];
                if (!user) {
                    $target.append([
                        h('p', 'Current target'),
                    ]);
                    return;
                }

                let el = h('div.cp-avatar');
                let $el = $(el);
                framework._.sfCommon.displayAvatar($el, user.avatar, user.name, function () {}, user.uid);
                $target.append([
                    h('p', 'Current target'),
                    h('div.cp-game-target-container', [
                        el,
                        h('span', user.name || Messages.anonymous)
                    ])
                ]);
                onPosUpdate.fire();
            });
            onPosUpdate.reg(function () {
                $skills.empty();
                clearInterval(cdTo);
                let myTarget = others[selected];
                if (!myTarget) { return; }

                if (!checkRange()) {
                    $skills.append(h('p', 'Too far from target'));
                    return;
                }

                let cdTxt = h('div');
                let $cdTxt = $(cdTxt).appendTo($skills);
                let updateCd = function () {
                    let cd = +new Date() - lastHit;
                    if (cd > config.cd * 1000) { // More than 10s since last hit? ready
                        $cdTxt.empty().text('Attack is ready!');
                        return;
                    }
                    cd = Math.floor((config.cd*10) - (cd / 100)) / 10; // 0.x s
                    $cdTxt.empty().text(`Attack ready in ${cd}s`);
                };
                cdTo = setInterval(updateCd, 50);
                updateCd();
            });
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


        let redrawList = () => {
            $players.empty();
            let config = getConfig();
            let all = sharedContent.players || {};
            let metadataMgr = framework._.cpNfInner.metadataMgr;
            let users = metadataMgr.getMetadata().users || {};
            Object.keys(all).forEach(key => {
                let data = all[key];
                let user = users[key];
                if (!user) { return; }
                if (key !== me.id && !others[key]) { return; }
                let el = h('div.cp-avatar');
                let $el = $(el);
                framework._.sfCommon.displayAvatar($el, user.avatar, user.name, function () {}, user.uid);
                let hp = data.hp;
                let p = Math.round(100*data.hp / config.hp);
                let text = `${hp} / ${config.hp}`;
                $players.append([
                    h('div.cp-game-player-health-container', [
                        h('div.cp-game-player-container', [
                            el,
                            h('span', user.name || Messages.anonymous)
                        ]),
                        h('div.cp-game-player-hp', {
                            style: `background: linear-gradient(to right, red, red ${p}%, white ${p}%, white);`
                        }, text)
                    ])
                ]);
            });
        };
        let redrawAll = (onlyMe) => {
            let config = getConfig();
            if (onlyMe && me.el) {
                let $el = $(me.el);
                $el.css('left', `${me.x}px`);
                $el.css('top', `${me.y}px`);
                onPosUpdate.fire();
                return;
            }
            let metadataMgr = framework._.cpNfInner.metadataMgr;
            let users = metadataMgr.getMetadata().users || {};
            let players = sharedContent.players || {};
            $map.empty();
            let redrawOne = (data) => {
                let user = users[data.id];
                let player = players[data.id];
                if (!user || !player) {
                    delete others[data.id];
                    if (data.el) { data.el.remove(); }
                    return;
                }
                if (!player.hp) {
                    if (selected === data.id) {
                        selected = undefined;
                        onTargetUpdate.fire();
                    }
                    delete others[data.id];
                    if (data.el) { data.el.remove(); }
                    return;
                }
                if (!data.el) {
                    let isMe = data.id === me.id ? '.cp-me' : '';
                    let isSel = data.id === selected ? '.cp-selected' : '';
                    let outline = `outline-width:${config.range}px;`;
                    data.el = h('div.cp-avatar.cp-character'+isMe+isSel, {
                        style: isMe ? `border-color:${user.color};${outline}`
                           : `border-bottom-color:${user.color};`
                    });
                    let $el = $(data.el);
                    framework._.sfCommon.displayAvatar($el, user.avatar, user.name, function () {}, user.uid);
                    redrawList();
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
            onPosUpdate.fire();
        };

        let updateOther = (obj) => {
            if (!obj.cursor) { return; }
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
            let config = getConfig();
            $(window).off('keydown', APP.onKeyDown);
            $(window).off('keyup', APP.onKeyUp);
            let keys = {};
            let last = 0;
            APP.onKeyDown = ev => {
                if (![37,38,39,40].includes(ev.which)) { return; }
                ev.preventDefault();
                ev.stopPropagation();
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
                // 78: N ==> Next target
                if (ev.which == 78) {
                    let all = Object.keys(others);
                    let idx = all.indexOf(selected);
                    let newIdx = (idx+1) % all.length;
                    selected = all[newIdx];
                    let el = others[selected] && others[selected].el;
                    if (el) {
                        $map.find('.cp-selected').removeClass('cp-selected', true);
                        $(el).toggleClass('cp-selected', true);
                    }
                    ev.preventDefault();
                    ev.stopPropagation();
                    onTargetUpdate.fire();
                    return;
                }
                // 32: Space ==> Attack
                if (ev.which == 32) {
                    if (checkCd() && checkRange() && checkHp()) {
                        // Skill is ready
                        sharedContent.players = sharedContent.players || {};
                        let targetData = sharedContent.players[selected];
                        if (!targetData || !targetData.hp) { return void redrawAll(); }
                        targetData.hp = targetData.hp - 1;
                        lastHit = +new Date();
                        framework.localChange();
                        if (!targetData.hp) {
                            lastHit = 0;
                            redrawAll();
                        }
                        onPosUpdate.fire();
                        redrawList();
                    }
                    ev.preventDefault();
                    ev.stopPropagation();
                    return;
                }

                // Arrow keys ==> handle multiple keys
                if (![37,38,39,40].includes(ev.which)) { return; }
                ev.preventDefault();
                ev.stopPropagation();
                delete keys[ev.which];
                if (!Object.keys(keys).length) { last = 0; }
            };
            $(window).on('keydown', APP.onKeyDown);
            $(window).on('keyup', APP.onKeyUp);
        };
        let initCharacter = () => {
            if (me.id) { return; } // already init
            let config = getConfig();
            me.x = Math.floor(config.x/2);
            me.y = Math.floor(config.y/2);
            me.id = framework._.cpNfInner.metadataMgr.getNetfluxId();
            // Add my data
            if (sharedContent.players && sharedContent.players[me.id]) {
                return UI.errorLoadingScreen("ALREADY JOINED");
            }
            sharedContent.players = sharedContent.players || {};
            sharedContent.players[me.id] = {
                hp: config.hp
            };
            framework.localChange();
            // Send cursor
            framework._.cpNfInner.chainpad.onSettle(function () {
                redrawList();
                redrawAll(true);
                setTimeout(framework.updateCursor);
                addKeyboard();
            });
        };

        framework.setCursorGetter(() => {
            let data = Util.clone(me);
            delete data.el;
            return data;
        });
        framework.onCursorUpdate(data => {
            if (data.leave) {
                let other = others[data.id];
                if (other && other.el) { other.el.remove(); }
                delete others[data.id];
                redrawList();
                return;
            }
            updateOther(data);
        });

        let getContent = () => {
            return sharedContent;
        };
        framework.onContentUpdate(function (newContent) {
            sharedContent = newContent.content;
            redrawList();
            if (APP.ready) {
                redrawAll();
            }
        });

        framework.setContentGetter(function () {
            var content = getContent();
            return {
                content: content
            };
        });

        framework.onReady(function () {
            APP.ready = true;
            initConfig();
            initMap();
            initHelp();
            initHud();
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
