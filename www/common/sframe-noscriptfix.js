// Fix for noscript bugs when caching iframe content.
// Caution, this file will get cached, you must change the name if you change it.
document.getElementById('sbox-iframe').setAttribute('src', 'http://localhost:3001/pad2/inner.html?cb=' + (+new Date()));
