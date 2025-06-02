// This is the service worker with the Cache-first network
// Strategy for improved performance and offline support

const CACHE = "subscription-tracker-cache-v1";
const RUNTIME = "subscription-tracker-runtime";

// List of URLs to precache
const precacheResources = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css'
];

// The install handler takes care of precaching the resources we always need
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(precacheResources))
      .then(() => (self as any).skipWaiting())
  );
});

// The activate handler takes care of cleaning up old caches
self.addEventListener('activate', (event: any) => {
  const currentCaches = [CACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => (self as any).clients.claim())
  );
});

// The fetch handler serves responses from a cache or network
// depending on what's available and the request type
self.addEventListener('fetch', (event: any) => {
  // Skip cross-origin requests like those for Google Analytics
  if (event.request.url.startsWith(self.location.origin)) {
    // For API requests, use network-first strategy 
    if (event.request.url.includes('/api/')) {
      event.respondWith(networkFirst(event.request));
    } else {
      // For everything else (static assets), use cache-first strategy
      event.respondWith(cacheFirst(event.request));
    }
  }
});

// Cache first strategy (good for static assets)
async function cacheFirst(request: Request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    // Save important resources to cache on the fly
    if (request.method === 'GET' && !request.url.includes('chrome-extension://')) {
      await saveToCache(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Fetch failed; returning offline page instead.', error);
    // If even the fallback page fails, return a basic response
    return new Response('Network error occurred', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Network first strategy (good for API requests that need fresh data)
async function networkFirst(request: Request) {
  try {
    const networkResponse = await fetch(request);
    // Save API responses to cache for offline access
    if (request.method === 'GET') {
      await saveToCache(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    console.error('Network request failed and no cache.', error);
    return new Response('Network error occurred', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Helper function to save responses to cache
async function saveToCache(request: Request, response: Response) {
  const cache = await caches.open(RUNTIME);
  await cache.put(request, response);
}
