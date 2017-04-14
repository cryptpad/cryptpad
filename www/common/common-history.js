define([
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/bower_components/chainpad/chainpad.dist.js',
], function (JsonOT, Crypto) {
    var $ = window.jQuery;
    var ChainPad = window.ChainPad;
    var History = {};


    /* TODO
     * Implement GET_FULL_HISTORY serverside
     * All the history messages should be ['FULL_HISTORY', wc.id, msg]
     * Send [FULL_HISTORY_END, wc.id]
     *
     * We also need a chainpad without pruning and with the ability to get old messages
     */
    var loadHistory = function (common, cb) {
        var network = common.getNetwork();
        var hkn = network.historyKeeper;

        var wcId = common.hrefToHexChannelId(window.location.href);

        var createRealtime = function(chan) {
            console.log(ChainPad);
            return ChainPad.create({
                userName: 'history',
                initialState: '',
                transformFunction: JsonOT.validate,
                logLevel: 0
            });
        };
        var realtime = createRealtime();

        var secret = Cryptpad.getSecrets();
        var crypto = Crypto.createEncryptor(secret.keys);

        var to = window.setTimeout(function () {
            cb('[GET_FULL_HISTORY_TIMEOUT]');
        }, 3000);

        var parse = function (msg) {
            try {
                return JSON.parse(msg);
            } catch (e) {
                return null;
            }
        };
        var onMsg = function (msg) {
            var parsed = parse(msg);
            if (parsed[0] === 'FULL_HISTORY_END') {
                window.clearTimeout(to);
                cb(null, realtime);
                return;
            }
            if (parsed[0] !== 'FULL_HISTORY') { return; }
            var msg = parsed[1];
            var decryptedMsg = crypto.decrypt(msg, secret.keys.validateKey);
            realtime.message(decryptedMsg);
        };

        network.on('message', function (msg, sender) {
            onMsg(msg);
        });

        network.sendto(hkn, JSON.stringify(['GET_FULL_HISTORY', wcId]));
    };

    var create = History.create = function (common, cb) {
        var exp = {};

        var states = exp.states = ['a', 'b', 'c'];
        var c = exp.current = states.length - 1;
        console.log(c);

        var onUpdate;

        var update = exp.update = function () {
            states = [];
            if (typeof onUpdate === "function") { onUpdate(); }
            return states;
        };

        var get = exp.get = function (i) {
            i = parseInt(i);
            console.log('getting', i);
            if (typeof(i) !== "number" || i < 0 || i > states.length - 1) { return; }
            var hash = states[i];
            c = i;
            if (typeof onUpdate === "function") { onUpdate(); }
            return '';
        };

        var getNext = exp.getNext = function () {
            if (c < states.length - 1) { return get(++c); }
        };
        var getPrevious = exp.getPrevious = function () {
            if (c > 0) { return get(--c); }
        };

        var display = exp.display = function ($toolbar, render, onClose) {
            var $hist = $toolbar.find('.cryptpad-toolbar-history').html('').show();
            var $left = $toolbar.find('.cryptpad-toolbar-leftside').hide();
            var $right = $toolbar.find('.cryptpad-toolbar-rightside').hide();

            var $prev =$('<button>', {'class': 'previous'}).text('<<').appendTo($hist);
            var $next = $('<button>', {'class': 'next'}).text('>>').appendTo($hist);

            var $nav = $('<div>', {'class': 'goto'}).appendTo($hist);
            var $cur = $('<input>', {
                'type' : 'number',
                'min' : '1',
                'max' : states.length
            }).val(c + 1).appendTo($nav);
            var $label = $('<label>').text(' / '+ states.length).appendTo($nav);
            var $goTo = $('<button>').text('V').appendTo($nav);
            $('<br>').appendTo($nav);
            var $rev = $('<button>', {'class':'revertHistory'}).text('TODO: revert').appendTo($nav);
            var $close = $('<button>', {'class':'closeHistory'}).text('TODO: close').appendTo($nav);

            onUpdate = function () {
                $cur.attr('max', exp.states.length);
                $cur.val(c+1);
            };

            var toRender = function (getter) {
                return function () { render(getter()) };
            };

            $prev.click(toRender(getPrevious));
            $next.click(toRender(getNext));
            $goTo.click(function () {
                render( get($cur.val() - 1) )
            });

            $close.click(function () {
                $hist.hide();
                $left.show();
                $right.show();
                onClose();
            });

            render(get(c));
        };

        loadHistory(common, function (err, newRt) {
            if (err) { throw new Error(err); }
            realtime = exp.realtime = newRt;
            cb(exp);
        });
    };

    return History;
});

