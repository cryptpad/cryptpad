// bg #e7e7e7
// blue #0087FF
// text #3F4141
define([
    '/customize/messages.js',
    'less!/customize/src/less2/include/loading.less'
], function (Messages) {
    var urlArgs = window.location.href.replace(/^.*\?([^\?]*)$/, function (all, x) { return x; });
    var elem = document.createElement('div');
    elem.setAttribute('id', 'cp-loading');
    elem.innerHTML = [
        '<div class="cp-loading-logo">',
            '<img class="cp-loading-cryptofist" src="/customize/CryptPad_logo.svg?' + urlArgs + '">',
        '</div>',
        '<div class="cp-loading-container">',
            '<div class="cp-loading-spinner-container">',
                '<span class="cp-spinner"></span>',
            '</div>',
            '<div class="cp-loading-progress">',
                '<div class="cp-loading-progress-list"></div>',
                '<div class="cp-loading-progress-container"></div>',
            '</div>',
            '<p id="cp-loading-message"></p>',
        '</div>'
    ].join('');
    var built = false;

    var types = ['less', 'drive', 'migrate', 'sf', 'team', 'pad', 'end']; // Msg.loading_state_0, loading_state_1, loading_state_2, loading_state_3, loading_state_4, loading_state_5
    var current, progress;
    var makeList = function (data) {
        var c = types.indexOf(data.type);
        current = c;
        var getLi = function (i) {
            var check = (i < c || (i === c && data.progress >= 100)) ? 'fa-check-square-o'
                                                                      : 'fa-square-o';
            var percentStr = '';
            if (i === c) {
                var p = Math.min(Math.floor(data.progress), 100);
                percentStr = '<span class="percent">('+p+'%)</span>';
            }
            return '<li><i class="fa '+check+'"></i><span>'+Messages['loading_state_'+i]+'</span>' + percentStr;
        };
        var list = '<ul>';
        types.forEach(function (el, i) {
            if (el === "end") { return; }
            list += getLi(i);
        });
        list += '</ul>';
        return list;
    };
    var makeBar = function (data) {
        var c = types.indexOf(data.type);
        var l = types.length - 1; // don't count "end" as a type
        var progress = Math.min(data.progress, 100);
        var p = (progress / l) + (100 * c / l);
        var bar = '<div class="cp-loading-progress-bar">'+
                    '<div class="cp-loading-progress-bar-value" style="width:'+p+'%"></div>'+
                  '</div>';
        return bar;
    };

    var hasErrored = false;
    var isOffline = false;
    var updateLoadingProgress = function (data) {
        if (!built || !data) { return; }

        // If we receive a "offline" event, show the warning text
        if (data.type === "offline") {
            try {
                isOffline = true;
                document.querySelector('#cp-loading-message').setAttribute('style', 'display:block;');
                document.querySelector('#cp-loading-message').innerText = Messages.offlineError;
            } catch (e) { console.error(e); }
            return;
        }

        // If we receive a new event and we were offline, remove
        // the offline warning text
        if (isOffline) {
            try {
                isOffline = false;
                document.querySelector('#cp-loading-message').setAttribute('style', 'display:none;');
            } catch (e) { console.error(e); }
        }

        // Make sure progress doesn't go backward
        var c = types.indexOf(data.type);
        if (c < current) { return console.debug(data); }
        if (c === current && progress > data.progress) { return console.debug(data); }
        progress = data.progress;

        try {
            var el1 = document.querySelector('.cp-loading-spinner-container');
            if (el1) { el1.style.display = 'none'; }
            var el2 = document.querySelector('.cp-loading-progress-list');
            if (el2) { el2.innerHTML = makeList(data); }
            var el3 = document.querySelector('.cp-loading-progress-container');
            if (el3) { el3.innerHTML = makeBar(data); }
        } catch (e) {
            //if (!hasErrored) { console.error(e); }
        }
    };
    window.CryptPad_updateLoadingProgress = updateLoadingProgress;

    window.CryptPad_loadingError = function (err) {
        if (!built) { return; }

        if (err === 'Error: XDR encoding failure') {
            console.warn(err);
            return;
        }

        hasErrored = true;
        var err2;
        if (err === 'Script error.') {
            err2 = Messages.error_unhelpfulScriptError;
        }

        try {
            var node = document.querySelector('.cp-loading-progress');
            if (!node) { return; }
            if (node.parentNode) { node.parentNode.removeChild(node); }
            document.querySelector('.cp-loading-spinner-container').setAttribute('style', 'display:none;');
            document.querySelector('#cp-loading-message').setAttribute('style', 'display:block;');
            document.querySelector('#cp-loading-message').innerText = err2 || err;
        } catch (e) { console.error(e); }
    };
    return function () {
        built = true;
        var intr;
        var append = function () {
            if (!document.body) { return; }
            clearInterval(intr);
            document.body.appendChild(elem);
        };
        intr = setInterval(append, 100);
        append();
    };
});
