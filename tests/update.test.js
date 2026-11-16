import test from 'node:test';
import assert from 'node:assert/strict';
import {createUpdater} from '../dist/update.js';
function setup(){const sw=new EventTarget(),reg=new EventTarget();let sent=0,reloads=0,saves=0,busy=false,ok=true,view;sw.controller={};reg.waiting={postMessage:m=>{assert.equal(m.type,'ACTIVATE_UPDATE');sent++;}};const u=createUpdater({serviceWorker:sw,registration:reg,isBusy:()=>busy,save:()=>{saves++;return ok;},reload:()=>reloads++,show:v=>view=v});return {u,sw,reg,busy:v=>busy=v,ok:v=>ok=v,get:()=>({sent,reloads,saves,view})};}
test('waiting update is offered, never activated automatically',()=>{const t=setup();assert.equal(t.get().view,'available');assert.equal(t.get().sent,0);t.sw.dispatchEvent(new Event('controllerchange'));assert.equal(t.get().reloads,0);t.u.dispose();});
test('requested update waits for the turn, saves before activation and reloads once',()=>{const t=setup();t.busy(true);t.u.request();assert.equal(t.get().sent,0);t.busy(false);t.u.tick();assert.equal(t.get().saves,1);assert.equal(t.get().sent,1);t.sw.dispatchEvent(new Event('controllerchange'));t.sw.dispatchEvent(new Event('controllerchange'));assert.equal(t.get().reloads,1);t.u.dispose();});
test('failed save prevents activation and permits retry',()=>{const t=setup();t.ok(false);t.u.request();assert.equal(t.get().sent,0);assert.equal(t.get().view,'save-error');t.ok(true);t.u.request();assert.equal(t.get().sent,1);t.u.dispose();});
test('another tab activating does not reload this tab; button saves before reload',()=>{const t=setup();t.reg.waiting=null;t.sw.dispatchEvent(new Event('controllerchange'));assert.equal(t.get().reloads,0);t.u.request();assert.equal(t.get().saves,1);assert.equal(t.get().reloads,1);t.u.dispose();});
test('newly downloaded worker announces availability, not activation',()=>{const t=setup();const worker=new EventTarget();t.reg.waiting=null;t.reg.installing=worker;t.reg.dispatchEvent(new Event('updatefound'));worker.state='installed';worker.dispatchEvent(new Event('statechange'));assert.equal(t.get().view,'available');assert.equal(t.get().sent,0);t.u.dispose();});

