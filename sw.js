/* ★ v3.6 서비스워커 — 웹앱 화면(HTML)을 캐시해서 앱처럼 빠르게 띄운다.
   ※ 주의 : 이 웹앱의 실제 데이터는 GAS(/exec) API 를 항상 실시간으로 받아온다.
   캐시하는 것은 "화면 파일(index.html 등)" 뿐이고, 데이터 통신은 절대 가로채지 않는다.
   → GAS 주소·API 키·노션 데이터는 항상 최신값으로 동작한다. */

var CACHE_NAME = 'nonghyup-dashboard-v3.7';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './KJS.png'
];

/* 설치 : 화면 자원을 미리 담아둔다 (실패해도 설치는 계속 진행) */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(ASSETS.map(function (u) {
        return cache.add(u).catch(function () { /* 파일이 없어도 무시 */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

/* 활성 : 예전 캐시를 치운다 */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* 요청 가로채기 규칙
   1) GAS /exec 로 향하는 요청(데이터)  → 절대 캐시하지 않고 그대로 통과 (항상 실시간)
   2) 그 외 화면 자원                    → 캐시 우선, 없으면 네트워크 */
self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = req.url || '';
  if (url.indexOf('script.google.com') >= 0 || url.indexOf('googleusercontent.com') >= 0 ||
      url.indexOf('script.googleusercontent.com') >= 0) {
    return; /* 데이터 통신은 서비스워커가 손대지 않는다 */
  }
  event.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok && url.indexOf(self.location.origin) === 0) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
    })
  );
});
