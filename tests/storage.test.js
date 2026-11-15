import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../dist/engine.js';
import {loadProgress,saveProgress,defaultProgress,KEY} from '../dist/storage.js';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}};
test('roundtrips complete game and settings atomically',()=>{const s=memory(),p={...defaultProgress(),game:newGame(3),unlocked:3,best:800,settings:{sound:true,music:false,reduced:true}};assert.equal(saveProgress(s,p),true);assert.deepEqual(loadProgress(s).data,p);});
test('corrupt JSON and invalid board recover with explicit warning',()=>{for(const value of ['{','null',JSON.stringify({...defaultProgress(),game:{board:[7]}})]){const s=memory();s.setItem(KEY,value);const r=loadProgress(s);assert.ok(r.warning);assert.equal(r.data.game,null);}});
test('unavailable storage does not crash and reports failed saving',()=>{const s={getItem(){throw Error('denied')},setItem(){throw Error('full')}};assert.ok(loadProgress(s).warning);assert.equal(saveProgress(s,defaultProgress()),false);});
test('rejects negative, fractional or non-finite progress and mismatched completed status',()=>{for(const change of [{unlocked:-1},{best:1.5},{game:{...newGame(1),moves:-1}},{game:{...newGame(1),status:'won'}}]){const s=memory();s.setItem(KEY,JSON.stringify({...defaultProgress(),...change}));assert.ok(loadProgress(s).warning);}});
