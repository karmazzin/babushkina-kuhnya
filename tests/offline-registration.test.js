import test from 'node:test';
import assert from 'node:assert/strict';
import {offlineRegistration} from '../dist/offline.js';
test('failed first install does not leave readiness pending forever',async()=>{const sw={register:async()=>({}),ready:new Promise(()=>{})};await assert.rejects(offlineRegistration(sw,10),/timeout/);});
test('registration itself has a deadline',async()=>{const sw={register:()=>new Promise(()=>{}),ready:Promise.resolve({})};await assert.rejects(offlineRegistration(sw,10),/timeout/);});
test('returns active registration and propagates registration errors',async()=>{const registration={active:true};assert.equal(await offlineRegistration({register:async()=>{},ready:Promise.resolve(registration)},100),registration);await assert.rejects(offlineRegistration({register:async()=>{throw Error('denied')}},100),/denied/);});
