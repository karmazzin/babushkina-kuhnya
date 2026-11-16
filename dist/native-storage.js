// A synchronous game-state cache over the asynchronous native Preferences API.
// Startup must finish reading before the game can create or overwrite a save.
export async function createNativeStorage(preferences,key,onState=()=>{}){
 const initial=await preferences.get({key});
 let value=initial.value,confirmed=value,queue=Promise.resolve(),pending=0;
 function write(snapshot){
  pending++;onState('saving');
  queue=queue.then(async()=>{
   try{await preferences.set({key,value:snapshot});confirmed=snapshot;}catch{/* Keep the latest snapshot available for retry. */}
   pending--;if(!pending)onState(confirmed===value?'saved':'error');
  });
 }
 return {
  getItem(name){return name===key?value:null;},
  setItem(name,next){if(name!==key)throw Error('Unexpected save key');value=String(next);write(value);},
  async flush(){
   if(!pending&&confirmed!==value)write(value);
   // Include any writes queued while a previous write was in flight.
   let waiting;do{waiting=queue;await waiting;}while(waiting!==queue);
   return confirmed===value;
  },
 };
}
