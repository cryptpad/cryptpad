define([
    'jquery',
    '/common/common-interface.js',
    //'/bower_components/chainpad-json-validator/json-ot.js',

    '/bower_components/chainpad/chainpad.dist.js',
], function ($, UI, ChainPad /* JsonOT */) {
    //var ChainPad = window.ChainPad;
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

    var loadHistory = function (config, common, cb) {
        var createRealtime = function () {
            return ChainPad.create({
                userName: 'history',
                validateContent: function (content) {
                    try {
                        JSON.parse(content);
                        return true;
                    } catch (e) {
                        console.log('Failed to parse, rejecting patch');
                        return false;
                    }
                },
                initialState: '',
                //patchTransformer: ChainPad.NaiveJSONTransformer,
                //logLevel: 0,
                //transformFunction: JsonOT.validate,
                logLevel: config.debug ? 2 : 0,
                noPrune: true
            });
        };
        var realtime = createRealtime();

        History.readOnly = common.getMetadataMgr().getPrivateData().readOnly;

        /*var to = window.setTimeout(function () {
            cb('[GET_FULL_HISTORY_TIMEOUT]');
        }, 30000);*/

        common.getFullHistory(realtime, function () {
            //window.clearTimeout(to);
            cb(null, realtime);
        });
    };

    History.create = function (common, config) {
        if (!config.$toolbar) { return void console.error("config.$toolbar is undefined");}
        if (History.loading) { return void console.error("History is already being loaded..."); }
        History.loading = true;
        var $toolbar = config.$toolbar;

        if (!config.applyVal || !config.setHistory || !config.onLocal || !config.onRemote) {
            throw new Error("Missing config element: applyVal, onLocal, onRemote, setHistory");
        }

        // config.setHistory(bool, bool)
        // - bool1: history value
        // - bool2: reset old content?
        var render = function (val) {
            if (typeof val === "undefined") { return; }
            try {
                config.applyVal(val);
            } catch (e) {
                // Probably a parse error
                console.error(e);
            }
        };
        var onClose = function () { config.setHistory(false, true); };
        var onRevert = function () {
            config.setHistory(false, false);
            config.onLocal();
            config.onRemote();
        };

        config.setHistory(true);
        var onReady = function () { };

        var Messages = common.Messages;

        var realtime;

        var states = [];
        var c = states.length - 1;

        var $hist = $toolbar.find('.cp-toolbar-history');
        var $left = $toolbar.find('.cp-toolbar-leftside');
        var $right = $toolbar.find('.cp-toolbar-rightside');
        var $cke = $toolbar.find('.cke_toolbox_main');

        $hist.html('').show();
        $left.hide();
        $right.hide();
        $cke.hide();

        UI.spinner($hist).get().show();

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
            $hist.find('.cp-toolbar-history-next, .cp-toolbar-history-previous').css('visibility', '');
            if (c === states.length - 1) { $hist.find('.cp-toolbar-history-next').css('visibility', 'hidden'); }
            if (c === 0) { $hist.find('.cp-toolbar-history-previous').css('visibility', 'hidden'); }

            if (config.debug) {
                console.log(states[i]);
                var ops = states[i] && states[i].getPatch() && states[i].getPatch().operations;
                if (Array.isArray(ops)) {
                    ops.forEach(function (op) { console.log(op); });
                }
            }

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
            $hist.html('');
            var $prev =$('<button>', {
                'class': 'cp-toolbar-history-previous fa fa-step-backward buttonPrimary',
                title: Messages.history_prev
            }).appendTo($hist);
            var $nav = $('<div>', {'class': 'cp-toolbar-history-goto'}).appendTo($hist);
            var $next = $('<button>', {
                'class': 'cp-toolbar-history-next fa fa-step-forward buttonPrimary',
                title: Messages.history_next
            }).appendTo($hist);

            $('<label>').text(Messages.history_version).appendTo($nav);
            var $cur = $('<input>', {
                'class' : 'cp-toolbar-history-goto-input',
                'type' : 'number',
                'min' : '1',
                'max' : states.length
            }).val(c + 1).appendTo($nav).mousedown(function (e) {
                // stopPropagation because the event would be cancelled by the dropdown menus
                e.stopPropagation();
            });
            var $label2 = $('<label>').text(' / '+ states.length).appendTo($nav);
            $('<br>').appendTo($nav);
            var $close = $('<button>', {
                'class':'cp-toolbar-history-close',
                title: Messages.history_closeTitle
            }).text(Messages.history_closeTitle).appendTo($nav);
            var $rev = $('<button>', {
                'class':'cp-toolbar-history-revert buttonSuccess',
                title: Messages.history_restoreTitle
            }).text(Messages.history_restore).appendTo($nav);
            if (History.readOnly) { $rev.hide(); }

            onUpdate = function () {
                $cur.attr('max', states.length);
                $cur.val(c+1);
                $label2.text(' / ' + states.length);
            };

            var close = function () {
                $hist.hide();
                $left.show();
                $right.show();
                $cke.show();
                $(window).trigger('resize');
            };

            // Buttons actions
            $prev.click(function () { render(getPrevious()); });
            $next.click(function () { render(getNext()); });
            $cur.keydown(function (e) {
                var p = function () { e.preventDefault(); };
                if (e.which === 13) { p(); return render( get($cur.val() - 1) ); } // Enter
                if ([37, 40].indexOf(e.which) >= 0) { p(); return render(getPrevious()); } // Left
                if ([38, 39].indexOf(e.which) >= 0) { p(); return render(getNext()); } // Right
                if (e.which === 33) { p(); return render(getNext(10)); } // PageUp
                if (e.which === 34) { p(); return render(getPrevious(10)); } // PageUp
                if (e.which === 27) { p(); $close.click(); }
            }).keyup(function (e) { e.stopPropagation(); }).focus();
            $cur.on('change', function () {
                render( get($cur.val() - 1) );
            });
            $close.click(function () {
                states = [];
                close();
                onClose();
            });
            $rev.click(function () {
                UI.confirm(Messages.history_restorePrompt, function (yes) {
                    if (!yes) { return; }
                    close();
                    onRevert();
                    UI.log(Messages.history_restoreDone);
                });
            });

            // Display the latest content
            render(get(c));
            $(window).trigger('resize');
        };

        // Load all the history messages into a new chainpad object
        loadHistory(config, common, function (err, newRt) {
            History.loading = false;
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


