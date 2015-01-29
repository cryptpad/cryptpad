define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/messages.js',
    '/common/toolbar.js',
    '/common/chainpad.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/common/otaml.js'
], function (Config, Messages) {
    var Nacl = window.nacl;
    var $ = jQuery;
    var ChainPad = window.ChainPad;
    var Otaml = window.Otaml;
    var Toolbar = window.Toolbar;

    var module = { exports: {} };

    var parseKey = function (str) {
        var array = Nacl.util.decodeBase64(str);
        var hash = Nacl.hash(array);
        return { lookupKey: hash.subarray(32), cryptKey: hash.subarray(0,32) };
    };

    var genKey = function () {
        return Nacl.util.encodeBase64(Nacl.randomBytes(18));
    };

    var userName = function () {
        return 'Other-' + Nacl.util.encodeBase64(Nacl.randomBytes(8));
    };

    var sheetToJson = function (ifrWindow) {
        var xx = ifrWindow.sh[0].jS
        var m = [];
        for (var i = 0; i < xx.spreadsheets.length; i++) {
          m[i]=[];
          var sheet = xx.spreadsheets[i];
          for (var j = 1; j < sheet.length; j++) {
            m[i][j]=[];
            var row = sheet[j];
            for (var k = 1; k < row.length; k++) {
              var col = row[k];
              m[i][j][k] = { value: col.value, formula: col.formula };
            }
          }
        }
        return m;
    };

    var jsonToSheet = function (ifrWindow, json) {
        var xx = ifrWindow.sh[0].jS;
        for (var i = 0; i < xx.spreadsheets.length; i++) {
          var sheet = xx.spreadsheets[i];
          for (var j = 1; j < sheet.length; j++) {
            var row = sheet[j];
            for (var k = 1; k < row.length; k++) {
              var col = row[k];
              var jcol = json[i][j][k];
              if (jcol.value === col.value && jcol.formula === col.formula) { continue; }
              col.value = jcol.value;
              col.formula = jcol.formula;
              col.displayValue();
            }
          }
        }
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

    var applyChange = function(ctx, oldval, newval) {
      if (oldval === newval) return;

      var commonStart = 0;
      while (oldval.charAt(commonStart) === newval.charAt(commonStart)) {
        commonStart++;
      }

      var commonEnd = 0;
      while (oldval.charAt(oldval.length - 1 - commonEnd) === newval.charAt(newval.length - 1 - commonEnd) &&
          commonEnd + commonStart < oldval.length && commonEnd + commonStart < newval.length) {
        commonEnd++;
      }

      if (oldval.length !== commonStart + commonEnd) {
        ctx.remove(commonStart, oldval.length - commonStart - commonEnd);
      }
      if (newval.length !== commonStart + commonEnd) {
        ctx.insert(commonStart, newval.slice(commonStart, newval.length - commonEnd));
      }
    };

    $(function () {

        if (window.location.href.indexOf('#') === -1) {
            window.location.href = window.location.href + '#' + genKey();
        }
        $(window).on('hashchange', function() {
            window.location.reload();
        });

        var $sheetJson = $('#sheet-json');
        var ifrw = $('iframe')[0].contentWindow;
        var sheetEvent = function (realtime) {
            var sheetJson = JSON.stringify(sheetToJson(ifrw));
            applyChange(realtime, realtime.getUserDoc(), sheetJson);
            $sheetJson.text(sheetJson);
        };

        var eventPending = false;
        var realtimeEvent = function (realtime) {
            if (eventPending) { return; }
            eventPending = true;
            setTimeout(function () {
                eventPending = false;
                try{
                    var data = window.data = realtime.getUserDoc();
                    $sheetJson.text(data);
                    var json = JSON.parse(data);
                    jsonToSheet(ifrw, json);
                }catch(e) { console.log(e.stack); }
            }, 0);
        };

        var key = parseKey(window.location.hash.substring(1));
        var channel = Nacl.util.encodeBase64(key.lookupKey).substring(0,10);
        var myUserName = userName();

        var socket = new WebSocket(Config.websocketURL);
        socket.onopen = function () {
            var realtime = ChainPad.create(
                myUserName, 'x', channel, '', { transformFunction: Otaml.transform });
            socket.onmessage = function (evt) {
                var message = decrypt(evt.data, key.cryptKey);
                realtime.message(message);
            };
            realtime.onMessage(function (message) {
                message = encrypt(message, key.cryptKey);
                try {
                    socket.send(message);
                } catch (e) {
                    console.log(e.stack);
                }
            });
            ifrw.sh.on('sheetCellEdited', function () { sheetEvent(realtime); });
            sheetEvent(realtime);
            realtime.onPatch(function () { realtimeEvent(realtime); });

            ifrw.$('.jSTitle').html('');
            Toolbar(ifrw.$, ifrw.$('.jSTitle'), Messages, myUserName, realtime);

            realtime.start();
        };
    });
});
