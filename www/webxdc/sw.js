
importScripts('/components/jszip/dist/jszip.min.js');

self.addEventListener("install", event => {
   console.log("Service worker installed");
});
self.addEventListener("activate", event => {
   console.log("Service worker activated");
      
});

const PATH_PREFIX = '/webxdc/chess.xdc/';

self.addEventListener('fetch', event => {
    console.log(event.request.url);
    const url = new URL(event.request.url);
    const path = url.pathname;
    console.log(path);

    if (path.startsWith(PATH_PREFIX)) {
        const zipPath = path.substring(PATH_PREFIX.length);
        console.log(zipPath);


         try {
            let zip = new JSZip();
            fetch('http://localhost:3000/webxdc/arcanecircle-chess-v2.4.0.xdc')
            .then((response) => {
            if (!response.ok) {
               throw new Error(`HTTP error! Status: ${response.status}`);
            }
               return response.blob();
            })
            .then((response) => {
               //console.log(response);

               zip.loadAsync(response)
               .then(function (zip) {
                  console.log(zip.files);
                  // folder1/folder2/folder3/file1.txt
               });

            });
            } catch (error) {
               console.error(`XXX Unzipping failed w/ error: ${error}`);
            }


        event.respondWith('hello');
    }
});

