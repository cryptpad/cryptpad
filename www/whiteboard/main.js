require.config({ paths: {
    'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify'
}});

define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    'json.sortify',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/cryptpad-common.js',
    '/bower_components/secure-fabric.js/dist/fabric.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/bower_components/file-saver/FileSaver.min.js',
], function (Config, Realtime, Crypto, Toolbar, TextPatcher, JSONSortify, JsonOT, Cryptpad) {
    var saveAs = window.saveAs;
    var Messages = Cryptpad.Messages;

    var module = window.APP = { };
    var $ = module.$ = window.jQuery;
    var Fabric = module.Fabric = window.fabric;

    $(function () {
    Cryptpad.addLoadingScreen();
    var toolbar;

    var secret = Cryptpad.getSecrets();
    var readOnly = secret.keys && !secret.keys.editKeyStr;
    if (!secret.keys) {
        secret.keys = secret.key;
    }

    var andThen = function () {
        /* Initialize Fabric */
        var canvas = module.canvas = new Fabric.Canvas('canvas');
        var $canvas = $('canvas');

        var $width = $('#width');
        var updateBrushWidth = function () {
            canvas.freeDrawingBrush.width = Number($width.val());
        };
        updateBrushWidth();

        $width.on('change', updateBrushWidth);

        var palette = ['red', 'blue', 'green', 'white', 'black', 'purple',
            'gray', 'beige', 'brown', 'cyan', 'darkcyan', 'gold', 'yellow', 'pink'];
        var $colors = $('#colors');
        $colors.html(function (i, val) {
            return palette.map(function (c) {
                    return "<span class='palette' style='background-color:"+c+"'></span>";
                }).join("");
        });

        $('.palette').on('click', function () {
            var color = $(this).css('background-color');
            canvas.freeDrawingBrush.color = color;
        });

        var setEditable = function (bool) {
            if (readOnly && bool) { return; }
            canvas.isDrawingMode = bool;
            if (!bool) {
                canvas.deactivateAll();
                canvas.renderAll();
            }
            canvas.forEachObject(function (object) {
                object.selectable = bool;
            });
            $canvas.css('border-color', bool? 'black': 'red');
        };

        var saveImage = module.saveImage = function () {
            var defaultName = "pretty-picture.png";
            Cryptpad.prompt(Messages.exportPrompt, defaultName, function (filename) {
                if (!(typeof(filename) === 'string' && filename)) { return; }
                $canvas[0].toBlob(function (blob) {
                    saveAs(blob, filename);
                });
            });
        };

        var initializing = true;

        var $bar = $('#toolbar');
        var parsedHash = Cryptpad.parsePadUrl(window.location.href);
        var defaultName = Cryptpad.getDefaultName(parsedHash);
        var userData = module.userData = {}; // List of pretty name of all users (mapped with their server ID)
        var userList; // List of users still connected to the channel (server IDs)
        var addToUserData = function(data) {
            var users = module.users;
            for (var attrname in data) { userData[attrname] = data[attrname]; }

            if (users && users.length) {
                for (var userKey in userData) {
                    if (users.indexOf(userKey) === -1) {
                        delete userData[userKey];
                    }
                }
            }

            if(userList && typeof userList.onChange === "function") {
                userList.onChange(userData);
            }
        };

        var myData = {};
        var myUserName = ''; // My "pretty name"
        var myID; // My server ID

        var setMyID = function(info) {
          myID = info.myID || null;
          myUserName = myID;
        };

        var config = module.config = {
            initialState: '{}',
            websocketURL: Cryptpad.getWebsocketURL(),
            validateKey: secret.keys.validateKey,
            readOnly: readOnly,
            channel: secret.channel,
            crypto: Crypto.createEncryptor(secret.keys),
            setMyID: setMyID,
            transformFunction: JsonOT.transform,
        };

        var editHash;
        var onInit = config.onInit = function (info) {
            userList = info.userList;
            var config = {
                displayed: ['useradmin', 'spinner', 'lag', 'state', 'share', 'userlist', 'newpad'],
                userData: userData,
                readOnly: readOnly,
                share: {
                    secret: secret,
                    channel: info.channel
                },
                ifrw: window,
                title: {
                    onRename: renameCb,
                    defaultName: defaultName,
                    suggestName: suggestName
                },
                common: Cryptpad
            };
            if (readOnly) {delete config.changeNameID; }
            toolbar = module.toolbar = Toolbar.create($bar, info.myID, info.realtime, info.getLag, userList, config);

            var editHash;
            var viewHash = Cryptpad.getViewHashFromKeys(info.channel, secret.keys);

            if (!readOnly) {
                editHash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);
            }
            if (!readOnly) { Cryptpad.replaceHash(editHash); }
        };

        // used for debugging, feel free to remove
        var Catch = function (f) {
            return function () {
                try {
                    f();
                } catch (e) {
                    console.error(e);
                }
            };
        };

        var suggestName = function (fallback) {
            if (document.title === defaultName) {
                return fallback || "";
            } else {
                return document.title || defaultName;
            }
        };

        var renameCb = function (err, title) {
            if (err) { return; }
            document.title = title;
            onLocal();
        };

        var updateTitle = function (newTitle) {
            if (newTitle === document.title) { return; }
            // Change the title now, and set it back to the old value if there is an error
            var oldTitle = document.title;
            document.title = newTitle;
            Cryptpad.renamePad(newTitle, function (err, data) {
                if (err) {
                    console.log("Couldn't set pad title");
                    console.error(err);
                    document.title = oldTitle;
                    return;
                }
                document.title = data;
                $bar.find('.' + Toolbar.constants.title).find('span.title').text(data);
                $bar.find('.' + Toolbar.constants.title).find('input').val(data);
            });
        };

        var updateDefaultTitle = function (defaultTitle) {
            defaultName = defaultTitle;
            $bar.find('.' + Toolbar.constants.title).find('input').attr("placeholder", defaultName);
        };


        var updateMetadata = function(shjson) {
            // Extract the user list (metadata) from the hyperjson
            var json = (shjson === "") ? "" : JSON.parse(shjson);
            var titleUpdated = false;
            if (json && json.metadata) {
                if (json.metadata.users) {
                    var userData = json.metadata.users;
                    // Update the local user data
                    addToUserData(userData);
                }
                if (json.metadata.defaultTitle) {
                    updateDefaultTitle(json.metadata.defaultTitle);
                }
                if (typeof json.metadata.title !== "undefined") {
                    updateTitle(json.metadata.title || defaultName);
                    titleUpdated = true;
                }
            }
            if (!titleUpdated) {
                updateTitle(defaultName);
            }
        };

        var onRemote = config.onRemote = Catch(function () {
            if (initializing) { return; }
            var userDoc = module.realtime.getUserDoc();

            updateMetadata(userDoc);
            var json = JSON.parse(userDoc);
            var remoteDoc = json.content;

            canvas.loadFromJSON(remoteDoc);
            canvas.renderAll();
        });

        var stringifyInner = function (textValue) {
            var obj = {
                content: textValue,
                metadata: {
                    users: userData,
                    defaultTitle: defaultName
                }
            };
            if (!initializing) {
                obj.metadata.title = document.title;
            }
            // stringify the json and send it into chainpad
            return JSONSortify(obj);
        };


        var onLocal = config.onLocal = Catch(function () {
            if (initializing) { return; }
            if (readOnly) { return; }

            var content = stringifyInner(canvas.toDatalessJSON());

            module.patchText(content);
        });

        var setName = module.setName = function (newName) {
            if (typeof(newName) !== 'string') { return; }
            var myUserNameTemp = newName.trim();
            if(newName.trim().length > 32) {
              myUserNameTemp = myUserNameTemp.substr(0, 32);
            }
            myUserName = myUserNameTemp;
            myData[myID] = {
               name: myUserName,
               uid: Cryptpad.getUid(),
            };
            addToUserData(myData);
            Cryptpad.setAttribute('username', myUserName, function (err, data) {
                if (err) {
                    console.log("Couldn't set username");
                    console.error(err);
                    return;
                }
                onLocal();
            });
        };

        var onReady = config.onReady = function (info) {
            var realtime = module.realtime = info.realtime;
            module.patchText = TextPatcher.create({
                realtime: realtime
            });

            setEditable(true);
            initializing = false;
            onRemote();
            Cryptpad.getLastName(function (err, lastName) {
                if (err) {
                    console.log("Could not get previous name");
                    console.error(err);
                    return;
                }
                // Update the toolbar list:
                // Add the current user in the metadata if he has edit rights
                if (readOnly) { return; }
                if (typeof(lastName) === 'string') {
                    setName(lastName);
                } else {
                    myData[myID] = {
                        name: "",
                        uid: Cryptpad.getUid(),
                    };
                    addToUserData(myData);
                    onLocal();
                    module.$userNameButton.click();
                }
            });
        };

        var onAbort = config.onAbort = function (info) {
            setEditable(false);
            window.alert("Server Connection Lost");

            if (window.confirm("Would you like to save your image?")) {
                saveImage();
            }
        };

        var rt = Realtime.start(config);

        canvas.on('mouse:up', onLocal);

        $('#clear').on('click', function () {
            canvas.clear();
        });

        $('#save').on('click', function () {
            saveImage();
        });
    };

    Cryptpad.ready(function (err, env) {
        andThen();
    });

    });
});
