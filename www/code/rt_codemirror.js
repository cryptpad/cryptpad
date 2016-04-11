define([
  //'jquery',
  //'RTWiki_WebHome_sharejs_textarea',
  //'RTWiki_ErrorBox',
  //'RTWiki_WebHome_chainpad'
  '/common/crypto.js',
  '/code/errorbox.js',
  '/common/messages.js',
  '/code/toolbar.js',
  '/common/chainpad.js',
  '/common/otaml.js',
  '/bower_components/jquery/dist/jquery.min.js'
], function(Crypto, ErrorBox, Messages, Toolbar) {
    var $ = window.jQuery;
    var ChainPad = window.ChainPad;
    var Otaml = window.Otaml;
    var module = { exports: {} };

    // How long to wait before determining that the connection is lost.
    var MAX_LAG_BEFORE_DISCONNECT = 30000;

    var MAX_RECOVERABLE_ERRORS = 15;

    var warn = function (x) { };
    var debug = function (x) { };
    //debug = function (x) { console.log(x) };
    warn = function (x) { console.log(x); };

    var uid = function () {
        return 'rtwiki-uid-' + String(Math.random()).substring(2);
    };

    // only used within updateUserList so far
    var decodeUser = function (all, one) {
        return decodeURIComponent(one);
    };

    var updateUserList = function (myUserName, listElement, userList, messages) {
        var meIdx = userList.indexOf(myUserName);
        if (meIdx === -1) {
            listElement.text(messages.disconnected);
            return;
        }
        var userMap = {};
        userMap[messages.myself] = 1;
        userList.splice(meIdx, 1);

        for (var i = 0; i < userList.length; i++) {
            var user;
            if (userList[i].indexOf('xwiki:XWiki.XWikiGuest') === 0) {
                if (userMap.Guests) {
                    user = messages.guests;
                } else {
                    user = messages.guest;
                }
            } else {
                user = userList[i].replace(/^.*-([^-]*)%2d[0-9]*$/, decodeUser);
            }
            userMap[user] = userMap[user] || 0;
            if (user === messages.guest && userMap[user] > 0) {
                userMap.Guests = userMap[user];
                delete userMap[user];
                user = messages.guests;
            }
            userMap[user]++;
        }
        var userListOut = [];
        for (var name in userMap) {
            if (userMap[name] > 1) {
                userListOut.push(userMap[name] + " " + name);
            } else {
                userListOut.push(name);
            }
        }
        if (userListOut.length > 1) {
            userListOut[userListOut.length-1] =
                messages.and + ' ' + userListOut[userListOut.length-1];
        }
        listElement.text(messages.editingWith + ' ' + userListOut.join(', '));
    };

    var createUserList = function (realtime, myUserName, container, messages) {
        var id = uid();
        $(container).prepend('<div class="rtwiki-userlist" id="'+id+'"></div>');
        var listElement = $('#'+id);
        return listElement;
    };

    var checkLag = function (realtime, lagElement, messages) {
        var lag = realtime.getLag();
        var lagSec = lag.lag/1000;
        var lagMsg = messages.lag + ' ';
        if (lag.waiting && lagSec > 1) {
            lagMsg += "?? " + Math.floor(lagSec);
        } else {
            lagMsg += lagSec;
        }
        lagElement.text(lagMsg);
    };

    var createLagElement = function (socket, realtime, container, messages) {
        var id = uid();
        $(container).append('<div class="rtwiki-lag" id="'+id+'"></div>');
        var lagElement = $('#'+id);
        var intr = setInterval(function () {
            checkLag(realtime, lagElement, messages);
        }, 3000);
        socket.onClose.push(function () { clearTimeout(intr); });
        return lagElement;
    };

    var isSocketDisconnected = function (socket, realtime) {
        return socket.readyState === socket.CLOSING ||
            socket.readyState === socket.CLOSED ||
            (realtime.getLag().waiting && realtime.getLag().lag > MAX_LAG_BEFORE_DISCONNECT);
    };

    var setAutosaveHiddenState = function (hidden) {
        var elem = $('#autosaveControl');
        if (hidden) {
            elem.hide();
        } else {
            elem.show();
        }
    };

    // CodeMirror/RTWiki
    // Trapping Keyboard Events
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
  
    var startWebSocketCM = function (windowCM,
                                   websocketUrl,
                                   userName,
                                   channel,
                                   messages,
                                   cryptKey)
    {
        debug("Opening websocket");
        var textArea = windowCM.document.getElementById('editor1');
        var cmDiv = windowCM.document.getElementsByClassName('CodeMirror')[0];
        var cmEditor = cmDiv.CodeMirror;
        var onEvent = function () { };
        var socket = new WebSocket(websocketUrl);
        socket.onClose = [];
        socket.onMessage = [];
        var initState = $(textArea).val();
        var realtime = socket.realtime = ChainPad.create(userName, 'x', channel, initState);
        var toolbar = realtime.toolbar = Toolbar.create(windowCM.$('#cme_toolbox'), userName, realtime);
        // for debugging
        window.rtwiki_chainpad = realtime;

        // http://jira.xwiki.org/browse/RTWIKI-21
        var onbeforeunload = window.onbeforeunload || function () { };
        window.onbeforeunload = function (ev) {
            socket.intentionallyClosing = true;
            return onbeforeunload(ev);
        };
        var isErrorState = false;
        var recoverableErrorCount = 0;
        var error = function (recoverable, err) {
            console.log(new Error().stack);
            console.log('error: ' + err.stack);
            if (recoverable && recoverableErrorCount++ < MAX_RECOVERABLE_ERRORS) { return; }
            var realtime = socket.realtime;
            var docHtml = $(textArea).val();
            isErrorState = true;

            // FIXME pull this in from more mainline version
            //handleError(socket, realtime, err, docHtml, allMessages);
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
            if (socket.intentionallyClosing || isErrorState) { return false; }
            if (isSocketDisconnected(socket, realtime)) {
                realtime.abort();
                realtime.toolbar.failed();
                socket.close();
                ErrorBox.show('disconnected');
                isErrorState = true;
                return true;
            }
            return false;
        };
        
        socket.onopen = function (evt) {

            var initializing = true;

            var userListElement = createUserList(realtime,
                                                 userName,
                                                 [],
                                                 messages);
            userListElement.text(messages.initializing);
            createLagElement(socket,
                             realtime,
                             [],
                             messages);

            setAutosaveHiddenState(true);
            onEvent = function () {
                if (isErrorState) { return; }
                if (initializing) { return; }
                var oldDocText = realtime.getUserDoc();
                var docText = $(textArea).val();
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
            
            socket.onMessage.push(function (evt) {
                debug(evt.data);
                var message = Crypto.decrypt(evt.data, cryptKey);
                realtime.message(message);
            });
            realtime.onMessage(function (message) { message = Crypto.encrypt(message, cryptKey);socket.send(message); });
            
            var userDocBeforePatch;
            var incomingPatch = function () {
                if (isErrorState || initializing) { return; }
                var textAreaVal = $(textArea).val();
                                console.log($(textArea).val());
                userDocBeforePatch = userDocBeforePatch || textAreaVal;
                if (userDocBeforePatch !== textAreaVal) {
                  //error(false, "userDocBeforePatch !== textAreaVal");
                }
                var op = attempt(Otaml.makeTextOperation)(userDocBeforePatch, realtime.getUserDoc());
                if (typeof op === 'undefined') {
                    warn("TypeError: op is undefined");
                    return;
                } 

                var oldValue = textAreaVal;
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
                $(textArea).val(newValue);
                userDocBeforePatch = newValue;
                cmEditor.setValue(newValue);
                if(newCursor) {
                  cmEditor.setCursor(newCursor);
                }
                else {
                  cmEditor.setSelection(newSelection[0], newSelection[1]);
                }
            };
            realtime.onPatch(incomingPatch);
            realtime.onUserListChange(function (userList) {
                if (initializing && userList.indexOf(userName) > -1) {
                    initializing = false;
                    incomingPatch();
                }
                if (!initializing) {
                    updateUserList(userName, userListElement, userList, messages);
                }
            });
            debug("Bound websocket");
            bindAllEvents(cmDiv, onEvent, false);
            setInterval(function () {
                if (isErrorState || checkSocket()) {
                    toolbar.reconnecting();
                }
            }, 200);
            realtime.start();
            toolbar.connected();
        };
        socket.onclose = function (evt) {
            for (var i = 0; i < socket.onClose.length; i++) {
                if (socket.onClose[i](evt) === false) { return; }
            }
        };
        socket.onmessage = function (evt) {
            for (var i = 0; i < socket.onMessage.length; i++) {
                if (socket.onMessage[i](evt) === false) { return; }
            }
        };
        socket.onerror = function (err) {
            warn(err);
            checkSocket(realtime);
        };

        var to = setInterval(function () {
            checkSocket(realtime);
        }, 500);
        socket.onClose.push(function () {
            clearTimeout(to);
            if (toolbar && typeof toolbar.remove === 'function') {
                toolbar.remove();
            } else {
                warn("toolbar.remove is not a function"); //why not?
            }
            setAutosaveHiddenState(false);
        });
        socket.onEvent = function(){
          onEvent();
        };
        return socket;
    };
    
    var cmEditor = function (cmWindow, websocketUrl, userName, messages, channel, cryptkey) {
        var cmTextarea = $(cmWindow.document.getElementById('editor1'));
        if (!cmTextarea.length) {
            warn("WARNING: Could not find textarea to bind to");
            return;
        }
        var socket = startWebSocketCM(cmWindow,
                                websocketUrl,
                                userName,
                                channel,
                                messages,
                                cryptkey);
        return {
            onEvent: function() {
              socket.onEvent();
            }
        };
    };
  
    var start = module.exports.start = function (window, websocketUrl,
                                               userName,
                                               channel,
                                               cryptkey)
    {
        if (!websocketUrl) {
            throw new Error("No WebSocket URL, please ensure Realtime Backend is installed.");
        }
        var cme = cmEditor(window, websocketUrl+'_old', userName, Messages, channel, cryptkey);
        return {
            onEvent: function () { 
              cme.onEvent();
            }
        };
    };

    return module.exports;
});
