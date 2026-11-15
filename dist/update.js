// Only the tab whose player pressed Update may reload. Never interrupt a turn.
export function createUpdater({serviceWorker,registration,isBusy,save,reload,show}){
 let requested=false,activating=false,changed=false,reloaded=false,timer=null;
 const cleanups=[];
 const listen=(target,event,fn)=>{target.addEventListener(event,fn);cleanups.push(()=>target.removeEventListener(event,fn));};
 function finish(){if(reloaded)return;reloaded=true;clearTimeout(timer);reload();}
 function tick(){
  if(!requested||activating||reloaded)return;
  if(isBusy()){show('waiting');return;}
  if(!save()){requested=false;show('save-error');return;}
  activating=true;show('activating');
  if(changed){finish();return;}
  if(!registration.waiting){requested=false;activating=false;show('retry');return;}
  timer=setTimeout(()=>{requested=false;activating=false;show('retry');},15000);
  registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
 }
 const hadController=!!serviceWorker.controller;
 listen(serviceWorker,'controllerchange',()=>{
  if(!hadController)return;
  changed=true;
  if(requested&&activating)finish();else show('available');
 });
 function watch(){const worker=registration.installing;if(worker)listen(worker,'statechange',()=>{if(worker.state==='installed'&&serviceWorker.controller)show('available');});}
 listen(registration,'updatefound',watch);watch();
 if(registration.waiting&&serviceWorker.controller)show('available');
 const interval=setInterval(tick,200);
 return {request(){if(activating||reloaded)return;requested=true;tick();},tick,dispose(){clearInterval(interval);clearTimeout(timer);cleanups.forEach(fn=>fn());}};
}
