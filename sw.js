/* ★ v3.8 PWA 서비스워커 — 캐시 버전만 관리 (로직 없음) */
var CACHE = 'fz-shell-v3.8';
var SHELL = ['index.html','manifest.json','KJS.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var u = e.request.url;
  if(e.request.method !== 'GET') return;
  /* GAS API 는 절대 캐시하지 않는다 */
  if(u.indexOf('script.google.com') >= 0) return;
  e.respondWith(
    fetch(e.request).then(function(res){
      if(res && res.ok && u.indexOf(location.host) >= 0){
        var cp = res.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, cp); });
      }
      return res;
    }).catch(function(){ return caches.match(e.request); })
  );
});
