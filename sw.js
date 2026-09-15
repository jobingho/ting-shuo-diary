const CACHE='ting-shuo-v1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  // 跨域请求（GitHub Gist API）直接放行，不缓存
  if(url.origin!==location.origin){
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r=>{
      if(r)return r;
      return fetch(e.request).then(resp=>{
        const cp=resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request,cp));
        return resp;
      }).catch(()=>caches.match('./index.html'));
    })
  );
});
