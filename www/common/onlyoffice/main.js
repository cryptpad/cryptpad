// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/requireconfig.js',
    '/common/common-hash.js',
    '/common/sframe-common-outer.js'
], function (nThen, ApiConfig, DomReady, RequireConfig, Hash, SFCommonO) {
    var requireConfig = RequireConfig();

    // Loaded in load #2
    var hash, href, version;
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        var req = {
            cfg: requireConfig,
            req: [ '/common/loading.js' ],
            pfx: window.location.origin
        };
        window.rc = requireConfig;
        window.apiconf = ApiConfig;

        // Hidden hash
        hash = window.location.hash;
        href = window.location.href;
        if (window.history && window.history.replaceState && hash) {
            window.history.replaceState({}, window.document.title, '#');
        }

        var parsed = Hash.parsePadUrl(href);
        if (parsed && parsed.hashData) {
            var opts = parsed.getOptions();
            version = opts.versionHash;
        }

        document.getElementById('sbox-iframe').setAttribute('src',
            ApiConfig.httpSafeOrigin + window.location.pathname + 'inner.html?' +
                requireConfig.urlArgs + '#' + encodeURIComponent(JSON.stringify(req)));

        // This is a cheap trick to avoid loading sframe-channel in parallel with the
        // loading screen setup.
        var done = waitFor();
        var onMsg = function (msg) {
            var data = JSON.parse(msg.data);
            if (data.q !== 'READY') { return; }
            window.removeEventListener('message', onMsg);
            var _done = done;
            done = function () { };
            _done();
        };
        window.addEventListener('message', onMsg);
    }).nThen(function (/*waitFor*/) {
        var addData = function (obj) {
            obj.ooType = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
            obj.ooVersionHash = version;
            obj.ooForceVersion = localStorage.CryptPad_ooVersion || sessionStorage.CryptPad_ooVersion || "";
        };
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            sframeChan.on('Q_OO_SAVE', function (data, cb) {
                var chanId = Utils.Hash.hrefToHexChannelId(data.url);
                Cryptpad.getPadAttribute('lastVersion', function (err, data) {
                    if (data) {
                        var oldChanId = Utils.Hash.hrefToHexChannelId(data);
                        if (oldChanId !== chanId) { Cryptpad.unpinPads([oldChanId], function () {}); }
                    }
                });
                Cryptpad.pinPads([chanId], function (e) {
                    if (e) { return void cb(e); }
                    Cryptpad.setPadAttribute('lastVersion', data.url, cb);
                });
                Cryptpad.setPadAttribute('lastCpHash', data.hash, cb);
            });
            sframeChan.on('Q_OO_OPENCHANNEL', function (data, cb) {
                Cryptpad.getPadAttribute('rtChannel', function (err, res) {
                    // If already stored, don't pin it again
                    if (res && res === data.channel) { return; }
                    Cryptpad.pinPads([data.channel], function () {
                        Cryptpad.setPadAttribute('rtChannel', data.channel, function () {});
                    });
                });
                var owners, expire;
                nThen(function (waitFor) {
                    if (Utils.rtConfig) {
                        owners = Utils.Util.find(Utils.rtConfig, ['metadata', 'owners']);
                        expire = Utils.Util.find(Utils.rtConfig, ['metadata', 'expire']);
                        return;
                    }
                    Cryptpad.getPadAttribute('owners', waitFor(function (err, res) {
                        owners = res;
                    }));
                    Cryptpad.getPadAttribute('expire', waitFor(function (err, res) {
                        expire = res;
                    }));
                }).nThen(function () {
                    Cryptpad.onlyoffice.execCommand({
                        cmd: 'OPEN_CHANNEL',
                        data: {
                            owners: owners,
                            expire: expire,
                            channel: data.channel,
                            lastCpHash: data.lastCpHash,
                            padChan: Utils.secret.channel,
                            validateKey: Utils.secret.keys.validateKey
                        }
                    }, cb);
                });
            });
            sframeChan.on('EV_OO_PIN_IMAGES', function (list) {
                Cryptpad.getPadAttribute('ooImages', function (err, res) {
                    if (err) { return; }
                    if (!res || !Array.isArray(res)) { res = []; }
                    var toPin = [];
                    var toUnpin = [];
                    res.forEach(function (id) {
                        if (list.indexOf(id) === -1) {
                            toUnpin.push(id);
                        }
                    });
                    list.forEach(function (id) {
                        if (res.indexOf(id) === -1) {
                            toPin.push(id);
                        }
                    });
                    toPin = Utils.Util.deduplicateString(toPin);
                    toUnpin = Utils.Util.deduplicateString(toUnpin);
                    Cryptpad.pinPads(toPin, function () {});
                    Cryptpad.unpinPads(toUnpin, function () {});
                    if (!toPin.length && !toUnpin.length) { return; }
                    Cryptpad.setPadAttribute('ooImages', list, function (err) {
                        if (err) { console.error(err); }
                    });
                });
            });
            sframeChan.on('Q_OO_COMMAND', function (obj, cb) {
                if (obj.cmd === 'SEND_MESSAGE') {
                    obj.data.msg = Utils.crypto.encrypt(JSON.stringify(obj.data.msg));
                    var hash = obj.data.msg.slice(0,64);
                    var _cb = cb;
                    cb = function () {
                        _cb(hash);
                    };
                }
                Cryptpad.onlyoffice.execCommand(obj, cb);
            });
            sframeChan.on('EV_OO_OPENVERSION', function (obj) {
                if (!obj || !obj.hash) { return; }
                var parsed = Hash.parsePadUrl(window.location.href);
                var opts = parsed.getOptions();
                opts.versionHash = obj.hash;
                window.open(parsed.getUrl(opts));
            });
            Cryptpad.onlyoffice.onEvent.reg(function (obj) {
                if (obj.ev === 'MESSAGE' && !/^cp\|/.test(obj.data)) {
                    try {
                        var validateKey = obj.data.validateKey || true;
                        var skipCheck = validateKey === true;
                        var msg = obj.data.msg;
                        obj.data = {
                            msg: JSON.parse(Utils.crypto.decrypt(msg, validateKey, skipCheck)),
                            hash: msg.slice(0,64)
                        };
                    } catch (e) {
                        console.error(e);
                    }
                }
                sframeChan.event('EV_OO_EVENT', obj);
            });
        };
        SFCommonO.start({
            hash: hash,
            href: href,
            type: 'oo',
            useCreationScreen: true,
            addData: addData,
            addRpc: addRpc,
            messaging: true
        });
    });
});
