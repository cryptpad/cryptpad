define([
    'jquery',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad/chainpad.dist.js',
], function ($, JsonOT, Crypto) {
    var ChainPad = window.ChainPad;
    var History = {};

    var getStates = function (rt) {
        var states = [];
        var b = rt.getAuthBlock();
        if (b) { states.unshift(b); }
        while (b.getParent()) {
            b = b.getParent();
            states.unshift(b);
        }
        return states;
    };

    var loadHistory = function (common, cb) {
        var network = common.getNetwork();
        var hkn = network.historyKeeper;

        var wcId = common.hrefToHexChannelId(window.location.href);

        var createRealtime = function(chan) {
            return ChainPad.create({
                userName: 'history',
                initialState: '',
                transformFunction: JsonOT.validate,
                logLevel: 0,
                noPrune: true
            });
        };
        var realtime = createRealtime();

        var secret = common.getSecrets();
        var crypto = Crypto.createEncryptor(secret.keys);

        var to = window.setTimeout(function () {
            cb('[GET_FULL_HISTORY_TIMEOUT]');
        }, 30000);

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
                console.log('END');
                window.clearTimeout(to);
                cb(null, realtime);
                return;
            }
            if (parsed[0] !== 'FULL_HISTORY') { return; }
            msg = parsed[1][4];
            if (msg) {
                msg = msg.replace(/^cp\|/, '');
                var decryptedMsg = crypto.decrypt(msg, secret.keys.validateKey);
                realtime.message(decryptedMsg);
            }
        };

        network.on('message', function (msg, sender) {
            onMsg(msg);
        });

        network.sendto(hkn, JSON.stringify(['GET_FULL_HISTORY', wcId, secret.keys.validateKey]));
    };

    var create = History.create = function (common, config) {
        if (!config.$toolbar) { return void console.error("config.$toolbar is undefined");}
        var $toolbar = config.$toolbar;
        var noFunc = function () {};
        var render = config.onRender || noFunc;
        var onClose = config.onClose || noFunc;
        var onRevert = config.onRevert || noFunc;
        var onReady = config.onReady || noFunc;

        var Messages = common.Messages;

        var realtime;

        var states = [];
        var c = states.length - 1;

        var $hist = $toolbar.find('.cryptpad-toolbar-history');
        var $left = $toolbar.find('.cryptpad-toolbar-leftside');
        var $right = $toolbar.find('.cryptpad-toolbar-rightside');
        var $cke = $toolbar.find('.cke_toolbox_main');

        var onUpdate;

        var update = function () {
            if (!realtime) { return []; }
            states = getStates(realtime);
            if (typeof onUpdate === "function") { onUpdate(); }
            return states;
        };

        // Get the content of the selected version, and change the version number
        var get = function (i) {
            i = parseInt(i);
            if (isNaN(i)) { return; }
            if (i < 0) { i = 0; }
            if (i > states.length - 1) { i = states.length - 1; }
            var val = states[i].getContent().doc;
            c = i;
            if (typeof onUpdate === "function") { onUpdate(); }
            $hist.find('.next, .previous').show();
            if (c === states.length - 1) { $hist.find('.next').hide(); }
            if (c === 0) { $hist.find('.previous').hide(); }
            return val || '';
        };

        var getNext = function (step) {
            return typeof step === "number" ? get(c + step) : get(c + 1);
        };
        var getPrevious = function (step) {
            return typeof step === "number" ? get(c - step) : get(c - 1);
        };

        // Create the history toolbar
        var display = function () {
            $hist.html('').show();
            $left.hide();
            $right.hide();
            $cke.hide();
            var $prev =$('<button>', {
                'class': 'previous fa fa-step-backward',
                title: Messages.history_prev
            }).appendTo($hist);
            var $next = $('<button>', {
                'class': 'next fa fa-step-forward',
                title: Messages.history_next
            }).appendTo($hist);

            var $nav = $('<div>', {'class': 'goto'}).appendTo($hist);
            var $cur = $('<input>', {
                'class' : 'gotoInput',
                'type' : 'number',
                'min' : '1',
                'max' : states.length
            }).val(c + 1).appendTo($nav).mousedown(function (e) {
                // stopPropagation because the event would be cancelled by the dropdown menus
                e.stopPropagation();
            });
            var $label = $('<label>').text(' / '+ states.length).appendTo($nav);
            var $goTo = $('<button>', {
                'class': 'fa fa-check',
                'title': Messages.history_goTo
            }).appendTo($nav);
            $('<br>').appendTo($nav);
            var $rev = $('<button>', {
                'class':'revertHistory',
                title: Messages.history_restoreTitle
            }).text(Messages.history_restore).appendTo($nav);
            var $close = $('<button>', {
                'class':'closeHistory',
                title: Messages.history_closeTitle
            }).text(Messages.history_close).appendTo($nav);

            onUpdate = function () {
                $cur.attr('max', states.length);
                $cur.val(c+1);
                $label.text(' / ' + states.length);
            };

            var close = function () {
                $hist.hide();
                $left.show();
                $right.show();
                $cke.show();
            };

            // Buttons actions
            $prev.click(function () { render(getPrevious()); });
            $next.click(function () { render(getNext()); });
            $goTo.click(function () { render( get($cur.val() - 1) ); });
            $cur.keydown(function (e) {
                var p = function () { e.preventDefault(); };
                if (e.which === 13) { p(); return render( get($cur.val() - 1) ); } // Enter
                if ([37, 40].indexOf(e.which) >= 0) { p(); return render(getPrevious()); } // Left
                if ([38, 39].indexOf(e.which) >= 0) { p(); return render(getNext()); } // Right
                if (e.which === 33) { p(); return render(getNext(10)); } // PageUp
                if (e.which === 34) { p(); return render(getPrevious(10)); } // PageUp
                if (e.which === 27) { p(); $close.click(); }
            }).focus();
            $cur.on('change', function () {
                $goTo.click();
            });
            $close.click(function () {
                states = [];
                close();
                onClose();
            });
            $rev.click(function () {
                common.confirm(Messages.history_restorePrompt, function (yes) {
                    if (!yes) { return; }
                    close();
                    onRevert();
                    common.log(Messages.history_restoreDone);
                });
            });

            // Display the latest content
            render(get(c));
        };

        // Load all the history messages into a new chainpad object
        loadHistory(common, function (err, newRt) {
            if (err) { throw new Error(err); }
            realtime = newRt;
            update();
            c = states.length - 1;
            display();
            onReady();
        });
    };

    return History;
});

