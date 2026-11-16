// Cache the complete local save set; acknowledge only confirmed disk writes.
export async function createNativeStorage(preferences,key,onState=()=>{}){
 const grouped=Array.isArray(key),keys=grouped?key:[key];
 let values=Object.fromEntries(await Promise.all(keys.map(async name=>[name,(await preferences.get({key:name})).value??null])));
 let confirmed={...values},queue=Promise.resolve(),pending=0;
 const clean=()=>keys.every(name=>confirmed[name]===values[name]);
 function write(snapshot){
  pending++;onState('saving');
  queue=queue.then(async()=>{
   try{
    if(grouped)await preferences.setMany({values:snapshot});
    else await preferences.set({key:keys[0],value:snapshot[keys[0]]});
    confirmed=snapshot;
   }catch{/* Keep the latest complete snapshot available for retry. */}
   pending--;if(!pending)onState(clean()?'saved':'error');
  });
 }
 return {
  getItem(name){return values[name]??null;},
  setItem(name,next){if(!keys.includes(name))throw Error('Unexpected save key');values={...values,[name]:String(next)};write(values);},
  async flush(){
   if(!pending&&!clean())write(values);
   let waiting;do{waiting=queue;await waiting;}while(waiting!==queue);
   return clean();
  },
 };
}
