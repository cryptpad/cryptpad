define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/common/toolbar.js',
    '/common/cryptpad-common.js',
    '/common/visible.js',
    '/common/notify.js',
    '/file/file-crypto.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/bower_components/file-saver/FileSaver.min.js',
], function ($, Crypto, realtimeInput, Toolbar, Cryptpad, Visible, Notify, FileCrypto) {
    var Messages = Cryptpad.Messages;
    var saveAs = window.saveAs;
    var Nacl = window.nacl;

    $(function () {

    var ifrw = $('#pad-iframe')[0].contentWindow;
    var $iframe = $('#pad-iframe').contents();

    Cryptpad.addLoadingScreen();

    var fetch = function (src, cb) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", src, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function (e) {
            return void cb(void 0, new Uint8Array(xhr.response));
        };
        xhr.send(null);
    };

    var upload = function (blob, id, key) {
        Cryptpad.alert("UPLOAD IS NOT IMPLEMENTED YET");
    };

    var myFile;
    var myDataType;
    var uploadMode = false;

    var andThen = function () {
        var $bar = $iframe.find('.toolbar-container');

// Test hash:
// #/2/K6xWU-LT9BJHCQcDCT-DcQ/TBo77200c0e-FdldQFcnQx4Y/
        var secret;
        var hexFileName;
        if (window.location.hash) {
            secret = Cryptpad.getSecrets();
            if (!secret.keys) { throw new Error("You need a hash"); } // TODO
            hexFileName = Cryptpad.base64ToHex(secret.channel);
        } else {
            uploadMode = true;
        }

        //window.location.hash = '/2/K6xWU-LT9BJHCQcDCT-DcQ/VLIgpQOgmSaW3AQcUCCoJnYvCbMSO0MKBqaICSly9fo=';

        var parsed = Cryptpad.parsePadUrl(window.location.href);
        var defaultName = Cryptpad.getDefaultName(parsed);

        var getTitle = function () {
            var pad = Cryptpad.getRelativeHref(window.location.href);
            var fo = Cryptpad.getStore().getProxy().fo;
            var data = fo.getFileData(pad);
            return data ? data.title : undefined;
        };

        var updateTitle = function (newTitle) {
            Cryptpad.renamePad(newTitle, function (err, data) {
                if (err) {
                    console.log("Couldn't set pad title");
                    console.error(err);
                    return;
                }
                document.title = newTitle;
                $bar.find('.' + Toolbar.constants.title).find('span.title').text(data);
                $bar.find('.' + Toolbar.constants.title).find('input').val(data);
            });
        };

        var suggestName = function () {
            return document.title || getTitle() || '';
        };

        var renameCb = function (err, title) {
            document.title = title;
        };

        var blob;
        var exportFile = function () {
            var suggestion = document.title;
            Cryptpad.prompt(Messages.exportPrompt,
                Cryptpad.fixFileName(suggestion), function (filename) {
                if (!(typeof(filename) === 'string' && filename)) { return; }
                var blob = new Blob([myFile], {type: myDataType});
                saveAs(blob, filename);
            });
        };

        var displayed = ['useradmin', 'newpad', 'limit'];
        if (secret && hexFileName) {
            displayed.push('share');
        }

        var configTb = {
            displayed: displayed,
            ifrw: ifrw,
            common: Cryptpad,
            title: {
                onRename: renameCb,
                defaultName: defaultName,
                suggestName: suggestName
            },
            share: {
                secret: secret,
                channel: hexFileName
            },
            hideDisplayName: true
        };
        Toolbar.create($bar, null, null, null, null, configTb);
        var $rightside = $bar.find('.' + Toolbar.constants.rightside);

        var $export = Cryptpad.createButton('export', true, {}, exportFile);
        $rightside.append($export);

        updateTitle(Cryptpad.initialName || getTitle() || defaultName);

        if (!uploadMode) {
            var src = Cryptpad.getBlobPathFromHex(hexFileName);
            return fetch(src, function (e, u8) {
                // now decrypt the u8
                if (e) { return window.alert('error'); }
                var cryptKey = secret.keys && secret.keys.fileKeyStr;
                var key = Nacl.util.decodeBase64(cryptKey);

                FileCrypto.decrypt(u8, key, function (e, data) {
                    console.log(data);
                    var title = document.title = data.metadata.filename;
                    myFile = data.content;
                    myDataType = data.metadata.type;
                    updateTitle(title || defaultName);

                    Cryptpad.removeLoadingScreen();
                });
            });
        }

        var $form = $iframe.find('#upload-form');
        $form.css({
            display: 'block',
        });

        var $file = $form.find("#file").on('change', function (e) {
            var file = e.target.files[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                upload(e.target.result);
            };
            reader.readAsText(file);
        });

        // we're in upload mode
        Cryptpad.removeLoadingScreen();
    };

    Cryptpad.ready(function (err, anv) {
        andThen();
        Cryptpad.reportAppUsage();
    });

    });
});
