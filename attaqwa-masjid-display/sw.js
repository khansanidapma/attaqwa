const CACHE="attaqwa-v1";
const ASSETS=["./","./index.html","./style.css","./app.js","./config.json","./manifest.json"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
  if(e.request.url.includes("api.aladhan.com")) return;
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{
    const copy=r.clone(); caches.open(CACHE).then(cache=>cache.put(e.request,copy)); return r;
  }).catch(()=>c)));
});
