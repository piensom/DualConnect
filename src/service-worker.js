/**
 * Service Worker for Dual Connect PWA
 * Provides offline support, caching, and installability
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `dualconnect-${CACHE_VERSION}`;
const API_CACHE = `dualconnect-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `dualconnect-images-${CACHE_VERSION}`;

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/src/pages/index.html',
  '/src/pages/programs.html',
  '/src/pages/login.html',
  '/src/pages/register.html',
  '/src/styles/main.css',
  '/src/styles/utility.css',
  '/src/scripts/main.js',
  '/src/scripts/api-enhanced.js',
  '/src/scripts/toast.js',
  '/src/scripts/i18n.js',
  '/manifest.json',
  '/offline.html'
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/programs',
  '/api/companies',
  '/api/blog',
  '/api/faq',
  '/api/glossary'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('dualconnect-') && name !== CACHE_NAME && name !== API_CACHE && name !== IMAGE_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin && !url.pathname.startsWith('/api')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Handle image requests
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

/**
 * Handle API requests with network-first strategy
 */
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful GET requests
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[SW] Serving API from cache:', request.url);
      // Add header to indicate cached response
      const headers = new Headers(cachedResponse.headers);
      headers.append('X-Served-From', 'cache');

      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers
      });
    }

    // No cache available, return offline response
    return new Response(
      JSON.stringify({
        error: 'You are offline and this data is not cached',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle image requests with cache-first strategy
 */
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Return placeholder image
    return new Response('', {
      status: 404,
      statusText: 'Image not found'
    });
  }
}

/**
 * Handle static requests with cache-first strategy
 */
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Refresh cache in background
    event.waitUntil(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
        })
        .catch(() => {}) // Silently fail background refresh
    );

    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Background sync for failed API requests
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-applications') {
    event.waitUntil(syncApplications());
  }

  if (event.tag === 'sync-bookmarks') {
    event.waitUntil(syncBookmarks());
  }
});

async function syncApplications() {
  // Get pending applications from IndexedDB
  // Retry sending them to server
  console.log('[SW] Syncing applications...');
}

async function syncBookmarks() {
  // Get pending bookmarks from IndexedDB
  // Retry sending them to server
  console.log('[SW] Syncing bookmarks...');
}

/**
 * Push notifications
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Dual Connect', options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const url = event.notification.data.url || '/';

  event.waitUntil(
    clients.openWindow(url)
  );
});

/**
 * Message handler for communication with clients
 */
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

/**
 * Periodic background sync (experimental)
 */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-notifications') {
    event.waitUntil(updateNotifications());
  }
});

async function updateNotifications() {
  // Fetch new notifications in background
  console.log('[SW] Updating notifications...');
}

console.log('[SW] Service worker loaded');
