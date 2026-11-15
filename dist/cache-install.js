// Classic worker helper: verified reuse also works with caches made by older releases.
self.installRelease=async function({name,root,hashes,progress=()=>{}}){
 const target=await caches.open(name),names=(await caches.keys()).filter(n=>n.startsWith('babushkina-kuhnya-')&&n!==name).reverse();
 const sources=[target,...await Promise.all(names.map(n=>caches.open(n)))];
 const entries=Object.entries(hashes);let next=0,done=0;
 async function valid(response,hash){
  if(!response?.ok)return false;
  const bytes=await response.clone().arrayBuffer();
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')===hash;
 }
 async function download(url,hash){
  let error;
  for(let attempt=0;attempt<3;attempt++){
   const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),25000);
   try{
    const response=await fetch(new Request(url,{cache:'reload',signal:abort.signal}));
    if(!await valid(response,hash))throw Error('Release integrity check failed');
    return response;
   }catch(e){error=e;}finally{clearTimeout(timer);}
  }
  throw error;
 }
 async function run(){
  while(next<entries.length){
   const [path,hash]=entries[next++],url=new URL(path,root).href;
   let response;
   for(const cache of sources){const candidate=await cache.match(url);if(await valid(candidate,hash)){response=candidate;break;}}
   if(!response)response=await download(url,hash);
   await target.put(url,response);done++;await progress(done,entries.length);
  }
 }
 await Promise.all(Array.from({length:4},run));
 await target.put(root,await target.match(new URL('index.html',root).href));
};
