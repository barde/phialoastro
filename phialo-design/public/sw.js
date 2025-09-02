// Service Worker for Phialo Design
// Version: 1.0.0
// Last Updated: 2025-08-19

const CACHE_VERSION = '1.0.0';
const CACHE_PREFIX = 'phialo-';
const STATIC_CACHE = `${CACHE_PREFIX}static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}images-${CACHE_VERSION}`;

// Critical assets to cache immediately
const CRITICAL_ASSETS = [
  '/',
  '/en/',
  '/offline',
  '/favicon.svg',
  '/fonts/inter-400-latin.woff2',
  '/fonts/playfair-400-latin.woff2',
];

// Additional assets to cache when possible
const OPTIONAL_ASSETS = [
  '/portfolio',
  '/en/portfolio',
  '/services',
  '/en/services',
  '/about',
  '/en/about',
  '/contact',
  '/en/contact',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Cache critical assets first
      try {
        await cache.addAll(CRITICAL_ASSETS);
        console.log('[SW] Critical assets cached');
      } catch (error) {
        console.error('[SW] Failed to cache critical assets:', error);
      }
      
      // Cache optional assets in background (don't wait)
      cache.addAll(OPTIONAL_ASSETS).catch(error => {
        console.warn('[SW] Some optional assets failed to cache:', error);
      });
    })
  );
  
  // Force immediate activation
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith(CACHE_PREFIX) && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests - only handle same-origin and allowed domains
  const isOurDomain = 
    url.origin === self.location.origin ||
    url.hostname === 'phialo.de' ||
    url.hostname === 'www.phialo.de' ||
    url.hostname.match(/^phialo-(pr-\d+|master|preview)\.meise\.workers\.dev$/) ||
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1';
    
  if (!isOurDomain) {
    return;
  }
  
  // Skip Cloudflare Analytics - check hostname to prevent URL injection
  if (url.hostname === 'static.cloudflareinsights.com' || url.hostname.endsWith('.cloudflareinsights.com')) {
    return;
  }
  
  // Skip API endpoints
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // HTML pages: Network first, fall back to cache, then offline page
  if (request.mode === 'navigate' || 
      request.headers.get('accept')?.includes('text/html')) {
    return handleNavigation(request);
  }
  
  // Images: Cache first with network fallback
  if (url.pathname.startsWith('/images/') || 
      request.destination === 'image') {
    return handleImage(request);
  }
  
  // Fonts: Cache first (rarely change)
  if (url.pathname.startsWith('/fonts/') || 
      request.destination === 'font') {
    return handleStaticAsset(request);
  }
  
  // Astro static assets: Cache first with network update
  if (url.pathname.startsWith('/_astro/')) {
    return handleStaticAsset(request);
  }
  
  // CSS/JS: Stale while revalidate
  if (request.destination === 'style' || 
      request.destination === 'script') {
    return handleStaleWhileRevalidate(request);
  }
  
  // Default: Network first with cache fallback
  return handleNetworkFirst(request);
}

// Navigation handling with multilingual support
async function handleNavigation(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Handle language variations
    const isEnglish = pathname.startsWith('/en/');
    const basePath = isEnglish ? pathname.replace('/en', '') : pathname;
    
    // Try alternate language version
    const altPath = isEnglish ? basePath : '/en' + pathname;
    const altCached = await caches.match(altPath);
    if (altCached) {
      return altCached;
    }
    
    // Try index pages
    const indexPath = isEnglish ? '/en/' : '/';
    const indexCached = await caches.match(indexPath);
    if (indexCached) {
      return indexCached;
    }
    
  } catch (error) {
    console.error('[SW] Navigation failed:', error);
    
    // Try cache first on network error
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  // Final fallback: offline page
  const offlineResponse = await caches.match('/offline');
  if (offlineResponse) {
    return offlineResponse;
  }
  
  // Last resort: error response
  return new Response('Offline - Content not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Image handling with optimization
async function handleImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  
  // Check cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Return cached version immediately
    return cachedResponse;
    
    // Optional: Update cache in background
    // fetch(request).then(response => {
    //   if (response.ok) {
    //     cache.put(request, response);
    //   }
    // });
  }
  
  try {
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Image fetch failed:', error);
    
    // Return placeholder or error
    return new Response('', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

// Static asset handling (fonts, Astro assets)
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  // Check cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    
    // Return error response
    return new Response('', {
      status: 404,
      statusText: 'Not Found'
    });
  }
}

// Stale while revalidate strategy
async function handleStaleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await caches.match(request);
  
  // Fetch from network in background
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.warn('[SW] Background fetch failed:', error);
    return cachedResponse;
  });
  
  // Return cached version immediately if available
  return cachedResponse || fetchPromise;
}

// Network first with cache fallback
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Network request failed:', error);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Message handling for updates with origin validation
self.addEventListener('message', (event) => {
  // Validate origin to prevent malicious messages
  const isAllowedOrigin = (origin) => {
    if (!origin) return false;
    
    // Allow localhost for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return true;
    }
    
    // Allow production domain
    if (origin === 'https://phialo.de' || origin === 'https://www.phialo.de') {
      return true;
    }
    
    // Allow Cloudflare Workers preview deployments
    if (origin.match(/^https:\/\/phialo-(pr-\d+|master|preview)\.meise\.workers\.dev$/)) {
      return true;
    }
    
    return false;
  };
  
  // Check if the origin is allowed
  if (!isAllowedOrigin(event.origin)) {
    console.warn('[SW] Message from unauthorized origin:', event.origin);
    return;
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls;
    caches.open(DYNAMIC_CACHE).then(cache => {
      cache.addAll(urls);
    });
  }
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncOfflineForms());
  }
});

async function syncOfflineForms() {
  // Implement offline form sync
  console.log('[SW] Syncing offline forms...');
}

// Performance monitoring integration
self.addEventListener('fetch', (event) => {
  // Track cache hit rates for monitoring
  if (event.request.mode === 'navigate') {
    const startTime = performance.now();
    
    event.waitUntil(
      event.preloadResponse.then(() => {
        const duration = performance.now() - startTime;
        // Could send this to analytics
        console.debug(`[SW] Navigation timing: ${duration}ms`);
      })
    );
  }
});