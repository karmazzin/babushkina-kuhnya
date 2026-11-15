/* Bump CACHE on every release. Activation is requested only after the player saves a settled game. */
const CACHE='babushkina-kuhnya-simple-settings-20261115';
const ROOT=self.registration.scope;
const FILES=['','index.html','style.css','app.js','engine.js','gestures.js','random.js','daily.js','postcards.js','recipes.js','book.js','dialog.js','sharing.js','assets/rolling.svg','assets/kettle.svg','storage.js','offline.js','update.js','animation.js','pacing.js','audio.js','manifest.webmanifest','assets/foods.png','assets/kitchen.png','favicon.ico','favicon.svg','favicon-16x16.png','favicon-32x32.png','assets/apple-touch-icon.png','assets/icon-maskable-192.png','assets/icon-maskable-512.png','assets/social-preview.png','assets/icon.svg','assets/icon-192.png','assets/icon-512.png','assets/audio/porch-swing.m4a','assets/audio/select.mp3','assets/audio/match.mp3','assets/audio/land.mp3','assets/audio/invalid.mp3','assets/audio/win.mp3','assets/audio/LICENSES.txt'];
FILES.push(...Array.from({length:12},(_,i)=>`assets/postcards/card-${String(i+1).padStart(2,'0')}.jpg`));
const URLS=FILES.map(path=>new URL(path,ROOT).href);
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);await cache.addAll(URLS);
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('babushkina-kuhnya-')&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(ROOT))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  // Navigations always use the installed shell, including installation query strings.
  const cached=await cache.match(request.mode==='navigate'?new URL('index.html',ROOT).href:request);
  if(!cached)return fetch(request);
  const range=request.headers?.get('Range');
  if(range&&/\.(m4a|mp3)$/.test(url.pathname)){
   const bytes=await cached.clone().arrayBuffer(),size=bytes.byteLength;
   const match=/^bytes=(\d*)-(\d*)$/.exec(range);
   let start=match?.[1]?Number(match[1]):0,end=match?.[2]?Number(match[2]):size-1;
   if(match&&!match[1]&&match[2]){start=Math.max(0,size-Number(match[2]));end=size-1;}
   if(!match||start>=size||start>end)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
   end=Math.min(end,size-1);
   return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':cached.headers.get('Content-Type')||'application/octet-stream','Content-Range':`bytes ${start}-${end}/${size}`,'Accept-Ranges':'bytes','Content-Length':String(end-start+1)}});
  }
  return cached;
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='ACTIVATE_UPDATE'){event.waitUntil(self.skipWaiting());return;}
 if(event.data?.type!=='CHECK_OFFLINE')return;
 event.waitUntil((async()=>{const cache=await caches.open(CACHE);const entries=await Promise.all(URLS.map(url=>cache.match(url)));event.ports[0]?.postMessage({ready:entries.every(Boolean)});})());
});
