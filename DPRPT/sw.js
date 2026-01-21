const cacheName = "DPRPT-v1";
const preCache = [
    "/",
    "/index.html",
    "/style.css",
    "/app.js",
    "/manifest.json",
    "/libs/jspdf.umd.min.js",
    "/libs/docx.min.js",
    "/libs/FileSaver.min.js",
    "/icons/javascript.png",
    "/icons/javascript2.png"
];

// Install Service Worker
self.addEventListener("install", (e) => {
    console.log("Service Worker: Installing...");
    e.waitUntil(
        caches.open(cacheName)
            .then(cache => {
                console.log("Service Worker: Caching files");
                return cache.addAll(preCache);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error("Cache error:", err))
    );
});

// Activate Service Worker
self.addEventListener("activate", (e) => {
    console.log("Service Worker: Activated");
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== cacheName) {
                        console.log("Service Worker: Clearing old cache");
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch from cache or network
self.addEventListener("fetch", (e) => {
    e.respondWith(
        caches.match(e.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(e.request)
                    .then(response => {
                        // Jangan cache POST request atau response yang error
                        if (e.request.method !== "GET" || !response || response.status !== 200) {
                            return response;
                        }
                        
                        const responseClone = response.clone();
                        caches.open(cacheName)
                            .then(cache => cache.put(e.request, responseClone));
                        
                        return response;
                    });
            })
            .catch(() => {
                // Fallback jika offline dan tidak ada cache
                if (e.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});