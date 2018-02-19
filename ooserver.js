
const sockjs = require('sockjs');
const co = require('co');
try {
    config = require('./config');
} catch (e) {
    console.log("You can customize the configuration by copying config.example.js to config.js");
    config = require('./config.example');
}
var origin = config.httpUnsafeOrigin || 'http://localhost:3000/';

exports.install = function(server, callbackFunction) {
var sockjs_opts = {sockjs_url: ""},
sockjs_echo = sockjs.createServer(sockjs_opts),
urlParse = new RegExp("^/common/onlyoffice/doc/([0-9-.a-zA-Z_=]*)/c.+", 'i');

console.log("Start ooserver");
console.log("Port " + sockjs_echo.port);

function getBaseUrl(protocol, hostHeader, forwardedProtoHeader, forwardedHostHeader) {
  var url = '';
  if (forwardedProtoHeader) {
    url += forwardedProtoHeader;
  } else if (protocol) {
    url += protocol;
  } else {
    url += 'http';
  }
  url += '://';
  if (forwardedHostHeader) {
    url += forwardedHostHeader;
  } else if (hostHeader) {
    url += hostHeader;
  } else {
    url += origin.slice(0, -1);
  }
  return url;
}
function getBaseUrlByConnection(conn) {
  return getBaseUrl('', conn.headers['host'], conn.headers['x-forwarded-proto'], conn.headers['x-forwarded-host']);
}

function sendData(conn, data) {
  conn.write(JSON.stringify(data));
}
function sendDataWarning(conn, msg) {
  sendData(conn, {type: "warning", message: msg});
}
function sendDataMessage(conn, msg) {
  sendData(conn, {type: "message", messages: msg});
}

sockjs_echo.on('connection', function(conn) {
    console.log("ooserver in connection");
    if (null == conn) {
      console.log("null == conn");
      return;
    }
    conn.baseUrl = getBaseUrlByConnection(conn);
    console.log("BaseUrl: " + conn.baseUrl);
    conn.sessionIsSendWarning = false;
    conn.sessionTimeConnect = conn.sessionTimeLastAction = new Date().getTime();
    console.log("ooserver setting handlers");
    conn.on('data', function(message) {
      console.log("In data");
      return co(function* () {
       try {
        console.log("Received: " + message);
        var data = JSON.parse(message);
        switch (data.type) {
         case 'auth':
          console.log("Response auth");
          var fileUrl = origin + "oodoc/test.bin";
          if (data.openCmd.format=="xlsx")
            fileUrl = origin + "oocell/test.bin"
          else if (data.openCmd.format=="pptx")
            fileUrl = origin + "ooslide/test.bin"
          sendData(conn, {"type":"auth","result":1,"sessionId":"08e77705-dc5c-477d-b73a-b1a7cbca1e9b","sessionTimeConnect":1494226099270,"participants":[]});
          sendData(conn, {"type":"documentOpen","data":{"type":"open","status":"ok","data":{"Editor.bin":fileUrl}}});
          break;
         default:
          break;
         }
        } catch (e) {
          console.log("error receiving response: docId = %s type = %s\r\n%s", docId, (data && data.type) ? data.type : 'null', e.stack);
        }
      });
    });
    conn.on('error', function() {
       console.log("On error");
    });
    conn.on('close', function() {
      return co(function* () {
       console.log("On close");
      });
    });
    console.log("ooserver sending welcome message");
    sendData(conn, {
          type: 'license',
          license: {
            type: 3,
            light: false,
            trial: false,
            rights: 1,
            buildVersion: "4.3.3",
            buildNumber: 4,
            branding: false
          }
         });
});

  sockjs_echo.installHandlers(server, {prefix: '/common/onlyoffice/doc/[0-9-.a-zA-Z_=]*/c', log: function(severity, message) {
    console.log(message);
  }});

  callbackFunction();
};
