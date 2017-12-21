define([], function () {
    var loadingStyle = (function(){/*
#cp-loading {
  transition: opacity 0.75s, visibility 0s 0.75s;
  visibility: visible;
  position: fixed;
  z-index: 10000000;
  top: 0px;
  bottom: 0px;
  left: 0px;
  right: 0px;
  background: #222;
  color: #fafafa;
  text-align: center;
  font-size: 1.5em;
  opacity: 1;
}
#cp-loading.cp-loading-hidden {
  opacity: 0;
  visibility: hidden;
}
#cp-loading .cp-loading-container {
  margin-top: 50vh;
  transform: translateY(-50%);
}
#cp-loading .cp-loading-cryptofist {
  margin-left: auto;
  margin-right: auto;
  height: 300px;
  margin-bottom: 2em;
}
@media screen and (max-height: 450px) {
  #cp-loading .cp-loading-cryptofist {
    display: none;
  }
}
#cp-loading .cp-loading-spinner-container {
  position: relative;
  height: 100px;
}
#cp-loading .cp-loading-spinner-container > div {
  height: 100px;
}
#cp-loading-tip {
  position: fixed;
  z-index: 10000000;
  top: 80%;
  left: 0;
  right: 0;
  text-align: center;
  transition: opacity 750ms;
  transition-delay: 3000ms;
}
@media screen and (max-height: 600px) {
  #cp-loading-tip {
    display: none;
  }
}
#cp-loading-tip span {
  background: #222;
  color: #fafafa;
  text-align: center;
  font-size: 1.5em;
  opacity: 0.7;
  font-family: 'Open Sans', 'Helvetica Neue', sans-serif;
  padding: 15px;
  max-width: 60%;
  display: inline-block;
}
*/}).toString().slice(14, -3);
    var urlArgs = window.location.href.replace(/^.*\?([^\?]*)$/, function (all, x) { return x; });
    var elem = document.createElement('div');
    elem.setAttribute('id', 'cp-loading');
    elem.innerHTML = [
        '<style>',
        loadingStyle,
        '</style>',
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
