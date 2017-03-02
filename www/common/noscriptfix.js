// Fix for noscript bugs when caching iframe content.
// Caution, this file will get cached, you must change the name if you change it.
document.getElementById('pad-iframe').setAttribute('src', 'inner.html?cb=' + (+new Date()));
