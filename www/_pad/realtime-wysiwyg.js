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
    '/pad/html-patcher.js',
    '/pad/errorbox.js',
    '/common/messages.js',
    '/bower_components/reconnectingWebsocket/reconnecting-websocket.js',
    '/common/crypto.js',
    '/common/toolbar.js',
    '/pad/rangy.js',
    '/common/chainpad.js',
    '/common/otaml.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (HTMLPatcher, ErrorBox, Messages, ReconnectingWebSocket, Crypto, Toolbar) {

window.ErrorBox = ErrorBox;

    var $ = window.jQuery;
    var Rangy = window.rangy;
    Rangy.init();
    var ChainPad = window.ChainPad;
    var Otaml = window.Otaml;

    var PARANOIA = true;

    var module = { exports: {} };

    /**
     * If an error is encountered but it is recoverable, do not immediately fail
     * but if it keeps firing errors over and over, do fail.
     */
    var MAX_RECOVERABLE_ERRORS = 15;

    /** Maximum number of milliseconds of lag before we fail the connection. */
    var MAX_LAG_BEFORE_DISCONNECT = 20000;

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

    var isSocketDisconnected = function (socket, realtime) {
        var sock = socket._socket;
        return sock.readyState === sock.CLOSING
            || sock.readyState === sock.CLOSED
            || (realtime.getLag().waiting && realtime.getLag().lag > MAX_LAG_BEFORE_DISCONNECT);
    };

    var abort = function (socket, realtime) {
        realtime.abort();
        realtime.toolbar.failed();
        try { socket._socket.close(); } catch (e) { }
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
            }
            throw new Error();
        });
    };

    var getFixedDocText = function (doc, ifrWindow) {
        var docText = getDocHTML(doc);
        docText = fixChrome(docText, doc, ifrWindow);
        docText = fixSafari(docText);
        return docText;
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

    var start = module.exports.start =
        function (window, websocketUrl, userName, channel, cryptKey)
    {
        var passwd = 'y';
        var wysiwygDiv = window.document.getElementById('cke_1_contents');
        var ifr = wysiwygDiv.getElementsByTagName('iframe')[0];
        var doc = ifr.contentWindow.document;
        var socket = makeWebsocket(websocketUrl);
        var onEvent = function () { };

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
                return;
            }

            var realtime = socket.realtime =
                ChainPad.create(userName,
                                passwd,
                                channel,
                                getDocHTML(doc),
                                { transformFunction: Otaml.transform });

            var toolbar = realtime.toolbar =
                Toolbar.create(window.$('#cke_1_toolbox'), userName, realtime);

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
var now = function () { return new Date().getTime(); };
            var userDocBeforePatch;
            var incomingPatch = function () {
                if (isErrorState || initializing) { return; }
                console.log("before patch " + now());
                userDocBeforePatch = userDocBeforePatch || getFixedDocText(doc, ifr.contentWindow);
                if (PARANOIA && userDocBeforePatch !== getFixedDocText(doc, ifr.contentWindow)) {
                    error(false, "userDocBeforePatch !== getFixedDocText(doc, ifr.contentWindow)");
                }
                var op = attempt(makeHTMLOperation)(userDocBeforePatch, realtime.getUserDoc());
                if (!op) { return; }
                attempt(HTMLPatcher.applyOp)(
                    userDocBeforePatch, op, doc.body, Rangy, ifr.contentWindow);
                console.log("after patch " + now());
            };

            realtime.onUserListChange(function (userList) {
                if (!initializing || userList.indexOf(userName) === -1) { return; }
                // if we spot ourselves being added to the document, we'll switch
                // 'initializing' off because it means we're fully synced.
                initializing = false;
                incomingPatch();
            });

            socket.onMessage.push(function (evt) {
                if (isErrorState) { return; }
                var message = Crypto.decrypt(evt.data, cryptKey);
                allMessages.push(message);
                if (!initializing) {
                    if (PARANOIA) { onEvent(); }
                    userDocBeforePatch = realtime.getUserDoc();
                }
                realtime.message(message);
            });
            realtime.onMessage(function (message) {
                if (isErrorState) { return; }
                message = Crypto.encrypt(message, cryptKey);
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
                    toolbar.reconnecting();
                }
            }, 200);

            realtime.start();
            toolbar.connected();

            //console.log('started');
        });
        return {
            onEvent: function () { onEvent(); }
        };
    };

    return module.exports;
});
