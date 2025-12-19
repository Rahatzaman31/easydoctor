/**
 * Service Worker - Handles caching and offline support
 */

const CACHE_NAME = 'easydoctor-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo-icon.png',
  '/logo-navbar.png',
  '/favicon.svg'
]

// Cache strategy: Network first, fallback to cache
const networkFirstStrategy = async (request) => {
  try {
    const response = await fetch(request)
    
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    const cached = await caches.match(request)
    return cached || new Response('Offline', { status: 503 })
  }
}

// Cache strategy: Cache first, fallback to network
const cacheFirstStrategy = async (request) => {
  const cached = await caches.match(request)
  if (cached) return cached
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    return new Response('Offline', { status: 503 })
  }
}

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Static assets - cache first
  if (url.pathname.match(/\.(js|css|webp|png|jpg|svg|woff2?)$/)) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // API calls and HTML - network first
  if (url.pathname.includes('/api/') || request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Default - network first
  event.respondWith(networkFirstStrategy(request))
})
