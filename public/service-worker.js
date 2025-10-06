/**
 * Service Worker para o PWA de Orçamentos
 * 
 * Este arquivo implementa o service worker para permitir o funcionamento
 * offline do aplicativo, com estratégia anti-cache melhorada.
 * 
 * @author Manus
 * @version 2.0.10 - Estratégia anti-cache implementada
 */

// Versão do app e do cache - atualize manualmente a cada release
const APP_VERSION = '2.0.11';
const INSTANCE = new URL(self.location).searchParams.get('i') || '0';
const CACHE_VERSION = 'v2.0.11-' + INSTANCE;
const STATIC_CACHE = 'orcamentos-static-' + CACHE_VERSION;
const DATA_CACHE = 'orcamentos-data-' + CACHE_VERSION;

// Recursos para cache inicial (apenas essenciais para funcionamento offline)
const INITIAL_CACHE_URLS = [
  '/',
  '/index.html',
  '/css/modern-style.css',
  '/js/app.js',
  '/js/jspdf.umd.min.js',
  '/manifest.json',
  '/fonts/material-icons.css',
  '/images/placeholder.png',
  '/images/icons/icon-72x72.png',
  '/images/icons/icon-96x96.png',
  '/images/icons/icon-128x128.png',
  '/images/icons/icon-144x144.png',
  '/images/icons/icon-152x152.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-384x384.png',
  '/images/icons/icon-512x512.png'
];

// URLs que devem sempre buscar da rede (nunca usar cache)
const NEVER_CACHE_URLS = [
  '/api/',
  '/api/events',
  '/pdfs/',
  'service-worker.js'
];

// Instalação do service worker
self.addEventListener('install', event => {
  console.log('Service Worker instalando versão:', CACHE_VERSION);

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Cache aberto:', STATIC_CACHE);
        return cache.addAll(INITIAL_CACHE_URLS);
      })
      .then(() => {
        console.log('Recursos iniciais em cache');
        // Força a ativação imediata do novo service worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Erro ao instalar service worker:', error);
      })
  );
});

// Ativação do service worker
self.addEventListener('activate', event => {
  console.log('Service Worker ativando versão:', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Limpa todos os caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
              console.log('Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Assume controle imediato de todas as páginas
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker ativo e controlando todas as páginas');
      // Notifica todas as páginas abertas sobre a atualização
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: APP_VERSION
          });
        });
      });
    })
  );
});

// Interceptação de requisições com estratégia anti-cache
self.addEventListener('fetch', event => {
  const url = event.request.url;
  
  // Ignora requisições não GET
  if (event.request.method !== 'GET') return;
  
  // URLs que nunca devem usar cache - sempre buscar da rede
  if (NEVER_CACHE_URLS.some(neverCache => url.includes(neverCache))) {
    event.respondWith(
      fetch(event.request.clone(), {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }).catch(() => {
        // Se falhar e for uma requisição de API, retorna erro
        if (url.includes('/api/')) {
          return new Response(JSON.stringify({ erro: 'Sem conexão' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        // Para outros recursos, tenta o cache como fallback
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // Para recursos estáticos: Network First com cache como fallback
  if (isStaticAsset(url)) {
    event.respondWith(
      fetch(event.request.clone(), {
        cache: 'no-cache'
      }).then(response => {
        // Se a resposta for válida, atualiza o cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Se falhar, usa o cache como fallback
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            console.log('Servindo do cache (offline):', url);
            return cachedResponse;
          }
          // Se não há cache, retorna erro
          return new Response('Recurso não disponível offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
    );
    return;
  }
  
  // Para outros recursos (HTML, etc): sempre buscar da rede
  event.respondWith(
    fetch(event.request.clone(), {
      cache: 'no-cache'
    }).catch(() => {
      // Fallback para página offline ou cache
      return caches.match(event.request).then(cachedResponse => {
        return cachedResponse || caches.match('/index.html');
      });
    })
  );
});

// Escuta mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('Todos os caches foram limpos');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

// Notificações push
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { 
    title: 'Start Orçamentos', 
    body: 'Você tem uma nova notificação.' 
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/images/icons/icon-192x192.png',
      badge: '/images/icons/icon-72x72.png',
      tag: 'orcamentos-notification',
      renotify: true
    })
  );
});

/**
 * Verifica se a URL é de um recurso estático
 * @param {string} url - URL da requisição
 * @returns {boolean} - true se for um recurso estático
 */
function isStaticAsset(url) {
  const staticExtensions = [
    '.css', '.js', '.json', '.png', '.jpg', '.jpeg', 
    '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'
  ];
  
  return staticExtensions.some(ext => url.endsWith(ext)) || 
         url.includes('fonts.googleapis.com') || 
         url.includes('fonts.gstatic.com');
}

// Função para forçar atualização do cache
function forceUpdate() {
  return caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  });
}

