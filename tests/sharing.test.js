import test from 'node:test';
import assert from 'node:assert/strict';
import {sharePostcard} from '../dist/sharing.js';
test('shares the actual prepared image file immediately',async()=>{const file={name:'card.jpg'};let called=false;const promise=sharePostcard({canShare:({files})=>files[0]===file,share:({files})=>{called=true;assert.equal(files[0],file);return Promise.resolve();}},file);assert.ok(called);assert.equal(await promise,'shared');});
test('unsupported sharing preserves download fallback and cancellation is silent',async()=>{assert.equal(await sharePostcard({},{}),'unsupported');assert.equal(await sharePostcard({canShare:()=>true,share:()=>Promise.reject({name:'AbortError'})},{}),'cancelled');assert.equal(await sharePostcard({canShare:()=>true,share:()=>Promise.reject({name:'NotAllowedError'})},{}),'failed');});
