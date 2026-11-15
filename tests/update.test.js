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
