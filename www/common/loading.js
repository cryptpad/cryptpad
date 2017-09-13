define([
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/loading.less'
], function () {
    var urlArgs = window.location.href.replace(/^.*\?([^\?]*)$/, function (all, x) { return x; });
    var elem = document.createElement('div');
    elem.setAttribute('id', 'cp-loading');
    elem.innerHTML = [
        '<div class="cp-loading-container">',
            '<img class="cp-loading-cryptofist" src="/customize/cryptpad-new-logo-colors-logoonly.png?' + urlArgs + '">',
            '<div class="cp-loading-spinner-container">',
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
