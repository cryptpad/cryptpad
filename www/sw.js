/* jshint esversion: 6 */
var version = self.location.search || "DEFAULT";
//console.log('worker location:', self.location);

var filesToCache = [
    '/common/sframe-app-outer.js',
];

/*
[
    'auth',
    'bounce',
    'code',
    'contacts',
    'drive',
    'file',
    'kanban',
    'login',
    'logout',
    'notifications',
    //'oodoc',
    //'ooslide',
    'pad',
    'poll',
    'profile',
    'register',
    //'secureiframe',
    //'service',
    'settings',
    'sheet',
    'slide',
    'support',
    'teams',
    'todo',
    'whiteboard',
    //'worker',
];
.forEach(function (path) {
    filesToCache.push('/' + path + '/');
});
*/

/*
[
    '',
    //'404.html',
    'about.html',
    'contact.html',
    'faq.html',
    'features.html',
    'index.html',
    //'maintenance.html',
    'privacy.html',
    'terms.html',
    'what-is-cryptpad.html',
].forEach(function (path) {
    filesToCache.push('/' + path);
});
*/

filesToCache.forEach(function (file, i) {
    filesToCache[i] += ('?' + version);
});

var openCache = function (name) {
    return caches.open(name); // jshint ignore:line
};

var deleteCache = function (name) {
    return caches.delete(name); // jshint ignore:line
};

var cacheResponse = function (cache, request, response) {
    cache.put(request.clone(), response.clone()); // jshint ignore:line
};

var listCaches = function () {
    return caches.keys(); // jshint ignore:line
};

var matchCache = function (req, opt) {
    return caches.match(req, opt); // jshint ignore:line
};

var handleApiConfig = function (event) {
    //console.log("API CONFIG");
    var request = new Request('/api/config');
    event.respondWith(
        fetch(request)
        .then(function (response) {
            //console.log("API CONFIG", request, response);
            if (!response.ok) {
                return matchCache('/api/config', {
                    ignoreSearch: true,
                });
                //throw new Error("oops");
            }

            // XXX always cache the latest /api/config
            return openCache(version).then(function (cache) {
                //console.log('API CONFIG REQUEST', request.clone());
                cacheResponse(cache, event.request, response);
                return response;
            }).catch(function (err) {
                console.error(err);
            });
            //return response.clone();
        })
        .catch(function (/* err */) {
            //console.error(err);
            console.error("failed /api/config fetch");
            //console.log(caches.match('/api/config'));

            // XXX respond with most recently cached /api/config
            return matchCache(event.request.clone(), {
                ignoreSearch: true,
            })
            //'api/config')
            .then(function (response) {
             /* 0 && response.clone().text().then(function (data) {
                    console.log('response.text', data);
                }); */
                //console.log('response.text', response.clone().text());

                //console.log("falling back to cached /api/config");
                return response;
            });
        })
    );
};

var handleDefaultFetch = function (event) {
    event.respondWith(
        matchCache(event.request)
        .then(function (response) {
            if (response) { return response; }
            return openCache(version).then(function (cache) {
                console.log('Network request for ', event.request.url);
                return fetch(event.request.clone())
                    .then(function (response) {
                        if (response.ok) {
                            cache.put(event.request, response.clone());
                        }
                        return response.clone();
                    }).catch(function (/*err*/) {
                        console.error('FAILED FETCH for url [%s]', new URL(event.request.url).pathname);
                        //console.error(err);
                    });
            });
        }).catch(error => {
            console.error(error);
            return matchCache('/service/offline.html');
        })
    );
};

var handleFetch = function (event) {
    if (event.request.method !== 'GET') { return; }
    var url = new URL(event.request.url);
    if (url.pathname === '/sw.js') { return; }

    //console.log(url);
    //console.log('Fetch event for ', event.request.url, event.request);
    if (/^\/api\/config/.test(url.pathname)) {
        return void handleApiConfig(event);
    }
    handleDefaultFetch(event);
};

self.addEventListener('fetch', handleFetch);

self.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled rejection (promise: ', event.promise, ', reason: ', event.reason, ').');
    throw new Error();
});

var claimClients = function () {
    clients.claim(); // jshint ignore:line
};

self.addEventListener('install', function (event) {
    event.waitUntil(
        openCache(version).then(function (cache) {
            return cache.addAll(filesToCache);
        })
        .then(function () {
            return self.skipWaiting();
        }).catch(function (err) {
            console.error(err);
        })
    );
});

self.addEventListener('activate', function (event) {
    // evict older versions of files you've cached
    console.log("activating %s", version);

    event.waitUntil(
        listCaches()
        .then(keys => Promise.all(
            keys.map(key => {
                if (key !== version) {
                    console.log('Evicting cache: [%s]', key);
                    return deleteCache(key);
                }
            })
        )).then(() => {
            console.log('version %s now ready to handle fetches!', version);
            claimClients();
        })
    );
});

