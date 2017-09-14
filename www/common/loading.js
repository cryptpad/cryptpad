define([], function () {
    var loadingStyle = (function(){/*
        #loading {
            position: fixed;
            z-index: 9999999;
            top: 0px;
            bottom: 0px;
            left: 0px;
            right: 0px;
            background: #222;
            color: #fafafa;
            text-align: center;
            font-size: 1.5em;
        }
        #loading .loadingContainer {
            margin-top: 50vh;
            transform: translateY(-50%);
        }
        #loading .cryptofist {
            margin-left: auto;
            margin-right: auto;
            height: 300px;
            margin-bottom: 2em;
        }
        @media screen and (max-height: 450px) {
            #loading .cryptofist {
                display: none;
            }
        }
        #loading .spinnerContainer {
            position: relative;
            height: 100px;
        }
        #loading .spinnerContainer > div {
            height: 100px;
        }
        #loadingTip {
            position: fixed;
            z-index: 99999;
            top: 80%;
            left: 0;
            right: 0;
            text-align: center;
            transition: opacity 750ms;
            transition-delay: 3000ms;
        }
        @media screen and (max-height: 600px) {
            #loadingTip {
                display: none;
            }
        }
        #loadingTip span {
            background-color: #222;
            color: #fafafa;
            text-align: center;
            font-size: 1.5em;
            opacity: 0.7;
            font-family: 'Open Sans', 'Helvetica Neue', sans-serif;
            padding: 15px;
            max-width: 60%;
            display: inline-block;
        }*/
    }).toString().slice(14, -3);
    var urlArgs = window.location.href.replace(/^.*\?([^\?]*)$/, function (all, x) { return x; });
    var elem = document.createElement('div');
    elem.setAttribute('id', 'loading');
    elem.innerHTML = [
        '<style>',
        loadingStyle,
        '</style>',
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
