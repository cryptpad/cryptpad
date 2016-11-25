define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/bower_components/textpatcher/TextPatcher.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/cryptpad-common.js',
    '/bower_components/hyperjson/hyperjson.js',
    '/poll/test/render.js',
    '/common/toolbar.js',
    '/common/visible.js',
    '/common/notify.js',
    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
    //'/customize/pad.js'
], function (Config, TextPatcher, Listmap, Crypto, Cryptpad, Hyperjson, Render, Toolbar) {
    var $ = window.jQuery;
    var APP = window.APP = {
        Toolbar: Toolbar,
        Hyperjson: Hyperjson,
        Render: Render,
        //$bar: $('#toolbar').css({ border: '1px solid white', background: 'grey', 'margin-bottom': '1vh', }),
    };

    /*  Any time the realtime object changes, call this function */
    var change = function (o, n, path) {
        if (path && path.join) {
            console.log("Change from [%s] to [%s] at [%s]",
                o, n, path.join(', '));
        }

        var table = APP.$table[0];
        Render.updateTable(table, APP.proxy);

        /*  FIXME browser autocomplete fills in new fields sometimes
            calling updateTable twice removes the autofilled in values
            setting autocomplete="off" is not reliable

            https://developer.mozilla.org/en-US/docs/Web/Security/Securing_your_site/Turning_off_form_autocompletion
        */
        window.setTimeout(function () {
            Render.updateTable(table, APP.proxy);
        });
    };

    var getRealtimeId = function (input) {
        return input.getAttribute && input.getAttribute('data-rt-id');
    };

    /*  Called whenever an event is fired on an input element */
    var handleInput = function (input) {
        var type = input.type.toLowerCase();
        var id = getRealtimeId(input);

        console.log(input);

        switch (type) {
            case 'text':
                console.log("text[rt-id='%s'] [%s]", id, input.value);

                if (!input.value) { return void console.log("Hit enter?"); }
                Render.setValue(APP.proxy, id, input.value);
                break;
            case 'checkbox':
                console.log("checkbox[tr-id='%s'] %s", id, input.checked);
                Render.setValue(APP.proxy, id, input.checked);
                break;
            default:
                console.log("Input[type='%s']", type);
                break;
        }
    };

    /*  Called whenever an event is fired on a span */
    var handleSpan = function (span) {
        var id = span.getAttribute('data-rt-id');
        var type = Render.typeofId(id);
        if (type === 'row') {
            Render.removeRow(APP.proxy, id, function () {
                change();
            });
        } else if (type === 'col') {
            Render.removeColumn(APP.proxy, id, function () {
                change();
            });
        } else if (type === 'cell') {
            change();
        } else {
            console.log("UNHANDLED");
        }
    };

    var handleClick = function (e, isKeyup) {
        if (!APP.ready) { return; }
        var target = e && e.target;

        if (isKeyup) {
            console.log("Keyup!");
        }

        if (!target) { return void console.log("NO TARGET"); }

        var nodeName = target && target.nodeName;

        switch (nodeName) {
            case 'INPUT':
                handleInput(target);
                break;
            case 'SPAN':
            case 'LABEL':
                handleSpan(target);
                break;
            case undefined:
                //console.error(new Error("C'est pas possible!"));
                break;
            default:
                console.log(target, nodeName);
                break;
        }
    };

    /*
        Make sure that the realtime data structure has all the required fields
    */
    var prepareProxy = function (proxy, schema) {
        if (proxy && proxy.version === 1) { return; }
        console.log("Configuring proxy schema...");

        proxy.info = schema.info;
        proxy.table = schema.table;
        proxy.version = 1;
    };

    /*

    */
    var publish = APP.publish = function (bool) {
        if (!APP.ready || APP.proxy.published) { return; }
        APP.proxy.published = true;
        APP.$publish.hide();

        ['textarea', '#title'].forEach(function (sel) {
            $(sel).attr('disabled', bool);
        });
    };

    var ready = function (info, userid) {
        console.log("READY");
        console.log('userid: %s', userid);

        var proxy = APP.proxy;

        prepareProxy(proxy, Render.Example);

        var $table = APP.$table = $(Render.asHTML(proxy));
        var $createRow = APP.$createRow = $('#create-option').click(function () {
            // 
            console.error("BUTTON CLICKED! LOL");
            Render.createRow(proxy, function () {
                change();
            });
        });

        var $createCol = APP.$createCol = $('#create-user').click(function () {
            Render.createColumn(proxy, function () {
                change();
            });
        });

        $('.realtime').append($table);

        $table
            .click(handleClick)
            .on('keyup', function (e) { handleClick(e, true); });

        proxy
            .on('change', [], change)
            .on('remove', [], change);

        if (!proxy.published) {
            var $publish = APP.$publish = $('#publish')
                .show()
                .click(function () {
                    publish(true);
                });
        }

        APP.ready = true;
    };

    var secret = Cryptpad.getSecrets();

    var create = function (info) {
        var realtime = APP.realtime = info.realtime;

        var editHash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);

        APP.patchText = TextPatcher.create({
            realtime: realtime,
            logging: true,
        });

        Cryptpad.replaceHash(editHash);
    };

    var disconnect = function () {
        //setEditable(false); // TODO
        //Cryptpad.alert(Messages.common_connectionLost); // TODO
    };

    var config = {
        websocketURL: Cryptpad.getWebsocketURL(),
        channel: secret.channel,
        data: {},
        // our public key
        validateKey: secret.keys.validateKey || undefined,
        //readOnly: readOnly,
        crypto: Crypto.createEncryptor(secret.keys),
    };

    // don't initialize until the store is ready.
    Cryptpad.ready(function () {
        var rt = window.rt = APP.rt = Listmap.create(config);
        APP.proxy = rt.proxy;
        rt.proxy
        .on('create', create)
        .on('ready', function (info) {
            Cryptpad.getPadAttribute('userid', function (e, userid) {
                if (e) { console.error(e); }
                if (userid === null) { userid = Render.coluid(); }
                Cryptpad.setPadAttribute('userid', userid, function (e) {
                    ready(info, userid);
                });
            });
        })
        .on('disconnect', disconnect);
    });
});

