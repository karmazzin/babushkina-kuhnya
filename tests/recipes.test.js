import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,play,legalMoves,boosterArea,useBooster,goalComplete,earnedBoosters} from '../dist/engine.js';
import {levelRecipe} from '../dist/recipes.js';
import {defaultProgress,loadProgress,saveProgress,KEY} from '../dist/storage.js';
test('campaign includes single dish, two dishes, plates and combined goals',()=>{
 const levels=Array.from({length:18},(_,i)=>levelRecipe(i+1));
 assert.equal(levels[0].goals[0].kind,'food');assert.equal(levels[1].goals[0].kind,'food');
 assert.equal(levels[2].goals.length,2);assert.ok(levels[5].goals.some(g=>g.kind==='plates'));assert.equal(levelRecipe(19).chapter,'Гости к чаю');
});
test('collection levels require their dishes even with huge score',()=>{
 const g=newGame(3);g.score=99999;assert.equal(goalComplete(g),false);g.goals.forEach(x=>g.collected[x.type]=x.amount);assert.equal(goalComplete(g),true);
});
test('helpers clip at edges, never wrap rows, and reject invalid targets',()=>{
 assert.deepEqual(boosterArea('rolling',8),[7,8,9,10,11,12,13]);
 assert.deepEqual(boosterArea('kettle',0),[0,1,7,8]);assert.deepEqual(boosterArea('kettle',55),[47,48,54,55]);
 assert.deepEqual(boosterArea('kettle',-1),[]);assert.deepEqual(boosterArea('other',0),[]);
});
test('helper consumes one charge, no move, counts all removals, does not earn helpers',()=>{
 const g=newGame(3),copy=structuredClone(g);const r=useBooster(g,'kettle',24);assert.equal(r.valid,true);assert.equal(r.game.moves,24);
 assert.deepEqual(g,copy);assert.deepEqual(r.game.boosters,{rolling:1,kettle:0});
 const counts=Array(10).fill(0);r.frames.forEach(f=>f.removed.forEach(i=>counts[f.before[i]]++));assert.deepEqual(r.game.collected,counts);
 assert.equal(useBooster(r.game,'kettle',24).valid,false);assert.equal(useBooster({...g,status:'won'},'rolling',5).valid,false);
});
test('four in a row earns rolling pin; intersection earns kettle; rewards capped by inventory',()=>{
 const b=Array.from({length:56},(_,i)=>(i%7+Math.floor(i/7)*2)%5);[7,8,9,10].forEach(i=>b[i]=4);
 assert.deepEqual(earnedBoosters(b,[7,8,9,10]),{rolling:1,kettle:0});
 [8,9,10,2,16].forEach(i=>b[i]=3);assert.equal(earnedBoosters(b,[8,9,10,2,16]).kettle,1);
});
test('legacy games preserve score goals; new saves and completed recipes roundtrip',()=>{
 const old=newGame(2);delete old.goals;delete old.collected;delete old.boosters;
 const p={...defaultProgress(),unlocked:2,game:old};delete p.completed;
 const migrated=loadProgress({getItem:()=>JSON.stringify(p)});assert.equal(migrated.warning,null);assert.equal(migrated.data.game.goals,undefined);assert.deepEqual(migrated.data.completed,[1]);
 const fresh={...defaultProgress(),game:newGame(4),completed:[1,2,3],unlocked:4};let raw;saveProgress({setItem:(k,v)=>raw=v},fresh);assert.deepEqual(loadProgress({getItem:()=>raw}).data,fresh);
});
test('rejects corrupt helper inventory, goals and recipe counters',()=>{
 for(const change of [{boosters:{rolling:-1,kettle:1}},{collected:[0,0,0,0,-1]},{goals:[{kind:'food',type:9,amount:5}]}]){
  const p={...defaultProgress(),game:{...newGame(2),...change}};assert.ok(loadProgress({getItem:()=>JSON.stringify(p)}).warning);
 }
});
test('recipe wins on last move; earned inventory never exceeds three',()=>{
 for(let n=0;n<20;n++){
  const g=newGame(2);g.moves=1;g.goals=[{kind:'food',type:g.board[legalMoves(g.board)[0][0]],amount:1}];g.collected=[100,100,100,100,100];g.boosters={rolling:3,kettle:3};
  const r=play(g,...legalMoves(g.board)[0]);assert.equal(r.game.status,'won');assert.ok(Object.values(r.game.boosters).every(n=>n<=3));
 }
});
