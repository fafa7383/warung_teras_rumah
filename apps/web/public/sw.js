// Service worker Warung Teras Rumah (PRD 10.7).
// - App shell & aset statis: cache-first; foto menu: stale-while-revalidate;
//   GET menu/store/home: network-first dengan cadangan cache; navigasi offline → /offline.
// - POST dan data pesanan tidak pernah di-cache.
// - Web Push untuk HP pemilik: payload { title, body, url, tag }.

const VERSION = 'wtr-v1';
const STATIC_CACHE = `${VERSION}-static`;
const IMAGE_CACHE = `${VERSION}-images`;
const DATA_CACHE = `${VERSION}-data`;
const OFFLINE_URL = '/offline';
const PRECACHE = [OFFLINE_URL, '/icon.svg', '/manifest.webmanifest'];
const CACHEABLE_API = ['/api/menu', '/api/store', '/api/home'];
const MAX_IMAGES = 120;

// Saat development cache dimatikan agar perubahan kode langsung terlihat.
const IS_DEV = ['localhost', '127.0.0.1'].includes(self.location.hostname);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(STATIC_CACHE)).put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') {
        cache.put(request, response.clone());
        trimCache(IMAGE_CACHE, MAX_IMAGES);
      }
      return response;
    })
    .catch(() => cached);
  return cached ?? network;
}

async function networkFirst(request) {
  const cache = await caches.open(DATA_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Halaman: jaringan dulu, halaman offline bila tidak ada koneksi.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) ?? Response.error()),
    );
    return;
  }

  if (IS_DEV) return;

  if (url.origin === self.location.origin && url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.destination === 'image' && !url.pathname.includes('/object/sign/')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (CACHEABLE_API.includes(url.pathname)) {
    event.respondWith(networkFirst(request));
  }
  // Selain itu (data pesanan, admin) selalu langsung ke jaringan tanpa cache.
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Pesanan baru!', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Pesanan baru!';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || 'Ada pesanan baru di Warung Teras Rumah.',
      icon: '/icons/admin-192.png',
      badge: '/icons/badge-96.png',
      tag: data.tag,
      renotify: Boolean(data.tag),
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: { url: data.url || '/admin' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/admin', self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).pathname.startsWith('/admin') && 'focus' in client) {
          await client.focus();
          if ('navigate' in client) await client.navigate(target);
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
