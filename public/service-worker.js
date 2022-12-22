const CACHE_NAME = 'cache-v2-vr';

const FILES_TO_CACHE = [
  'offline.html',
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('install');
      return cache.addAll(FILES_TO_CACHE);
    }),
  );
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('Removing old cache', key);
          return caches.delete(key);
        }
      }));
    }),
  );
});

self.addEventListener('fetch', (evt) => {
  if (evt.request.mode !== 'navigate') {
    return;
  }
  evt.respondWith(
    fetch(evt.request).catch(() => {
      return caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.match('offline.html');
        }
      );
    }),
  );
});
