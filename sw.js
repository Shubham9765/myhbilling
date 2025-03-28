const CACHE_NAME = "restaurant-billing-cache-v1";
const urlsToCache = [
    "/",
    "/index.html",
    "/dashboard.html",
    "/menu.html",
    "/waiters.html",
    "/tables.html",
    "/settings.html",
    "/app.js",
    "/styles.css"
];

// Install event: Cache files
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(
                urlsToCache.map((url) =>
                    fetch(url, { cache: "no-store" })
                        .then((response) => {
                            if (!response.ok) throw new Error("Failed to fetch " + url);
                            return cache.put(url, response);
                        })
                        .catch((err) => console.warn("Skipping cache for", url, err))
                )
            );
        })
    );
});

// Activate event: Clean old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME) // Delete old caches
                    .map((name) => caches.delete(name))
            );
        })
    );
});

// Fetch event: Serve from cache, then update from network
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return (
                cachedResponse ||
                fetch(event.request)
                    .then((response) => {
                        return caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, response.clone());
                            return response;
                        });
                    })
                    .catch(() => cachedResponse) // Return cached version if offline
            );
        })
    );
});
