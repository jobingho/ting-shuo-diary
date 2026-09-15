const CACHE='ting-shuo-v2';
const ASSETS=['./manifest.webmanifest','./icon-192.png','./icon-512.png'];

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
  // 页面导航/HTML：网络优先，失败才回退缓存（保证更新及时生效）
  if(e.request.mode==='navigate'||url.pathname.endsWith('/index.html')||url.pathname==='/'){
    e.respondWith(
      fetch(e.request).then(resp=>{
        const cp=resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request,cp));
        return resp;
      }).catch(()=>caches.match('./index.html').then(r=>r||caches.match('./')))
    );
    return;
  }
  // 其他静态资源：缓存优先
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
