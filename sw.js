/* トクリュウ防犯シミュレーター サービスワーカー
   ・ページ(index.html)は「ネット優先」:更新をすぐ反映し、オフラインのときは保存した版を出す
   ・画像パック・効果音・オープニング・アイコンは「保存優先」:ファイル名の ?v= が変わると新しく取り直す
   ・BGM(mp3)と動画は、途中から読む再生方式のため保存しない(オフラインでは合成音のBGMになる) */
var VER = 'tokuryu-v18';
var CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VER).then(function(c){ return c.addAll(CORE); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k.indexOf('tokuryu-') === 0 && k !== VER; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  if(req.headers.get('range') || /\/bgm\//.test(url.pathname) || /\.(mp4|webm|m4a)$/.test(url.pathname)) return;

  /* ページ:ネット優先 */
  if(req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname)){
    e.respondWith(fetch(req).then(function(res){
      if(res && res.ok){ var cp = res.clone(); caches.open(VER).then(function(c){ c.put('./index.html', cp); }); }
      return res;
    }).catch(function(){ return caches.match('./index.html').then(function(r){ return r || caches.match('./'); }); }));
    return;
  }
  /* 画像パック・効果音・オープニング画像・アイコンなど:保存優先 */
  e.respondWith(caches.match(req).then(function(hit){
    if(hit) return hit;
    return fetch(req).then(function(res){
      if(res && res.ok && res.type === 'basic'){ var cp = res.clone(); caches.open(VER).then(function(c){ c.put(req, cp); }); }
      return res;
    });
  }));
});
