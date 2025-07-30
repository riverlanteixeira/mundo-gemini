const CACHE_NAME = 'stranger-things-ar-v1';
const assetsToCache = [
  './', // Representa a raiz do diretório do projeto
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'assets/stranger-things-logo.png',
  'assets/dustin-call.png',
  'assets/dustin-intro.mp3',
  'assets/bicicleta-will.glb',
  'assets/compass.svg',
  'https://aframe.io/releases/1.5.0/aframe.min.js',
  'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js'
];

// Evento de instalação: abre o cache e adiciona os assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(assetsToCache);
      })
  );
});

// Evento de fetch: responde com o cache se disponível, senão busca na rede
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});