test('manual check distinguishes latest version from a waiting update without activation',async()=>{
 const {checkForUpdate}=await import('../dist/update.js');
 let checks=0;const reg={update:async()=>{checks++;},waiting:null};
 assert.equal(await checkForUpdate(reg),'current');assert.equal(checks,1);
 reg.waiting={postMessage(){assert.fail('must not activate');}};
 assert.equal(await checkForUpdate(reg),'available');
});
test('manual check waits for full installation rather than reporting latest too early',async()=>{
 const {checkForUpdate}=await import('../dist/update.js');
 const worker=new EventTarget();worker.state='installing';
 const reg={update:async()=>{},installing:worker};let settled=false;
 const pending=checkForUpdate(reg).then(v=>{settled=true;return v;});
 await Promise.resolve();await Promise.resolve();assert.equal(settled,false);
 worker.state='installed';reg.waiting=worker;worker.dispatchEvent(new Event('statechange'));
 assert.equal(await pending,'available');
});
test('failed or stalled update checks surface errors, never say latest',async()=>{
 const {checkForUpdate}=await import('../dist/update.js');
 await assert.rejects(checkForUpdate({update:async()=>{throw Error('offline');}}),/offline/);
 await assert.rejects(checkForUpdate({update:()=>new Promise(()=>{})},10),/timeout/);
 const worker=new EventTarget();worker.state='redundant';
 await assert.rejects(checkForUpdate({update:async()=>{},installing:worker}),/failed/);
});
test('waiting worker discovered during a stalled update request resolves the check',async()=>{
 const {checkForUpdate}=await import('../dist/update.js');const reg=new EventTarget();reg.update=()=>new Promise(()=>{});
 const pending=checkForUpdate(reg,100);const worker=new EventTarget();worker.state='installing';reg.installing=worker;reg.dispatchEvent(new Event('updatefound'));
 worker.state='installed';reg.waiting=worker;worker.dispatchEvent(new Event('statechange'));
 assert.equal(await pending,'available');
});
test('an ongoing installation is observed without starting a competing update check',async()=>{
 const {checkForUpdate}=await import('../dist/update.js');const reg=new EventTarget();const worker=new EventTarget();worker.state='installing';reg.installing=worker;reg.update=()=>assert.fail('must not overlap');
 const pending=checkForUpdate(reg);worker.state='installed';reg.waiting=worker;worker.dispatchEvent(new Event('statechange'));assert.equal(await pending,'available');
});
test('progress and failed downloads are visible, and never activate or reload',()=>{
 const t=setup();t.reg.waiting=null;
 t.sw.dispatchEvent(new MessageEvent('message',{data:{type:'UPDATE_DOWNLOAD',state:'downloading',done:4,total:10}}));assert.equal(t.get().view,'downloading');
 t.sw.dispatchEvent(new MessageEvent('message',{data:{type:'UPDATE_DOWNLOAD',state:'download-error'}}));assert.equal(t.get().view,'download-error');assert.equal(t.get().reloads,0);assert.equal(t.get().sent,0);t.u.dispose();
});
test('first claim is quiet, but the same tab can apply a later release',()=>{
 const sw=new EventTarget(),reg=new EventTarget();let reloads=0,saves=0,view;
 const first=new EventTarget();first.state='installing';reg.installing=first;
 const u=createUpdater({serviceWorker:sw,registration:reg,isBusy:()=>false,save:()=>{saves++;return true;},reload:()=>reloads++,show:v=>view=v});
 try{
  sw.controller={};sw.dispatchEvent(new Event('controllerchange'));first.state='activated';first.dispatchEvent(new Event('statechange'));assert.equal(view,undefined);
  const next=new EventTarget();next.state='installing';reg.installing=next;reg.dispatchEvent(new Event('updatefound'));next.state='installed';reg.waiting={postMessage(){}};next.dispatchEvent(new Event('statechange'));
  u.request();sw.dispatchEvent(new Event('controllerchange'));assert.equal(reloads,1);assert.equal(saves,1);
 }finally{u.dispose();}
});

test('download progress from the installing worker extends the update deadline',async t=>{
 const {checkForUpdate}=await import('../dist/update.js');const sw=new EventTarget(),reg=new EventTarget(),worker=new EventTarget();worker.state='installing';reg.installing=worker;
 t.mock.timers.enable({apis:['setTimeout']});
 let error;const pending=checkForUpdate(reg,60,sw).catch(e=>{error=e;});
 for(let i=0;i<4;i++){t.mock.timers.tick(50);sw.dispatchEvent(Object.assign(new Event('message'),{source:worker,data:{type:'UPDATE_DOWNLOAD',state:'downloading'}}));}
 worker.state='installed';reg.waiting=worker;worker.dispatchEvent(new Event('statechange'));
 assert.equal(await pending,'available');assert.equal(error,undefined);
});

test('unrelated worker messages do not keep a stalled installation pending',async t=>{
 const {checkForUpdate}=await import('../dist/update.js');const sw=new EventTarget(),worker=new EventTarget();worker.state='installing';
 t.mock.timers.enable({apis:['setTimeout']});
 const pending=checkForUpdate({installing:worker},60,sw);const rejected=assert.rejects(pending,/timeout/);
 t.mock.timers.tick(50);sw.dispatchEvent(Object.assign(new Event('message'),{source:new EventTarget(),data:{type:'UPDATE_DOWNLOAD',state:'downloading'}}));
 t.mock.timers.tick(11);await rejected;
});
