var logoPath = (/^\/(|index\.html)$/g.test(location.pathname)) ? '/customize/CryptPad_logo_grey.svg': '/customize/CryptPad_logo.svg';

var logoPath2 = '/customize/CryptPad_logo.svg';
if (location.pathname == '/' || location.pathname == '/index.html') {
    logoPath2 = '/customize/CryptPad_logo_grey.svg';
}
// XXX rewrite 'CryptPad_logo_grey' by 'CryptPad_logo_hero'
// Choose between logoPath & logoPath2 OR do a separate "pre-loading" script for main page (customize/index.html)

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
