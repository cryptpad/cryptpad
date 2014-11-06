/*
 * Copyright 2014 XWiki SAS
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
define([
    'html-patcher',
    'errorbox',
    'messages',
    'bower/reconnectingWebsocket/reconnecting-websocket',
    'rangy',
    'chainpad',
    'otaml',
    'bower/jquery/dist/jquery.min',
    'bower/tweetnacl/nacl-fast.min'
], function (HTMLPatcher, ErrorBox, Messages, ReconnectingWebSocket) {

window.ErrorBox = ErrorBox;

    var $ = window.jQuery;
    var Rangy = window.rangy;
    Rangy.init();
    var ChainPad = window.ChainPad;
    var Otaml = window.Otaml;
    var Nacl = window.nacl;

    var PARANOIA = true;

    var module = { exports: {} };

    /**
     * If an error is encountered but it is recoverable, do not immediately fail
     * but if it keeps firing errors over and over, do fail.
     */
    var MAX_RECOVERABLE_ERRORS = 15;

    /** Maximum number of milliseconds of lag before we fail the connection. */
    var MAX_LAG_BEFORE_DISCONNECT = 20000;

    /** Id of the element for getting debug info. */
    var DEBUG_LINK_CLS = 'rtwysiwyg-debug-link';

    /** Id of the div containing the user list. */
    var USER_LIST_CLS = 'rtwysiwyg-user-list';

    /** Id of the div containing the lag info. */
    var LAG_ELEM_CLS = 'rtwysiwyg-lag';

    /** The toolbar class which contains the user list, debug link and lag. */
    var TOOLBAR_CLS = 'rtwysiwyg-toolbar';

    /** Key in the localStore which indicates realtime activity should be disallowed. */
    var LOCALSTORAGE_DISALLOW = 'rtwysiwyg-disallow';

    var SPINNER_DISAPPEAR_TIME = 3000;

    // ------------------ Trapping Keyboard Events ---------------------- //

    var bindEvents = function (element, events, callback, unbind) {
        for (var i = 0; i < events.length; i++) {
            var e = events[i];
            if (element.addEventListener) {
                if (unbind) {
                    element.removeEventListener(e, callback, false);
                } else {
                    element.addEventListener(e, callback, false);
                }
            } else {
                if (unbind) {
                    element.detachEvent('on' + e, callback);
                } else {
                    element.attachEvent('on' + e, callback);
                }
            }
        }
    };

    var bindAllEvents = function (wysiwygDiv, docBody, onEvent, unbind)
    {
        bindEvents(docBody,
                   ['textInput', 'keydown', 'keyup', 'select', 'cut', 'paste'],
                   onEvent,
                   unbind);
        bindEvents(wysiwygDiv,
                   ['mousedown','mouseup','click'],
                   onEvent,
                   unbind);
    };

    var SPINNER = [ '-', '\\', '|', '/' ];
    var kickSpinner = function (spinnerElement, reversed) {
        var txt = spinnerElement.textContent || '-';
        var inc = (reversed) ? -1 : 1;
        spinnerElement.textContent = SPINNER[(SPINNER.indexOf(txt) + inc) % SPINNER.length];
        spinnerElement.timeout && clearTimeout(spinnerElement.timeout);
        spinnerElement.timeout = setTimeout(function () {
            spinnerElement.textContent = '';
        }, SPINNER_DISAPPEAR_TIME);
    };

    var checkLag = function (realtime, lagElement) {
        var lag = realtime.getLag();
        var lagSec = lag.lag/1000;
        lagElement.textContent = "Lag: ";
        if (lag.waiting && lagSec > 1) {
            lagElement.textContent += "?? " + Math.floor(lagSec);
        } else {
            lagElement.textContent += lagSec;
        }
    };

    var isSocketDisconnected = function (socket, realtime) {
        var sock = socket._socket;
        return sock.readyState === sock.CLOSING
            || sock.readyState === sock.CLOSED
            || (realtime.getLag().waiting && realtime.getLag().lag > MAX_LAG_BEFORE_DISCONNECT);
    };

    var updateUserList = function (myUserName, listElement, userList) {
        var meIdx = userList.indexOf(myUserName);
        if (meIdx === -1) {
            listElement.textContent = Messages.synchronizing;
            return;
        }
        if (userList.length === 1) {
            listElement.textContent = Messages.editingAlone;
        } else if (userList.length === 2) {
            listElement.textContent = Messages.editingWithOneOtherPerson;
        } else {
            listElement.textContent = Messages.editingWith + ' ' + (userList.length - 1) +
                Messages.otherPeople;
        }
    };

    var createUserList = function (container) {
        var id = uid();
        $(container).prepend('<div class="' + USER_LIST_CLS + '" id="'+id+'"></div>');
        return $('#'+id)[0];
    };

    var abort = function (socket, realtime) {
        realtime.abort();
        try { socket._socket.close(); } catch (e) { }
        $('.'+USER_LIST_CLS).text(Messages.disconnected);
        $('.'+LAG_ELEM_CLS).text("");
    };

    var createDebugInfo = function (cause, realtime, docHTML, allMessages) {
        return JSON.stringify({
            cause: cause,
            realtimeUserDoc: realtime.getUserDoc(),
            realtimeAuthDoc: realtime.getAuthDoc(),
            docHTML: docHTML,
            allMessages: allMessages,
        });
    };

    var handleError = function (socket, realtime, err, docHTML, allMessages) {
        var internalError = createDebugInfo(err, realtime, docHTML, allMessages);
        abort(socket, realtime);
        ErrorBox.show('error', docHTML, internalError);
    };

    var getDocHTML = function (doc) {
        return doc.body.innerHTML;
    };

    var makeHTMLOperation = function (oldval, newval) {
        try {
            var op = Otaml.makeHTMLOperation(oldval, newval);

            if (PARANOIA && op) {
                // simulate running the patch.
                var res = HTMLPatcher.patchString(oldval, op.offset, op.toRemove, op.toInsert);
                if (res !== newval) {
                    console.log(op);
                    console.log(oldval);
                    console.log(newval);
                    console.log(res);
                    throw new Error();
                }

                // check matching bracket count
                // TODO(cjd): this can fail even if the patch is valid because of brackets in
                //            html attributes.
                var removeText = oldval.substring(op.offset, op.offset + op.toRemove);
                if (((removeText).match(/</g) || []).length !==
                    ((removeText).match(/>/g) || []).length)
                {
                    throw new Error();
                }

                if (((op.toInsert).match(/</g) || []).length !==
                    ((op.toInsert).match(/>/g) || []).length)
                {
                    throw new Error();
                }
            }

            return op;

        } catch (e) {
            if (PARANOIA) {
                $(document.body).append('<textarea id="makeOperationErr"></textarea>');
                $('#makeOperationErr').val(oldval + '\n\n\n\n\n\n\n\n\n\n' + newval);
                console.log(e.stack);
            }
            return {
                offset: 0,
                toRemove: oldval.length,
                toInsert: newval
            };
        }
    };

    // chrome sometimes generates invalid html but it corrects it the next time around.
    var fixChrome = function (docText, doc, contentWindow) {
        for (var i = 0; i < 10; i++) {
            var docElem = doc.createElement('div');
            docElem.innerHTML = docText;
            var newDocText = docElem.innerHTML;
            var fixChromeOp = makeHTMLOperation(docText, newDocText);
            if (!fixChromeOp) { return docText; }
            HTMLPatcher.applyOp(docText,
                                fixChromeOp,
                                doc.body,
                                Rangy,
                                contentWindow);
            docText = getDocHTML(doc);
            if (newDocText === docText) { return docText; }
        }
        throw new Error();
    };

    var fixSafari_STATE_OUTSIDE = 0;
    var fixSafari_STATE_IN_TAG =  1;
    var fixSafari_STATE_IN_ATTR = 2;
    var fixSafari_HTML_ENTITIES_REGEX = /('|"|<|>|&lt;|&gt;)/g;

    var fixSafari = function (html) {
        var state = fixSafari_STATE_OUTSIDE;
        return html.replace(fixSafari_HTML_ENTITIES_REGEX, function (x) {
            switch (state) {
                case fixSafari_STATE_OUTSIDE: {
                    if (x === '<') { state = fixSafari_STATE_IN_TAG; }
                    return x;
                }
                case fixSafari_STATE_IN_TAG: {
                    switch (x) {
                        case '"': state = fixSafari_STATE_IN_ATTR; break;
                        case '>': state = fixSafari_STATE_OUTSIDE; break;
                        case "'": throw new Error("single quoted attribute");
                    }
                    return x;
                }
                case fixSafari_STATE_IN_ATTR: {
                    switch (x) {
                        case '&lt;': return '<';
                        case '&gt;': return '>';
                        case '"': state = fixSafari_STATE_IN_TAG; break;
                    }
                    return x;
                }
            };
            throw new Error();
        });
    };

    var getFixedDocText = function (doc, ifrWindow) {
        var docText = getDocHTML(doc);
        docText = fixChrome(docText, doc, ifrWindow);
        docText = fixSafari(docText);
        return docText;
    };

    var uid = function () {
        return 'rtwysiwyg-uid-' + String(Math.random()).substring(2);
    };

    var checkLag = function (realtime, lagElement) {
        var lag = realtime.getLag();
        var lagSec = lag.lag/1000;
        var lagMsg = Messages.lag + ' ';
        if (lag.waiting && lagSec > 1) {
            lagMsg += "?? " + Math.floor(lagSec);
        } else {
            lagMsg += lagSec;
        }
        lagElement.textContent = lagMsg;
    };

    var createLagElement = function (container) {
        var id = uid();
        $(container).append('<div class="' + LAG_ELEM_CLS + '" id="'+id+'"></div>');
        return $('#'+id)[0];
    };

    var createSpinner = function (container) {
        var id = uid();
        $(container).append('<div class="rtwysiwyg-spinner" id="'+id+'"></div>');
        return $('#'+id)[0];
    };

    var createRealtimeToolbar = function (container) {
        var id = uid();
        $(container).prepend(
            '<div class="' + TOOLBAR_CLS + '" id="' + id + '">' +
                '<div class="rtwysiwyg-toolbar-leftside"></div>' +
                '<div class="rtwysiwyg-toolbar-rightside"></div>' +
            '</div>'
        );
        var toolbar = $('#'+id);
        toolbar.append([
            '<style>',
            '.' + TOOLBAR_CLS + ' {',
            '    color: #666;',
            '    font-weight: bold;',
//            '    background-color: #f0f0ee;',
//            '    border-bottom: 1px solid #DDD;',
//            '    border-top: 3px solid #CCC;',
//            '    border-right: 2px solid #CCC;',
//            '    border-left: 2px solid #CCC;',
            '    height: 26px;',
            '    margin-bottom: -3px;',
            '    display: inline-block;',
            '    width: 100%;',
            '}',
            '.' + TOOLBAR_CLS + ' div {',
            '    padding: 0 10px;',
            '    height: 1.5em;',
//            '    background: #f0f0ee;',
            '    line-height: 25px;',
            '    height: 22px;',
            '}',
            '.rtwysiwyg-toolbar-leftside {',
            '    float: left;',
            '}',
            '.rtwysiwyg-toolbar-rightside {',
            '    float: right;',
            '}',
            '.rtwysiwyg-lag {',
            '    float: right;',
            '}',
            '.rtwysiwyg-spinner {',
            '    float: left;',
            '}',
            '.gwt-TabBar {',
            '    display:none;',
            '}',
            '.' + DEBUG_LINK_CLS + ':link { color:transparent; }',
            '.' + DEBUG_LINK_CLS + ':link:hover { color:blue; }',
            '.gwt-TabPanelBottom { border-top: 0 none; }',

            '</style>'
         ].join('\n'));
        return toolbar;
    };

    var makeWebsocket = function (url) {
        var socket = new ReconnectingWebSocket(url);
        var out = {
            onOpen: [],
            onClose: [],
            onError: [],
            onMessage: [],
            send: function (msg) { socket.send(msg); },
            close: function () { socket.close(); },
            _socket: socket
        };
        var mkHandler = function (name) {
            return function (evt) {
                for (var i = 0; i < out[name].length; i++) {
                    if (out[name][i](evt) === false) { return; }
                }
            };
        };
        socket.onopen = mkHandler('onOpen');
        socket.onclose = mkHandler('onClose');
        socket.onerror = mkHandler('onError');
        socket.onmessage = mkHandler('onMessage');
        return out;
    };

    var encryptStr = function (str, key) {
        var array = Nacl.util.decodeUTF8(str);
        var nonce = Nacl.randomBytes(24);
        var packed = Nacl.secretbox(array, nonce, key);
        if (!packed) { throw new Error(); }
        return Nacl.util.encodeBase64(nonce) + "|" + Nacl.util.encodeBase64(packed);
    };
    var decryptStr = function (str, key) {
        var arr = str.split('|');
        if (arr.length !== 2) { throw new Error(); }
        var nonce = Nacl.util.decodeBase64(arr[0]);
        var packed = Nacl.util.decodeBase64(arr[1]);
        var unpacked = Nacl.secretbox.open(packed, nonce, key);
        if (!unpacked) { throw new Error(); }
        return Nacl.util.encodeUTF8(unpacked);
    };

    // this is crap because of bencoding messages... it should go away....
    var splitMessage = function (msg, sending) {
        var idx = 0;
        var nl;
        for (var i = ((sending) ? 0 : 1); i < 3; i++) {
            nl = msg.indexOf(':',idx);
            idx = nl + Number(msg.substring(idx,nl)) + 1;
        }
        return [ msg.substring(0,idx), msg.substring(msg.indexOf(':',idx) + 1) ];
    };

    var encrypt = function (msg, key) {
        var spl = splitMessage(msg, true);
        var json = JSON.parse(spl[1]);
        // non-patches are not encrypted.
        if (json[0] !== 2) { return msg; }
        json[1] = encryptStr(JSON.stringify(json[1]), key);
        var res = JSON.stringify(json);
        return spl[0] + res.length + ':' + res;
    };

    var decrypt = function (msg, key) {
        var spl = splitMessage(msg, false);
        var json = JSON.parse(spl[1]);
        // non-patches are not encrypted.
        if (json[0] !== 2) { return msg; }
        if (typeof(json[1]) !== 'string') { throw new Error(); }
        json[1] = JSON.parse(decryptStr(json[1], key));
        var res = JSON.stringify(json);
        return spl[0] + res.length + ':' + res;
    };

    var start = module.exports.start = function (websocketUrl, userName, channel, cryptKey)
    {
        var passwd = 'y';
        var wysiwygDiv = document.getElementById('cke_1_contents');
        var ifr = wysiwygDiv.getElementsByTagName('iframe')[0];
        var doc = ifr.contentWindow.document;
        var socket = makeWebsocket(websocketUrl);
        var onEvent = function () { };

        var toolbar = createRealtimeToolbar('#cke_1_toolbox');
        var userListElement = createUserList(toolbar.find('.rtwysiwyg-toolbar-leftside'));
        var spinner = createSpinner(toolbar.find('.rtwysiwyg-toolbar-rightside'));
        var lagElement = createLagElement(toolbar.find('.rtwysiwyg-toolbar-rightside'));

        var userList

        var allMessages = [];
        var isErrorState = false;
        var initializing = true;
        var recoverableErrorCount = 0;
        var error = function (recoverable, err) {
console.log(new Error().stack);
            console.log('error: ' + err.stack);
            if (recoverable && recoverableErrorCount++ < MAX_RECOVERABLE_ERRORS) { return; }
            var realtime = socket.realtime;
            var docHtml = getDocHTML(doc);
            isErrorState = true;
            handleError(socket, realtime, err, docHtml, allMessages);
        };
        var attempt = function (func) {
            return function () {
                var e;
                try { return func.apply(func, arguments); } catch (ee) { e = ee; }
                if (e) {
                    console.log(e.stack);
                    error(true, e);
                }
            };
        };
        var checkSocket = function () {
            if (isSocketDisconnected(socket, socket.realtime) && !socket.intentionallyClosing) {
                //isErrorState = true;
                //abort(socket, socket.realtime);
                //ErrorBox.show('disconnected', getDocHTML(doc));
                return true;
            }
            return false;
        };

        socket.onOpen.push(function (evt) {
            if (!initializing) {
                socket.realtime.start();
                updateUserList(userName, userListElement, userList);
                return;
            }

            var realtime = socket.realtime =
                ChainPad.create(userName,
                                passwd,
                                channel,
                                getDocHTML(doc),
                                { transformFunction: Otaml.transform });

            //createDebugLink(realtime, doc, allMessages, toolbar);

            setInterval(function () {
                if (initializing || isSocketDisconnected(socket, realtime)) { return; }
                checkLag(realtime, lagElement);
            }, 3000);

            onEvent = function () {
                if (isErrorState) { return; }
                if (initializing) { return; }

                var oldDocText = realtime.getUserDoc();
                var docText = getFixedDocText(doc, ifr.contentWindow);
                var op = attempt(Otaml.makeTextOperation)(oldDocText, docText);

                if (!op) { return; }

                if (op.toRemove > 0) {
                    attempt(realtime.remove)(op.offset, op.toRemove);
                }
                if (op.toInsert.length > 0) {
                    attempt(realtime.insert)(op.offset, op.toInsert);
                }

                if (realtime.getUserDoc() !== docText) {
                    error(false, 'realtime.getUserDoc() !== docText');
                }
            };

            var userDocBeforePatch;
            var incomingPatch = function () {
                if (isErrorState) { return; }
                kickSpinner(spinner);
                if (initializing) { return; }
                userDocBeforePatch = userDocBeforePatch || getFixedDocText(doc, ifr.contentWindow);
                if (PARANOIA && userDocBeforePatch != getFixedDocText(doc, ifr.contentWindow)) {
                    error(false, "userDocBeforePatch != getFixedDocText(doc, ifr.contentWindow)");
                }
                var op = attempt(makeHTMLOperation)(userDocBeforePatch, realtime.getUserDoc());
                if (!op) { return; }
                attempt(HTMLPatcher.applyOp)(
                    userDocBeforePatch, op, doc.body, rangy, ifr.contentWindow);
            };

            realtime.onUserListChange(function (userList) {
                updateUserList(userName, userListElement, userList);
                if (!initializing || userList.indexOf(userName) === -1) { return; }
                // if we spot ourselves being added to the document, we'll switch
                // 'initializing' off because it means we're fully synced.
                initializing = false;
                incomingPatch();
            });

            socket.onMessage.push(function (evt) {
                if (isErrorState) { return; }
                var message = decrypt(evt.data, cryptKey);
                allMessages.push(message);
                if (!initializing) {
                    if (PARANOIA) { onEvent(); }
                    userDocBeforePatch = realtime.getUserDoc();
                }
                realtime.message(message);
            });
            realtime.onMessage(function (message) {
                if (isErrorState) { return; }
                message = encrypt(message, cryptKey);
                try {
                    socket.send(message);
                } catch (e) {
                    error(true, e.stack);
                }
            });

            realtime.onPatch(incomingPatch);

            bindAllEvents(wysiwygDiv, doc.body, onEvent, false);

            setInterval(function () {
                if (isErrorState || checkSocket()) {
                    userListElement.textContent = Messages.reconnecting;
                    lagElement.textContent = '';
                }
            }, 200);

            realtime.start();

            //console.log('started');
        });
        return {
            onEvent: function () { onEvent(); }
        };
    };

    return module.exports;
});
