require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
//    '/code/rt_codemirror.js',
    '/common/messages.js',
    '/common/crypto.js',
    '/common/realtime-input.js',
    '/common/TextPatcher.js',
    '/common/toolbar.js',
    'json.sortify',
    '/bower_components/jquery/dist/jquery.min.js'
], function (Config, /*RTCode,*/ Messages, Crypto, Realtime, TextPatcher, Toolbar, JSONSortify) {
    var $ = window.jQuery;
    var module = window.APP = {};
    var ifrw = module.ifrw = $('#pad-iframe')[0].contentWindow;
    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    $(function () {
        var userName = Crypto.rand64(8),
            toolbar;

        var key;
        var channel = '';
        var hash = false;
        if (!/#/.test(window.location.href)) {
            key = Crypto.genKey();
        } else {
            hash = window.location.hash.slice(1);
            channel = hash.slice(0, 32);
            key = hash.slice(32);
        }

        var andThen = function (CMeditor) {
            var $pad = $('#pad-iframe');
            var $textarea = $pad.contents().find('#editor1');

            var editor = module.editor = CMeditor.fromTextArea($textarea[0], {
                lineNumbers: true,
                lineWrapping: true,
                autoCloseBrackets: true,
                matchBrackets : true,
                showTrailingSpace : true,
                styleActiveLine : true,
                search: true,
                highlightSelectionMatches: {showToken: /\w+/},
                extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }},
                foldGutter: true,
                gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                mode: "javascript"
            });

            var userList = {}; // List of pretty name of all users (mapped with their server ID)
            var toolbarList; // List of users still connected to the channel (server IDs)
            var addToUserList = function(data) {
                for (var attrname in data) { userList[attrname] = data[attrname]; }
                if(toolbarList && typeof toolbarList.onChange === "function") {
                    toolbarList.onChange(userList);
                }
            };

            var myData = {};
            var myUserName = ''; // My "pretty name"
            var myID; // My server ID

            var setMyID = function(info) {
              myID = info.myID || null;
              myUserName = myID;
            };

            var createChangeName = function(id, $container) {
                var buttonElmt = $container.find('#'+id)[0];
                buttonElmt.addEventListener("click", function() {
                   var newName = window.prompt("Change your name :", myUserName);
                   if (newName && newName.trim()) {
                       var myUserNameTemp = newName.trim();
                       if(newName.trim().length > 32) {
                         myUserNameTemp = myUserNameTemp.substr(0, 32);
                       }
                       myUserName = myUserNameTemp;
                       myData[myID] = {
                          name: myUserName
                       };
                       addToUserList(myData);
                       onLocal();
                   }
                });
            };

            var config = {
                //initialState: Messages.codeInitialState,
                userName: userName,
                websocketURL: Config.websocketURL,
                channel: channel,
                cryptKey: key,
                crypto: Crypto,
                setMyID: setMyID,
            };

            // TODO lock editor until chain is synced
            // then unlock
            var setEditable = function () { };
            var canonicalize = function (t) { return t.replace(/\r\n/g, '\n'); };

            var initializing = true;

            var onInit = config.onInit = function (info) {
                var $bar = $('#pad-iframe')[0].contentWindow.$('#cme_toolbox');
                toolbarList = info.userList;
                var config = {
                    userData: userList,
                    changeNameID: 'cryptpad-changeName'
                };
                toolbar = info.realtime.toolbar = Toolbar.create($bar, info.myID, info.realtime, info.getLag, info.userList, config);
                createChangeName('cryptpad-changeName', $bar);
                window.location.hash = info.channel + key;



                /*if (!hash) {
                    editor.setValue(Messages.codeInitialState);
                    module.patchText(Messages.codeInitialState);
                    module.patchText(Messages.codeInitialState);
                    editor.setValue(Messages.codeInitialState);
                }*/

                //$(window).on('hashchange', function() { window.location.reload(); });
            };

            var updateUserList = function(shjson) {
                // Extract the user list (metadata) from the hyperjson
                var hjson = (shjson === "") ? "" : JSON.parse(shjson);
                if(hjson && hjson.metadata) {
                  var userData = hjson.metadata;
                  // Update the local user data
                  addToUserList(userData);
                }
            }

            var onReady = config.onReady = function (info) {
                var realtime = module.realtime = info.realtime;
                module.patchText = TextPatcher.create({
                    realtime: realtime,
                    logging: true,
                    //initialState: Messages.codeInitialState
                });

                var userDoc = module.realtime.getUserDoc();

                var newDoc = "";
                if(userDoc !== "") {
                    var hjson = JSON.parse(userDoc);
                    newDoc = hjson.content;
                }

                // Update the user list (metadata) from the hyperjson
                //updateUserList(shjson);

                editor.setValue(newDoc);

                initializing = false;
            };

            var onRemote = config.onRemote = function (info) {
                if (initializing) { return; }

                var oldDoc = $textarea.val();
                var shjson = module.realtime.getUserDoc();

                // Update the user list (metadata) from the hyperjson
                updateUserList(shjson);

                var hjson = JSON.parse(shjson);
                var remoteDoc = hjson.content;
                editor.setValue(remoteDoc);
                editor.save();

                var op = TextPatcher.diff(oldDoc, remoteDoc);
                //Fix cursor here

                var localDoc = $textarea.val();
                var hjson2 = {
                  content: localDoc,
                  metadata: userList
                };

                var shjson2 = stringify(hjson2);

                if (shjson2 !== shjson) {
                    console.error("shjson2 !== shjson");
                    module.patchText(shjson2);
                }


                // check cursor
                // apply changes to textarea
                // replace cursor
            };

            var onLocal = config.onLocal = function () {
                if (initializing) { return; }

                editor.save();
                var textValue = canonicalize($textarea.val());
                var obj = {content: textValue};

                // append the userlist to the hyperjson structure
                obj.metadata = userList;

                // stringify the json and send it into chainpad
                var shjson = stringify(obj);

                module.patchText(shjson);

                if (module.realtime.getUserDoc() !== shjson) {
                    console.error("realtime.getUserDoc() !== shjson");
                }
            };

            var onAbort = config.onAbort = function (info) {
                // TODO  alert the user
                // inform of network disconnect
                window.alert("Network Connection Lost!");
            };

            var realtime = module.realtime = Realtime.start(config);

            editor.on('change', onLocal);
        };

        var interval = 100;

        var first = function () {
            if (ifrw.CodeMirror) {
                // it exists, call your continuation
                andThen(ifrw.CodeMirror);
            } else {
                console.log("CodeMirror was not defined. Trying again in %sms", interval);
                // try again in 'interval' ms
                setTimeout(first, interval);
            }
        };

        first();
    });
});
