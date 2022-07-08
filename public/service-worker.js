const FILES_TO_CACHE = [
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/js/idb.js',
    '/js/index.js'
  ];

const APP_PREFIX = 'BudgetTracker-';
const DATA_PREFIX = 'BudgetTracker-Data';     
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;
const DATA_CACHE_NAME = DATA_PREFIX + VERSION;

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
          console.log('installing cache : ' + CACHE_NAME)
          return cache.addAll(FILES_TO_CACHE)
        })
      )
})

self.addEventListener('activate', function(e) {
    e.waitUntil(
      caches.keys().then(function(keyList) {
        let cacheKeeplist = keyList.filter(function(key) {
          return key.indexOf(APP_PREFIX) || key.indexOf(DATA_PREFIX);
        });
        cacheKeeplist.push(CACHE_NAME);
        cacheKeeplist.push(DATA_CACHE_NAME);
  
        return Promise.all(
          keyList.map(function(key, i) {
            if (cacheKeeplist.indexOf(key) === -1) {
              console.log('deleting cache : ' + keyList[i]);
              return caches.delete(keyList[i]);
            }
          })
        );
      })
    );
  });

self.addEventListener('fetch', function (evt) {
    if (evt.request.url.includes('/api/')) {
        evt.respondWith(
          caches
            .open(DATA_CACHE_NAME)
            .then(cache => {
              return fetch(evt.request)
                .then(response => {
                  if (response.status === 200) {
                    cache.put(evt.request.url, response.clone());
                  }
                  return response;
                })
                .catch(err => {
                  return cache.match(evt.request);
                });
            })
            .catch(err => console.log(err))
        );
    
        return;
      }
    
      evt.respondWith(
        
        fetch(evt.request).catch(function() {
          return caches.match(evt.request).then(function(response) {
            if (response) {
              return response;
            } else if (evt.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
          });
        })
      );    
})