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
 // Ignore only the first claim; this tab must still observe later releases.
 let hadController=!!serviceWorker.controller;
 listen(serviceWorker,'controllerchange',()=>{
  if(!hadController){hadController=true;return;}
  changed=true;
  if(requested&&activating)finish();else show('available');
 });
 const observed=new WeakSet();
 function watch(){const worker=registration.installing;if(!worker||observed.has(worker))return;observed.add(worker);
  const inspect=()=>{if(!serviceWorker.controller||activating)return;if(worker.state==='installed')show('available');else if(worker.state==='redundant')show('download-error');else if(worker.state==='installing')show('downloading');};
  listen(worker,'statechange',inspect);inspect();
 }
 listen(serviceWorker,'message',event=>{
  if(event.data?.type!=='UPDATE_DOWNLOAD'||!serviceWorker.controller||activating||registration.waiting)return;
  if(['downloading','download-error'].includes(event.data.state))show(event.data.state,event.data);
 });
 listen(registration,'updatefound',watch);watch();
 if(registration.waiting&&serviceWorker.controller)show('available');
 const interval=setInterval(tick,200);
 return {request(){if(activating||reloaded)return;requested=true;tick();},tick,dispose(){clearInterval(interval);clearTimeout(timer);cleanups.forEach(fn=>fn());}};
}

// Observe before checking: slow network requests must not hide an already installed worker.
export function checkForUpdate(registration,timeoutMs=120000){
 return new Promise((resolve,reject)=>{
  let settled=false;const cleanups=[],seen=new WeakSet();
  const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);cleanups.forEach(fn=>fn());error?reject(error):resolve(value);};
  const timer=setTimeout(()=>finish(Error('Update check timeout')),timeoutMs);
  const listen=(target,event,fn)=>{target.addEventListener?.(event,fn);cleanups.push(()=>target.removeEventListener?.(event,fn));};
  function watch(){
   if(registration.waiting){finish(null,'available');return;}
   const worker=registration.installing;if(!worker||seen.has(worker))return;seen.add(worker);
   const inspect=()=>{if(worker.state==='installed')finish(null,'available');else if(worker.state==='activated')finish(null,'current');else if(worker.state==='redundant')finish(Error('Update installation failed'));};
   listen(worker,'statechange',inspect);inspect();
  }
  listen(registration,'updatefound',watch);watch();
  if(settled||registration.installing)return;
  Promise.resolve().then(()=>registration.update()).then(()=>{if(settled)return;watch();if(!registration.installing&&!registration.waiting)finish(null,'current');},error=>finish(error));
 });
}
