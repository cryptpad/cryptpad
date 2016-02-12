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
    '/code/html-patcher.js',
    '/code/errorbox.js',
    '/common/messages.js',
    '/bower_components/reconnectingWebsocket/reconnecting-websocket.js',
    '/common/crypto.js',
    '/common/toolbar.js',
    '/code/rangy.js',
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

    var bindAllEvents = function (cmDiv, onEvent, unbind)
    {
        bindEvents(cmDiv,
                   ['textInput', 'keydown', 'keyup', 'select', 'cut', 'paste', 'mousedown','mouseup','click'],
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
        return $(doc).val();
    };

    var transformCursorCMRemove = function(text, cursor, pos, length) {
      var newCursor = cursor;
      var textLines = text.substr(0, pos).split("\n");
      var removedTextLineNumber = textLines.length-1;
      var removedTextColumnIndex = textLines[textLines.length-1].length;
      var removedLines = text.substr(pos, length).split("\n").length - 1;
      if(cursor.line > (removedTextLineNumber + removedLines)) {
        newCursor.line -= removedLines;
      }
      else if(removedLines > 0 && cursor.line === (removedTextLineNumber+removedLines)) {
        var lastLineCharsRemoved = text.substr(pos, length).split("\n")[removedLines].length;
        if(cursor.ch >= lastLineCharsRemoved) {
          newCursor.line = removedTextLineNumber;
          newCursor.ch = removedTextColumnIndex + cursor.ch - lastLineCharsRemoved;
        }
        else {
          newCursor.line -= removedLines;
          newCursor.ch = removedTextColumnIndex;
        }
      }
      else if(cursor.line === removedTextLineNumber && cursor.ch > removedTextLineNumber) {
        newCursor.ch -= Math.min(length, cursor.ch-removedTextLineNumber);
      }
      return newCursor;
    };
    var transformCursorCMInsert = function(oldtext, cursor, pos, text) {
      var newCursor = cursor;
      var textLines = oldtext.substr(0, pos).split("\n");
      var addedTextLineNumber = textLines.length-1;
      var addedTextColumnIndex = textLines[textLines.length-1].length;
      var addedLines = text.split("\n").length - 1;
      if(cursor.line > addedTextLineNumber) {
        newCursor.line += addedLines;
      }
      else if(cursor.line === addedTextLineNumber && cursor.ch > addedTextColumnIndex) {
        newCursor.line += addedLines;
        if(addedLines > 0) {
          newCursor.ch = newCursor.ch - addedTextColumnIndex + text.split("\n")[addedLines].length;
        }
        else {
          newCursor.ch += text.split("\n")[addedLines].length;
        }
      }
      return newCursor;
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
        //var wysiwygDiv = window.document.getElementById('cke_1_contents');
        var doc = window.document.getElementById('editor1');
        var cmDiv = window.document.getElementsByClassName('CodeMirror')[0];
        var cmEditor = cmDiv.CodeMirror;
        //var ifr = wysiwygDiv.getElementsByTagName('iframe')[0];
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
                Toolbar.create(window.$('#cme_toolbox'), userName, realtime);

            onEvent = function () {
                if (isErrorState) { return; }
                if (initializing) { return; }

                var oldDocText = realtime.getUserDoc();
                var docText = getDocHTML(doc);
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
                if (isErrorState || initializing) { return; }
                userDocBeforePatch = userDocBeforePatch || getDocHTML(doc);
                if (PARANOIA && userDocBeforePatch != getDocHTML(doc)) {
                    error(false, "userDocBeforePatch != getDocHTML(doc)");
                }
                var op = attempt(Otaml.makeTextOperation)(userDocBeforePatch, realtime.getUserDoc());
                var oldValue = getDocHTML(doc);
                var newValue = realtime.getUserDoc();
                // Fix cursor and/or selection
                var oldCursor = cmEditor.getCursor();
                var oldCursorCMStart = cmEditor.getCursor('from');
                var oldCursorCMEnd = cmEditor.getCursor('to');
                var newCursor;
                var newSelection;
                if(oldCursorCMStart !== oldCursorCMEnd) { // Selection
                    if (op.toRemove > 0) {
                        newSelection = [transformCursorCMRemove(oldValue, oldCursorCMStart, op.offset, op.toRemove), transformCursorCMRemove(oldValue, oldCursorCMEnd, op.offset, op.toRemove)];
                    }
                    if (op.toInsert.length > 0) {
                        newSelection = [transformCursorCMInsert(oldValue, oldCursorCMStart, op.offset, op.toInsert), transformCursorCMInsert(oldValue, oldCursorCMEnd, op.offset, op.toInsert)];
                    }
                }
                else { // Cursor
                    if (op.toRemove > 0) {
                        newCursor = transformCursorCMRemove(oldValue, oldCursor, op.offset, op.toRemove);
                    }
                    if (op.toInsert.length > 0) {
                        newCursor = transformCursorCMInsert(oldValue, oldCursor, op.offset, op.toInsert);
                    }
                }
                $(doc).val(newValue);
                cmEditor.setValue(newValue);
                if(newCursor) {
                  cmEditor.setCursor(newCursor);
                }
                else {
                  cmEditor.setSelection(newSelection[0], newSelection[1]);
                }
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

            bindAllEvents(cmDiv, onEvent, false);

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
