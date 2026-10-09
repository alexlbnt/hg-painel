/* Service worker do HG Painel.
 *
 * Objetivo: tornar o app instalável e resiliente, SEM risco de servir dados ou telas velhas:
 *  - nunca intercepta /api/* (dados e SSE sempre vêm da rede);
 *  - páginas (navegação): rede primeiro; se estiver sem internet, mostra /offline.html;
 *  - arquivos com hash do build (/_expo/static/*): cache primeiro (o nome muda a cada build);
 *  - ícones: cache com revalidação em segundo plano.
 * Para forçar a renovação de tudo, aumente CACHE_VERSION.
 */
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `hg-static-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, '/icons/icon-192.png']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('hg-static-') && k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Navegação: rede primeiro, página offline como último recurso
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Arquivos imutáveis do build (nome com hash)
  if (url.pathname.startsWith('/_expo/static/')) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // Ícones: serve do cache e atualiza em segundo plano
  if (url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req)
            .then((res) => {
              if (res.ok) cache.put(req, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
  }
});
