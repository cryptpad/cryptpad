
importScripts('/components/jszip/dist/jszip.min.js');

self.addEventListener("install", event => {
   console.log("Service worker installed");
});
self.addEventListener("activate", event => {
   console.log("Service worker activated");
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
         console.log(response);

         zip.loadAsync(response)
         .then(function (zip) {
            console.log(zip.files);
            // folder1/folder2/folder3/file1.txt
         });

      });
   } catch (error) {
      console.error(`XXX Unzipping failed w/ error: ${error}`);
   }
});

self.addEventListener('fetch', event => {
   console.log(event.request.url)
});

