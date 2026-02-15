// Custom service worker code for OmniFocus PWA
// next-pwa merges this into the generated service worker via importScripts
// This runs BEFORE workbox route registration, so our fetch listener fires first.

// ----- Fix: Bypass SW cache for Next.js App Router RSC navigation requests -----
// Next.js 15 App Router uses RSC (React Server Component) fetches for client-side
// navigation. These carry special headers/params that must NOT be cached by the
// service worker, otherwise stale RSC payloads from a different route get served,
// breaking page transitions in the PWA.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Detect RSC / prefetch / flight requests from Next.js App Router
  const isRSC =
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-Prefetch') === '1' ||
    request.headers.get('Next-Router-State-Tree') != null ||
    url.searchParams.has('_rsc');

  if (isRSC) {
    // Always go to network — never serve from cache
    event.respondWith(fetch(request));
    return; // Prevent workbox from handling this request
  }
});
// ----- End RSC bypass -----

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const { title, body, icon, tag, url } = data;

  event.waitUntil(
    self.registration.showNotification(title || 'OmniFocus', {
      body: body || '',
      icon: icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: tag || 'omnifocus-notification',
      data: { url: url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (url !== '/') {
            client.navigate(url);
          }
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
