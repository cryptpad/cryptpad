// dark #326599
// light #4591c4
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
  background: linear-gradient(to right, #326599 0%, #326599 50%, #4591c4 50%, #4591c4 100%);
  color: #fafafa;
  font-size: 1.5em;
  opacity: 1;
  display: flex;
  flex-flow: column;
  justify-content: center;
  align-items: center;
}
#cp-loading.cp-loading-hidden {
  opacity: 0;
  visibility: hidden;
}
#cp-loading .cp-loading-logo {
    height: 300px;
    width: 300px;
    margin-top: 50px;
    flex: 0 1 auto;
    min-height: 0;
    text-align: center;
}
#cp-loading .cp-loading-logo img {
    max-width: 100%;
    max-height: 100%;
}
#cp-loading .cp-loading-container {
    width: 700px;
    max-width: 90vw;
    height: 500px;
    max-height: calc(100vh - 20px);
    margin: 50px;
    flex-shrink: 0;
    display: flex;
    flex-flow: column;
    justify-content: space-around;
    align-items: center;
}
@media screen and (max-height: 800px) {
    #cp-loading .cp-loading-container {
        height: auto;
    }
}
@media screen and (max-width: 600px) {
    #cp-loading .cp-loading-container {
        height: auto;
    }
}
#cp-loading .cp-loading-cryptofist {
  margin-left: auto;
  margin-right: auto;
  //height: 300px;
  max-width: 90vw;
  max-height: 300px;
  width: auto;
  height: auto;
  margin-bottom: 2em;
}
@media screen and (max-height: 500px) {
  #cp-loading .cp-loading-logo {
      display: none;
  }
}
#cp-loading-message {
    background: #FFF;
    padding: 20px;
    width: 100%;
    color: #000;
    text-align: center;
    display: none;
}
#cp-loading-password-prompt {
    font-size: 18px;
}
#cp-loading-password-prompt .cp-password-error {
    color: white;
    background: #9e0000;
    padding: 5px;
    margin-bottom: 15px;
}
#cp-loading-password-prompt .cp-password-info {
    text-align: left;
    margin-bottom: 15px;
}
#cp-loading-password-prompt .cp-password-form {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
}
#cp-loading-password-prompt .cp-password-form button,
#cp-loading-password-prompt .cp-password-form .cp-password-input {
    background-color: #4591c4;
    color: white;
    border: 1px solid #4591c4;
}
#cp-loading-password-prompt .cp-password-form .cp-password-container {
    flex-shrink: 1;
    min-width: 0;
}
#cp-loading-password-prompt .cp-password-form input {
    flex: 1;
    padding: 0 5px;
    min-width: 0;
    text-overflow: ellipsis;
}
#cp-loading-password-prompt .cp-password-form button:hover {
    background-color: #326599;
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
.cp-loading-progress {
    width: 100%;
    margin: 20px;
}
.cp-loading-progress p {
    margin: 5px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
.cp-loading-progress-bar {
    height: 24px;
    background: white;
}
.cp-loading-progress-bar-value {
    height: 100%;
    background: #5cb85c;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(1800deg);
    }
}

.cp-spinner {
    display: inline-block;
    box-sizing: border-box;
    width: 80px;
    height: 80px;
    border: 11px solid white;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin infinite 3s;
    animation-timing-function: cubic-bezier(.6,0.15,0.4,0.85);
}

*/}).toString().slice(14, -3);
    var urlArgs = window.location.href.replace(/^.*\?([^\?]*)$/, function (all, x) { return x; });
    var elem = document.createElement('div');
    elem.setAttribute('id', 'cp-loading');
    elem.innerHTML = [
        '<style>',
        loadingStyle,
        '</style>',
        '<div class="cp-loading-logo">',
            '<img class="cp-loading-cryptofist" src="/customize/loading-logo.png?' + urlArgs + '">',
        '</div>',
        '<div class="cp-loading-container">',
            '<div class="cp-loading-spinner-container">',
                '<span class="cp-spinner"></span>',
            '</div>',
            '<p id="cp-loading-message"></p>',
        '</div>'
    ].join('');
    return function () {
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
