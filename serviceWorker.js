let cacheName = "pwa-app-native";
let filesToCache = 
["./index.html","./manifest.json", "./css/pages.css","./css/site.css", "./js/cPage.js", "./js/cMenu.js", "./js/functions_data.js", "./js/functions_editor.js", "./js/functions_shared.js", "./js/countdown.js"]; 

/* might be needed if live and need to kill the service woker. 
// A simple, no-op service worker that takes immediate control.
self.addEventListener('install', () => {
  // Skip over the "waiting" lifecycle state, to ensure that our
  // new service worker is activated immediately, even if there's
  // another tab open controlled by our older service worker code.
  self.skipWaiting();
});
*/

/* Start the service worker and cache all of the app's content */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(filesToCache);
    })
  );
});

/* Serve cached content ?images when offline */
self.addEventListener("fetch", (e) => {
	const request = e.request;
	if (request.headers.get('Accept').includes('image')) {	
        caches.match(request)
        	.then( responseFromCache => {
				console.log ("image from cache");
        	    return responseFromCache || fetch(request);
        	})
	}
  //e.respondWith(
  //  caches.match(e.request).then((response) => {
  //    	//return response || fetch(e.request);
  // })
  //);
});

/*
self.addEventListener('activate', () => {
  // Optional: Get a list of all the current open windows/tabs under
  // our service worker's control, and force them to reload.
  // This can "unbreak" any open windows/tabs as soon as the new
  // service worker acivates, rather than users having to manually reload.
  self.clients.matchAll({type: 'window'}).then(windowClients => {
    windowClients.forEach(windowClient => {
      windowClient.navigate(windowClient.url);
    });
  });
});
*/
 
/* Serve cached content when offline */
//self.addEventListener("fetch", (e) => {
//  e.respondWith(
//    caches.match(e.request).then((response) => {
//      return response || fetch(e.request);
//    })
//  );
//});
//WORKS OKAY - check again for FetchEvent error.....
//Does not load page if page hasn;t been visited before if clicked on from a page link....
/*addEventListener('fetch', fetchEvent => {
    const request = fetchEvent.request;

    if (request.headers.get('Accept').includes('text/html')) {
        fetchEvent.respondWith(
            fetch(request)
            	.then( responseFromFetch => {
					console.log ("online");
            	    return responseFromFetch;
            	})
            	.catch( fetchError => {
					//end waitUntil from fetchError
					console.log ("offline");

					self.clients.matchAll().then(function (clients){
					    clients.forEach(function(client){
					        client.postMessage({
					            msg: "Hey I just got a fetch from you!",
					            url: request.url
					        });
					    });
					}); 
//event.target is null...
//+this.clients.get(clientId)
					const rootUrl = new URL('./pages.html', location).href;
					console.log(clients);
					return new Response('<p>Hello from your friendly neighborhood service worker!</p>' 
						+ "<p>" + fetchError + "</p>" 
						+ "<p>" + rootUrl + "</p>", {
  						headers: { 'Content-Type': 'text/html' }
					});
					//return;
            	    //return caches.match('/offline');
            	})
        );
	}else if (request.headers.get('Accept').includes('image')) {	
        caches.match(request)
        	.then( responseFromCache => {
		console.log ("from cache");
        	    return responseFromCache || fetch(request);
        	})

    } else {
		console.log ("other file types");

    }

});
*/