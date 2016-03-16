define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/messages.js',
    '/common/crypto.js',
    '/common/realtime-input.js',
    '/common/convert.js',
    '/common/toolbar.js',
    '/common/cursor.js',
    '/common/json-ot.js',
    '/bower_components/diff-dom/diffDOM.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Messages, Crypto, realtimeInput, Convert, Toolbar, Cursor, JsonOT) {
    var $ = window.jQuery;
    var ifrw = $('#pad-iframe')[0].contentWindow;
    var Ckeditor; // to be initialized later...
    var DiffDom = window.diffDOM;

    window.Toolbar = Toolbar;

    var userName = Crypto.rand64(8),
        toolbar;

    var andThen = function (Ckeditor) {
        $(window).on('hashchange', function() {
            window.location.reload();
        });
        if (window.location.href.indexOf('#') === -1) {
            window.location.href = window.location.href + '#' + Crypto.genKey();
            return;
        }

        var fixThings = false;
        var key = Crypto.parseKey(window.location.hash.substring(1));
        var editor = window.editor = Ckeditor.replace('editor1', {
            // https://dev.ckeditor.com/ticket/10907
            needsBrFiller: fixThings,
            needsNbspFiller: fixThings,
            removeButtons: 'Source,Maximize',
            // magicline plugin inserts html crap into the document which is not part of the
            // document itself and causes problems when it's sent across the wire and reflected back
            removePlugins: 'magicline,resize'
        });

        editor.on('instanceReady', function (Ckeditor) {
            editor.execCommand('maximize');
            var documentBody = ifrw.$('iframe')[0].contentDocument.body;

            documentBody.innerHTML = Messages.initialState;

            var inner = window.inner = documentBody;
            var cursor = window.cursor = Cursor(inner);

            var $textarea = $('#feedback');

            var setEditable = function (bool) {
                inner.setAttribute('contenteditable',
                    (typeof (bool) !== 'undefined'? bool : true));
            };

            // don't let the user edit until the pad is ready
            setEditable(false);

            var diffOptions = {
                preDiffApply: function (info) {

                    // no use trying to recover the cursor if it doesn't exist
                    if (!cursor.exists()) { return; }

                    /*  frame is either 0, 1, 2, or 3, depending on which
                        cursor frames were affected: none, first, last, or both
                    */
                    var frame = info.frame = cursor.inNode(info.node);

                    if (!frame) { return; }

                    var debug = info.debug = {
                        frame: frame,
                        action: info.diff.action,
                        cursorLength: cursor.getLength(),
                        node: info.node
                    };

                    if (info.diff.oldValue) { debug.oldValue = info.diff.oldValue; }
                    if (info.diff.newValue) { debug.newValue = info.diff.newValue; }
                    if (typeof info.diff.oldValue === 'string' && typeof info.diff.newValue === 'string') {
                        var pushes = cursor.pushDelta(info.diff.oldValue, info.diff.newValue);
                        debug.commonStart = pushes.commonStart;
                        debug.commonEnd = pushes.commonEnd;
                        debug.insert = pushes.insert;
                        debug.remove = pushes.remove;

                        if (frame & 1) {
                            // push cursor start if necessary
                            if (pushes.commonStart < cursor.Range.start.offset) {
                                cursor.Range.start.offset += pushes.delta;
                            }
                        }
                        if (frame & 2) {
                            // push cursor end if necessary
                            if (pushes.commonStart < cursor.Range.end.offset) {
                                cursor.Range.end.offset += pushes.delta;
                            }
                        }
                    }
                    console.log("###################################");
                    console.log(debug);
                },
                postDiffApply: function (info) {
                    if (info.frame) {
                        if (info.node) {
                            if (info.frame & 1) { cursor.fixStart(info.node); }
                            if (info.frame & 2) { cursor.fixEnd(info.node); }
                        } else { console.error("info.node did not exist"); }

                        var sel = cursor.makeSelection();
                        var range = cursor.makeRange();

                        cursor.fixSelection(sel, range);
                    }
                }
            };

            var initializing = true;
            var userList = []; // List of pretty name of all users (mapped with their server ID)
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
                   var newName = prompt("Change your name :", myUserName)
                   if (newName && newName.trim()) {
                       myUserName = newName.trim();
                       myData[myID] = {
                          name: myUserName
                       };
                       addToUserList(myData);
                       editor.fire( 'change' );
                   }
                });
            };

            // apply patches, and try not to lose the cursor in the process!
            var applyHjson = function (shjson) {
                var hjson = JSON.parse(shjson);
                console.log(hjson);
                var peerUserList = hjson[hjson.length-1];
                if(peerUserList.mydata) {
                  var userData = peerUserList.mydata;
                  console.log(userData);
                  addToUserList(userData);
                  delete hjson[hjson.length-1];
                }
                var userDocStateDom = Convert.hjson.to.dom(hjson);
                userDocStateDom.setAttribute("contenteditable", "true"); // lol wtf
                var DD = new DiffDom(diffOptions);
                var patch = (DD).diff(inner, userDocStateDom);
                (DD).apply(inner, patch);
            };

            var onRemote = function (shjson) {
                if (initializing) { return; }

                // remember where the cursor is
                cursor.update();

                // build a dom from HJSON, diff, and patch the editor
                applyHjson(shjson);
            };

            var onInit = function (info) {
                var $bar = $('#pad-iframe')[0].contentWindow.$('#cke_1_toolbox');
                toolbarList = info.userList;
                var config = {
                    userList: userList,
                    changeNameID: 'cryptpad-changeName'
                };
                toolbar = info.realtime.toolbar = Toolbar.create($bar, info.myID, info.realtime, info.webChannel, info.userList, config);
                createChangeName('cryptpad-changeName', $bar);
                /* TODO handle disconnects and such*/
            };

            var onReady = function (info) {
                console.log("Unlocking editor");
                initializing = false;
                setEditable(true);
                applyHjson($textarea.val());
                $textarea.trigger('keyup');
            };

            var onAbort = function (info) {
                console.log("Aborting the session!");
                // stop the user from continuing to edit
                setEditable(false);
                // TODO inform them that the session was torn down
                toolbar.failed();
            };

            
            
            var realtimeOptions = {
                // the textarea that we will sync
                textarea: $textarea[0],

                // the websocket URL (deprecated?)
                websocketURL: Config.websocketURL,
                webrtcURL: Config.webrtcURL,

                // our username
                userName: userName,

                // the channel we will communicate over
                channel: key.channel,

                // our encryption key
                cryptKey: key.cryptKey,

                // configuration :D
                doc: inner,
                // first thing called
                onInit: onInit,

                onReady: onReady,

                setMyID: setMyID,

                // when remote changes occur
                onRemote: onRemote,

                // handle aborts
                onAbort: onAbort,

                // really basic operational transform
                transformFunction : JsonOT.validate
                // pass in websocket/netflux object TODO
            };

            var rti = window.rti = realtimeInput.start(realtimeOptions);

            $textarea.val(JSON.stringify(Convert.dom.to.hjson(inner)));

            editor.on('change', function () {
                var hjson = Convert.core.hyperjson.fromDOM(inner);
                if(myData !== {}) {
                    hjson[hjson.length] = {mydata: myData};
                    myData = {};
                }
                $textarea.val(JSON.stringify(hjson));
                rti.bumpSharejs();
            });
        });
    };

    var interval = 100;
    var first = function () {
        Ckeditor = ifrw.CKEDITOR;
        if (Ckeditor) {
            andThen(Ckeditor);
        } else {
            console.log("Ckeditor was not defined. Trying again in %sms",interval);
            setTimeout(first, interval);
        }
    };

    $(first);
});
