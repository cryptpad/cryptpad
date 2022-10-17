(function () {
var logoPath = '/customize/CryptPad_logo.svg';
if (location.pathname === '/' || location.pathname === '/index.html') {
    logoPath = '/customize/CryptPad_logo_hero.svg';
}

var elem = document.createElement('div');
elem.setAttribute('id', 'placeholder');
elem.innerHTML = [
    '<div class="placeholder-logo-container">',
        '<img class="placeholder-logo" src="' + logoPath + '">',
    '</div>',
    '<div class="placeholder-message-container">',
        '<p>Loading...</p>',
    '</div>'
].join('');

var key = 'CRYPTPAD_STORE|colortheme'; // handle outer
if (localStorage[key] && localStorage[key] === 'dark') {
    elem.classList.add('dark-theme');
}
if (!localStorage[key] && localStorage[key+'_default'] && localStorage[key+'_default'] === 'dark') {
    elem.classList.add('dark-theme');
}

var req;
try {
    req = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
    if ((req.theme || req.themeOS) === 'dark') { // handle inner
        elem.classList.add('dark-theme');
    }
} catch (e) {}

document.addEventListener('DOMContentLoaded', function() {
    document.body.appendChild(elem);
    window.CP_preloadingTime = +new Date();

    // soft transition between inner and outer placeholders
    if (req && req.time && (+new Date() - req.time > 2000)) {
        try {
            var logo = document.querySelector('.placeholder-logo-container');
            var message = document.querySelector('.placeholder-message-container');
            logo.style.opacity = 100;
            message.style.opacity = 100;
            logo.style.animation = 'none';
            message.style.animation = 'none';
        } catch (err) {}
    }

    // fallback if CSS animations not available
    setTimeout(() => {
        try {
            document.querySelector('.placeholder-logo-container').style.opacity = 100;
            document.querySelector('.placeholder-message-container').style.opacity = 100;
        } catch (e) {}
    }, 3000);
});
}());
