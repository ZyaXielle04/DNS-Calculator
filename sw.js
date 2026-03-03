const CACHE_NAME = 'barangay-fare-v2';

// Files to cache
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install event - cache files
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    // Force new service worker to activate immediately
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching app files');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - network first, then cache for immediate updates
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        // Try network first
        fetch(event.request)
            .then(response => {
                // Check if we received a valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                // Update cache with new version
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                // If network fails, try cache
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // If not in cache, return offline fallback
                        return caches.match('/');
                    });
            })
    );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    // Take control of all clients immediately
    event.waitUntil(clients.claim());
    
    // Delete old caches
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Notify all clients that update is complete
            return clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'UPDATE_COMPLETED',
                        cacheName: CACHE_NAME
                    });
                });
            });
        })
    );
});

// Listen for messages from the page
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('Skip waiting message received');
        self.skipWaiting();
    }
    
    // Check for updates when requested
    if (event.data && event.data.type === 'CHECK_FOR_UPDATES') {
        console.log('Checking for updates...');
        // Force update check
        self.registration.update();
    }
});

// Function to check for updates periodically
function checkForUpdates() {
    console.log('Periodic update check...');
    self.registration.update();
}

// Check for updates every 30 minutes
setInterval(checkForUpdates, 30 * 60 * 1000);

// Handle online/offline events
self.addEventListener('online', () => {
    console.log('App is online - checking for updates');
    checkForUpdates();
});

// Background sync for updates when back online
self.addEventListener('sync', (event) => {
    if (event.tag === 'update-check') {
        event.waitUntil(checkForUpdates());
    }
});