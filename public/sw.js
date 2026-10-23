const CACHE_VERSION = "mecart-pwa-v5";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const OFFLINE_URL = "/offline";

const PRECACHE = [
  OFFLINE_URL,
  "/icon.svg",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];

const PRIVATE_PREFIXES = [
  "/orders",
  "/profile",
  "/checkout",
  "/cart",
  "/wishlist",
  "/rewards",
  "/messages",
  "/seller",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/phone-login",
  "/verify-email",
  "/two-factor",
  "/admin",
  "/api",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("mecart-pwa-") && !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

async function navigationResponse(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request, { ignoreVary: true });
  const cachedOffline =
    (await caches.match(OFFLINE_URL, { ignoreVary: true })) || Response.error();

  if (cached) {
    // Serve instantly and refresh the document quietly for the next visit.
    void fetch(request)
      .then((response) => {
        if (response.ok) return cache.put(request, response.clone());
        return undefined;
      })
      .catch(() => undefined);
    return cached;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3800);
  try {
    const response = await fetch(request, { signal: controller.signal });
    if (response.ok) {
      await cache.put(request, response.clone());
      await trimCache(RUNTIME_CACHE, 36);
    }
    return response;
  } catch {
    return cachedOffline;
  } finally {
    clearTimeout(timer);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) {
        void cache.put(request, response.clone()).then(() => trimCache(IMAGE_CACHE, 80));
      }
      return response;
    })
    .catch(() => cached || Response.error());
  return cached || network;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

function isPrivate(pathname) {
  return PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;
  if (url.pathname.startsWith("/admin")) return;

  if (request.mode === "navigate") {
    if (isPrivate(url.pathname)) {
      event.respondWith(
        fetch(request).catch(async () => {
          const cached = await caches.match(request, { ignoreVary: true });
          return cached || (await caches.match(OFFLINE_URL, { ignoreVary: true })) || Response.error();
        }),
      );
      return;
    }
    event.respondWith(navigationResponse(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.destination === "image" || request.destination === "font") {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
    return;
  }
  if (event.data?.type === "QUEUE_CART_SYNC") {
    event.waitUntil(
      self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "MECART_FLUSH_CART" }));
      }),
    );
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag !== "mecart-cart-sync") return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: "MECART_FLUSH_CART" }));
    }),
  );
});
