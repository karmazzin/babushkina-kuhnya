// Classic worker helper: verified reuse also works with caches made by older releases.
self.installRelease=async function({name,root,hashes,progress=()=>{}}){
 const target=await caches.open(name),names=(await caches.keys()).filter(n=>n.startsWith('babushkina-kuhnya-')&&n!==name).reverse();
 const sources=[target,...await Promise.all(names.map(n=>caches.open(n)))];
 const entries=Object.entries(hashes);let next=0,done=0,lastProgress=0;
 async function valid(response,hash){
  if(!response?.ok)return false;
  const bytes=await response.clone().arrayBuffer();
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')===hash;
 }
 async function download(url,hash){
  let error;
  for(let attempt=0;attempt<3;attempt++){
   const abort=new AbortController();let timer,reader;
   // A slow, progressing transfer is healthy. Only abandon a silent connection.
   const touch=()=>{clearTimeout(timer);timer=setTimeout(()=>abort.abort(),60000);};
   touch();
   try{
    const response=await fetch(new Request(url,{cache:'reload',signal:abort.signal}));
    if(!response.ok)throw Error('Download failed: '+response.status);
    touch();reader=response.body.getReader();
    const chunks=[];let size=0;
    while(true){
     const {done:ended,value}=await reader.read();if(ended)break;
     if(!value.byteLength)continue;
     touch();chunks.push(value);size+=value.byteLength;
     // Keep first-install and update observers alive while a large file is arriving.
     if(Date.now()-lastProgress>=10000){lastProgress=Date.now();await progress(done,entries.length);}
    }
    clearTimeout(timer);
    const bytes=new Uint8Array(size);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    const complete=new Response(bytes,{status:response.status,statusText:response.statusText,headers:response.headers});
    if(!await valid(complete,hash))throw Error('Release integrity check failed');
    return complete;
   }catch(e){error=e;}finally{clearTimeout(timer);reader?.releaseLock();}

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
