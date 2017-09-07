define([
    'less!/customize/src/less/loading.less'
], function () {
    var urlArgs = window.location.href.replace(/^.*\?([^\?]*)$/, function (all, x) { return x; });
    var elem = document.createElement('div');
    elem.setAttribute('id', 'loading');
    elem.innerHTML = [
        '<div class="loadingContainer">',
            '<img class="cryptofist" src="/customize/cryptpad-new-logo-colors-logoonly.png?' + urlArgs + '">',
            '<div class="spinnerContainer">',
                '<span class="fa fa-circle-o-notch fa-spin fa-4x fa-fw"></span>',
            '</div>',
            '<p id="cp-loading-message"></p>',
        '</div>'
    ].join('');
    var intr;
    var append = function () {
        if (!document.body) { return; }
        clearInterval(intr);
        document.body.appendChild(elem);
    };
    intr = setInterval(append, 100);
    append();
});
