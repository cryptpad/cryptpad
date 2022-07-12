var logoPath = '/customize/CryptPad_logo.svg';
if (location.pathname == '/' || location.pathname == '/index.html') {
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

document.addEventListener('DOMContentLoaded', function(e) {
    document.body.appendChild(elem);
});
