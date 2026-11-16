const pendingRegistrations=new WeakMap();
export function offlineRegistration(serviceWorker,timeoutMs=45000,page=globalThis.document){
 if(!serviceWorker)return Promise.reject(Error('Service workers unavailable'));
 if(pendingRegistrations.has(serviceWorker))return pendingRegistrations.get(serviceWorker);
 // Wait for visible page resources before starting the complete offline download.
 const ready=page&&page.readyState!=='complete'
  ?new Promise(resolve=>page.defaultView.addEventListener('load',resolve,{once:true})).then(()=>discoverRegistration(serviceWorker,timeoutMs))
  :discoverRegistration(serviceWorker,timeoutMs);
 const pending=ready.finally(()=>pendingRegistrations.delete(serviceWorker));
 pendingRegistrations.set(serviceWorker,pending);return pending;
}
async function discoverRegistration(serviceWorker,timeoutMs){
 let timer;
 try{return await Promise.race([
  (async()=>{
   // Discovery must not wait for a network update: a waiting worker may already exist.
   const existing=await serviceWorker.getRegistration?.('./');
   if(existing)return existing;
   const registration=await serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
   if(registration?.active||registration?.installing||registration?.waiting)return registration;
   return await serviceWorker.ready;
  })(),
  new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Offline preparation timeout')),timeoutMs);})
 ]);}finally{clearTimeout(timer);}
}
