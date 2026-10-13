/* service worker: offline start, phone notifications */
const VERSION='20261013125012';
const SHELL=['./','./app.js','./fb.js','./config.js','./seed.js','./manifest.webmanifest','./icon-192.png','./apple-touch-icon.png'];
const BASE=new URL('./',self.registration.scope).pathname;
const CDN=/^https:\/\/(fonts\.googleapis\.com\/|fonts\.gstatic\.com\/)/;

self.addEventListener('install',e=>{
  e.waitUntil(caches.open('shell-'+VERSION).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).catch(()=>{}).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('shell-')&&k!=='shell-'+VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
function timeout(ms){return new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),ms));}
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(CDN.test(req.url)){
    /* pinned library versions and fonts never change: cache first */
    e.respondWith(caches.open('cdn').then(async c=>{
      const hit=await c.match(req); if(hit) return hit;
      const res=await fetch(req); if(res&&(res.ok||res.type==='opaque')) c.put(req,res.clone()); return res;
    }));
    return;
  }
  if(url.origin!==self.location.origin||!url.pathname.startsWith(BASE)) return;
  /* the app itself: network first so updates arrive at once, the saved copy when offline */
  const key=req.mode==='navigate'?BASE:url.pathname;
  e.respondWith((async()=>{
    const c=await caches.open('shell-'+VERSION);
    try{
      const res=await Promise.race([fetch(req),timeout(4000)]);
      if(res&&res.ok) c.put(key,res.clone());
      return res;
    }catch(err){
      const hit=await c.match(key)||await caches.match(key);
      if(hit) return hit;
      throw err;
    }
  })());
});

self.addEventListener('push',e=>{
  let d={};
  try{d=e.data?e.data.json():{};}catch(x){d={body:e.data?e.data.text():''};}
  const title=d.title||'משימות';
  const opts={body:d.body||'',icon:BASE+'icon-192.png',badge:BASE+'badge-96.png',tag:d.tag||undefined,renotify:!!d.tag,data:{url:d.url||BASE},dir:'rtl',lang:'he'};
  e.waitUntil(Promise.all([
    self.registration.showNotification(title,opts),
    (self.navigator&&self.navigator.setAppBadge)?self.navigator.setAppBadge().catch(()=>{}):Promise.resolve()
  ]));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=(e.notification.data&&e.notification.data.url)||BASE;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if(new URL(c.url).origin===self.location.origin){c.postMessage({type:'open',url});return c.focus();}}
    return self.clients.openWindow(url);
  }));
});
