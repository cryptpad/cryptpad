define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/messages.js',
    '/common/crypto.js',
    '/common/toolbar.js',
    '/common/chainpad.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/common/otaml.js',
    '/customize/sheet.js'
], function (Config, Messages, Crypto, Toolbar) {
    var $ = jQuery;
    var ChainPad = window.ChainPad;
    var Otaml = window.Otaml;

    var module = { exports: {} };

    var sheetToJson = function (ifrWindow) {
        var xx = ifrWindow.sh[0].jS;
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
            window.location.href = window.location.href + '#' + Crypto.genKey();
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

        var key = Crypto.parseKey(window.location.hash.substring(1));
        var myUserName = Crypto.rand64(8);

        var socket = new WebSocket(Config.websocketURL);
        socket.onopen = function () {
            var realtime = ChainPad.create(
                myUserName, 'x', key.channel, '', { transformFunction: Otaml.transform });
            socket.onmessage = function (evt) {
                var message = Crypto.decrypt(evt.data, key.cryptKey);
                realtime.message(message);
            };
            realtime.onMessage(function (message) {
                message = Crypto.encrypt(message, key.cryptKey);
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
            Toolbar.create(ifrw.$('.jSTitle'), myUserName, realtime);

            realtime.start();
        };
    });
});
