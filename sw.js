// Service worker simples: guarda os arquivos do app para abrir rápido e
// funcionar como app instalado. Dados do Supabase nunca são guardados aqui.
// Ao mudar os arquivos do app, troque a versão abaixo.
const VERSAO = 'igreja-v8.10';
const ARQUIVOS = ['./', 'index.html', 'app.js', 'estilo.css', 'manifest.json', 'icone-180.png', 'icone-192.png', 'icone-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Rede primeiro (para sempre pegar a versão nova), cache se estiver offline.
// Só arquivos do próprio site; Supabase e CDNs passam direto.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp.ok) {
          const copia = resp.clone();
          caches.open(VERSAO).then((c) => c.put(req, copia));
        }
        return resp;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
  );
});
