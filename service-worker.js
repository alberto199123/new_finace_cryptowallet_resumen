const CACHE_NAME = 'cryptowallet-cache-v4';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icono-ovni-192x192-transparente.png',
    './icono-ovni-512x512-transparente.png'
];

// Evento de instalación: Almacena los archivos estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

// Evento de activación: Limpia cachés antiguos si se actualiza la versión
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Evento fetch: network-first para HTML (actualización forzada), cache-first para el resto
self.addEventListener('fetch', (event) => {
    if (!event.request.url.startsWith('http')) return;
    if (event.request.url.includes('supabase.co')) return;

    const url = new URL(event.request.url);
    const isHTML = event.request.mode === 'navigate' ||
        url.pathname.endsWith('.html') ||
        url.pathname.endsWith('/') ||
        url.pathname.endsWith('/index.html');

    if (isHTML) {
        // HTML: red primero, si falla usa caché
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Assets: caché primero
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request).then((res) => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return res;
            }))
    );
});
