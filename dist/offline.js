export async function offlineRegistration(serviceWorker,timeoutMs=45000){
 let timer;
 try{return await Promise.race([
  (async()=>{await serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});return await serviceWorker.ready;})(),
  new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Offline preparation timeout')),timeoutMs);})
 ]);}finally{clearTimeout(timer);}
}
