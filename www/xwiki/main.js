// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/requireconfig.js',
    '/common/sframe-common-outer.js',
    '/common/common-hash.js',   
    '/common/cryptget.js',   
    '/bower_components/hyperjson/hyperjson.js'
], function (nThen, ApiConfig, DomReady, RequireConfig, SFCommonO, Hash, Crypt, Hyperjson) {
    var requireConfig = RequireConfig();


    function receiveMessage(message) {
      if (message.data.type=="get") {
       console.log(message);
       var opts = { initialState : '{}' };
       var parsed = Hash.parsePadUrl(message.data.url);
       Crypt.get(parsed.hash, function (err, val) {
                if (err) {
                    console.log("Failed1");
                }
                if (!val) {
                    console.log("Failed2");
                }
                var data = JSON.parse(val);
                console.log(data);
                console.log(message.data);
                console.log("HERE"); 
                if (message.data.padType=="pad") {
                 var dom = Hyperjson.toDOM(data);
                 window.parent.postMessage({ content : dom.outerHTML }, '*');
                } else {
                 window.parent.postMessage(data, '*');
                }
            }, opts);
      } else if (message.data.type=="put") {
        console.log("In pad creation");
        console.log(message);
        var opts = { initialState : '{}' };
        var hash = Hash.createRandomHash(message.data.padType);
        console.log(hash);
        var data;
        if (message.data.padType=="pad") {
          var div = document.createElement("body")
          div.innerHTML = message.data.content
          data = Hyperjson.fromDOM(div);
          data.push({ title: message.data.title });
        } else {
          data = { "title" : message.data.title, "content" : message.data.content, highlightMode: "gfm", authorMarks: {}, metadata : { "title" : message.data.title } };
        }
        console.log(data);
        Crypt.put(hash, JSON.stringify(data), function(err, val) {
                if (err) {
                    console.log("Failed1");
                }
                if (!val) {
                    console.log("Failed2");
                }
                console.log(val);
                window.parent.postMessage({ href : "#" + hash }, '*');
        }, opts);
      }
    }

    window.addEventListener('message', receiveMessage);

    // Loaded in load #2
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        var req = {
            cfg: requireConfig,
            req: [ '/common/loading.js' ],
            pfx: window.location.origin
        };
        window.rc = requireConfig;
        window.apiconf = ApiConfig;
        document.getElementById('sbox-iframe').setAttribute('src',
            ApiConfig.httpSafeOrigin + '/xwiki/inner.html?' + requireConfig.urlArgs +
                '#' + encodeURIComponent(JSON.stringify(req)));

        // This is a cheap trick to avoid loading sframe-channel in parallel with the
        // loading screen setup.
        var done = waitFor();
        var onMsg = function (msg) {
            var data = JSON.parse(msg.data);
            if (data.q !== 'READY') { return; }
            window.removeEventListener('message', onMsg);
            var _done = done;
            done = function () { };
            _done();
        };
        window.addEventListener('message', onMsg);
    }).nThen(function (/*waitFor*/) {
        SFCommonO.start({
            noRealtime: true,
            messaging: true,
        });
        // window.parent.postMessage({ type: "ready2" }, '*');
    });
});
