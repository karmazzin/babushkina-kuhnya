import test from 'node:test';
import assert from 'node:assert/strict';
import {offlineRegistration} from '../dist/offline.js';
test('failed first install does not leave readiness pending forever',async()=>{const sw={register:async()=>({}),ready:new Promise(()=>{})};await assert.rejects(offlineRegistration(sw,10),/timeout/);});
test('registration itself has a deadline',async()=>{const sw={register:()=>new Promise(()=>{}),ready:Promise.resolve({})};await assert.rejects(offlineRegistration(sw,10),/timeout/);});
test('returns active registration and propagates registration errors',async()=>{const registration={active:true};assert.equal(await offlineRegistration({register:async()=>{},ready:Promise.resolve(registration)},100),registration);await assert.rejects(offlineRegistration({register:async()=>{throw Error('denied')}},100),/denied/);});
test('existing registration is returned before a stalled network register or ready',async()=>{
 const registration={waiting:{},active:{}};let registered=false;
 const result=await offlineRegistration({getRegistration:async()=>registration,register:()=>{registered=true;return new Promise(()=>{});},ready:new Promise(()=>{})},20);
 assert.equal(result,registration);assert.equal(registered,false);
});
test('new registration is exposed while its first installation is still running',async()=>{
 const registration={installing:{}};
 assert.equal(await offlineRegistration({getRegistration:async()=>null,register:async()=>registration,ready:new Promise(()=>{})},20),registration);
});
test('simultaneous startup and manual check share one registration attempt',async()=>{
 let calls=0;const finish=[];const registration={installing:{}};
 const sw={register:()=>{calls++;return new Promise(resolve=>{finish.push(()=>resolve(registration));});}};
 const a=offlineRegistration(sw),b=offlineRegistration(sw);await Promise.resolve();await Promise.resolve();
 finish.forEach(fn=>fn());assert.equal(await a,registration);assert.equal(await b,registration);assert.equal(calls,1);
});
