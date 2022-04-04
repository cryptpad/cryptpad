(function () { 
    var first = true;
    window.addEventListener('error', function (ev) {
        if (!ev) { return; }
        var srcElement = ev.srcElement;
        if (!srcElement) { return; }
        var nodeName = srcElement.nodeName;
        if (nodeName !== 'SCRIPT') { return; }
        var src = srcElement.src;
        if (!/\/bower_components\/.*/.test(src)) { return; }
        if (first) {
            document.write(`<p>It's possible that this server's administrators forgot to install its client-side dependencies with 'bower update'.</p>`);
            first = false;
        }
        document.write(`<p>Failed to load <code>${src}</code>.</p>`);
    }, true);
}());
