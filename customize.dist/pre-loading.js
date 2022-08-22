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

document.addEventListener('DOMContentLoaded', function() {
    document.body.appendChild(elem);
    // fallback if CSS animations not available
    setTimeout(() => {
        try {
            document.querySelector('.placeholder-logo-container').style.opacity = 100;
            document.querySelector('.placeholder-message-container').style.opacity = 100;
        } catch (err) {
            console.error(err);
        }
    }, 3000);
});
}());
