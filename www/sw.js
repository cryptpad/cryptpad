window = self;

var version = self.location.search || "DEFAULT";
var filesToCache = [];

var handleApiConfig = function (event) {
    //console.log("API CONFIG");
    var request = new Request('/api/config');
    event.respondWith(
        fetch(request)
        .then(function (response) {
            //console.log("API CONFIG", request, response);
            if (!response.ok) {
                return caches.match('/api/config', {
                    ignoreSearch: true,
                });
                //throw new Error("oops");
            }

            // XXX always cache the latest /api/config
            return caches.open(version).then(function (cache) {
                //console.log('API CONFIG REQUEST', request.clone());
                cache.put(event.request.clone(), response.clone());
                return response;
            }).catch(function (err) {
                console.error(err);
            });
            //return response.clone();
        })
        .catch(function (err) {
            //console.error("failed /api/config fetch");
            //console.log(caches.match('/api/config'));

            // XXX respond with most recently cached /api/config
            return caches.match(event.request.clone(), {
                ignoreSearch: true,
            })
            //'api/config')
            .then(function (response) {
                0 && response.clone().text().then(function (data) {
                    console.log('response.text', data);
                });
                //console.log('response.text', response.clone().text());

                //console.log("falling back to cached /api/config");
                return response;
            })
        })
    );
};

var handleDefaultFetch = function (event) {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) { return response; }
            return caches.open(version).then(function (cache) {
                console.log('Network request for ', event.request.url);
                return fetch(event.request.clone())
                    .then(function (response) {
                        if (response.ok) {
                            cache.put(event.request, response.clone());
                        }
                        return response.clone();
                    }).catch(function (err) {
                        console.error('FAILED FETCH for url [%s]', event.request.url);
                        console.error(err);
                    });
            });
        }).catch(error => {
            console.error(error);
            return caches.match('/service/offline.html');
        })
    );
};

var handleFetch = function (event) {
    if (event.request.method !== 'GET') { return; }
    var url = new URL(event.request.url);
    //console.log(url);
    //console.log('Fetch event for ', event.request.url, event.request);
    if (/^\/api\/config/.test(url.pathname)) {
        return void handleApiConfig(event);
    }
    handleDefaultFetch(event);
};

self.addEventListener('fetch', handleFetch);

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled rejection (promise: ', event.promise, ', reason: ', event.reason, ').');
});

self.addEventListener('install', function (event) {
    // XXX self.skipWaiting 
    event.waitUntil(
        caches.open(version).then(function (cache) {
            return cache.addAll(filesToCache);
        })
    );
});

self.addEventListener('activate', function (event) {

    // delete any caches that aren't in expectedCaches
    // which will get rid of static-v1
    event.waitUntil(
        caches.keys()
        .then(keys => Promise.all(
            keys.map(key => {
                console.log(key);
                if (key !== version) {
                    return caches.delete(key);
                }
            })
        )).then(() => {
            console.log('version %s now ready to handle fetches!', version);
            clients.claim();
        })
    );
});



