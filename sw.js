const CACHE_NAME = 'nutriscan-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/index.tsx',
  '/App.tsx',
  '/components/NutritionalAnalysis.tsx',
  '/components/BodyComposition.tsx',
  '/services/geminiService.ts',
  '/types.ts',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Use addAll with a catch for each item to prevent install failure if one asset is missing.
        // It's better to let the fetch handler cache things lazily.
        const cachePromises = urlsToCache.map(url => {
            return cache.add(url).catch(err => {
                console.warn(`Failed to cache ${url}:`, err);
            });
        });
        return Promise.all(cachePromises);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // For API calls, always use network.
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return event.respondWith(fetch(event.request));
  }
  
  // For other requests (app assets, CDNs), use cache-first with dynamic caching.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(event.request);
        // Cache successful GET requests.
        if (event.request.method === 'GET' && networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        console.error('Fetch failed, resource not in cache:', event.request.url);
        // This will result in a browser error page if offline.
        throw error;
      }
    })
  );
});
