const CACHE_NAME = 'cryptowallet-cache-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
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

// Evento fetch: Sirve desde caché si está disponible, sino va a la red
self.addEventListener('fetch', (event) => {
    // Excluye las peticiones a Supabase y APIs externas de la caché estática
    if (!event.request.url.startsWith('http')) return;
    if (event.request.url.includes('supabase.co')) return;

    event.respondWith(
        caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
});