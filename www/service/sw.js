var filesToCache = [
    '/service/index.html',
    '/service/main.js',
    '/service/boop.txt',
    '/service/offline.html',
];

var name = 'test';

self.addEventListener('install', function (event) {
    // XXX self.skipWaiting 
    event.waitUntil(
        caches.open(name).then(function (cache) {
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener('fetch', function (event) {
    console.log('Fetch event for ', event.request.url);
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    console.log('Found ', event.request.url, ' in cache');
                    return response;
                }
            console.log('Network request for ', event.request.url);
            return fetch(event.request)
            // TODO 4 - Add fetched files to the cache
        }).catch(error => {
            console.error(error);
            return caches.match('/service/offline.html');
        })
    );
});

