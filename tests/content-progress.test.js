import test from 'node:test';
import assert from 'node:assert/strict';
import {levelRecipe,FIRST_LEVELS} from '../dist/recipes.js';
import {newGame,play,legalMoves,useBooster,boosterArea,openingHelperWin} from '../dist/engine.js';
import {newDailyGame,dailyOffer,recordDailyWin} from '../dist/daily.js';
import {foodPool} from '../dist/foods.js';
import {defaultProgress,loadProgress,saveProgress,KEY} from '../dist/storage.js';
const progression=await import('../dist/progression.js').catch(()=>({}));
const relaxed=await import('../dist/relaxed.js').catch(()=>({}));
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
const completeTo=n=>Array.from({length:n},(_,i)=>i+1);

test('first six levels introduce separated plates and a gentle food increase',()=>{
 assert.equal(levelRecipe(5).goals[0].amount,18);
 assert.equal(levelRecipe(6).goals.find(g=>g.kind==='food').amount,16);
 for(let n=1;n<=6;n++)assert.equal(newGame(n,{seed:22}).moves,24);
});
test('42 authored levels keep food goals in the pool and plates outside a single kettle',()=>{
 assert.equal(FIRST_LEVELS.length,42);assert.equal(new Set(FIRST_LEVELS.map(x=>x.title)).size,42);
 for(let n=1;n<=42;n++){
  const r=levelRecipe(n);assert.ok(r.goals.length<=2);assert.equal(r.pool.length,5);
  for(const g of r.goals)if(g.kind==='food')assert.ok(r.pool.includes(g.type));
  if(r.plates.length)for(let i=0;i<56;i++)assert.ok(boosterArea('kettle',i).filter(c=>r.plates.includes(c)).length<=r.plates.length/2,`level ${n}, kettle ${i}`);
 }
});
test('new foods replace at most one familiar dish per block and late goals are capped',()=>{
 assert.deepEqual(foodPool(18),[0,1,2,3,4]);assert.deepEqual(foodPool(19),[5,1,2,3,4]);assert.deepEqual(foodPool(31),[5,6,2,3,4]);
 for(let n=7;n<151;n+=12){const a=foodPool(n),b=foodPool(n+12);assert.ok(b.filter(t=>!a.includes(t)).length<=1);}
 for(const n of [43,78,138,10000]){const g=newGame(n,{seed:30});assert.ok(g.goals.every(x=>x.kind!=='food'||x.amount<=34));assert.equal(g.pool.length,5);assert.ok(g.board.every(x=>g.pool.includes(x)));}
});
test('recipe milestones are 6,18,30 and replay cannot duplicate awards',()=>{
 assert.equal(typeof progression.recordCampaignWin,'function');
 let p={...defaultProgress(),completed:completeTo(5),unlocked:6,game:{...newGame(6,{seed:1}),status:'won'}};
 p=progression.recordCampaignWin(p);assert.deepEqual(p.recipes.unlocked,['blini']);assert.deepEqual(p.recipes.milestones,[6]);
 assert.deepEqual(progression.recordCampaignWin(p),p);assert.equal(progression.nextRecipeReward(p).level,18);
 p={...p,completed:completeTo(17),unlocked:18,game:{...newGame(18,{seed:2}),status:'won'}};p=progression.recordCampaignWin(p);
 assert.deepEqual(p.recipes.unlocked,['blini','pelmeni']);assert.equal(progression.nextRecipeReward(p).level,30);
});
test('all twelve rewards are unique and the finished book stops promising new recipes',()=>{
 assert.equal(typeof progression.recordCampaignWin,'function');
 let p=defaultProgress();for(let i=0;i<12;i++){const level=6+i*12;p={...p,completed:completeTo(level-1),unlocked:level,game:{...newGame(level,{seed:1}),status:'won'}};p=progression.recordCampaignWin(p);}
 assert.equal(p.recipes.unlocked.length,12);assert.equal(new Set(p.recipes.unlocked).size,12);assert.equal(progression.nextRecipeReward(p),null);
});
test('missing earlier levels cannot be bypassed to claim a recipe',()=>{
 assert.equal(typeof progression.recordCampaignWin,'function');
 const p={...defaultProgress(),completed:[1,2,3,4],unlocked:6,game:{...newGame(6,{seed:9}),status:'won'}};
 assert.deepEqual(progression.recordCampaignWin(p).recipes.unlocked,[]);
});
test('legacy recipes survive and the next future milestone grants the next unseen dish',()=>{
 const s=memory(),old={version:1,unlocked:20,best:10,game:null,completed:completeTo(19),daily:{game:null,cards:[]},settings:{sound:true,music:true,reduced:false}};
 s.setItem('babushkina-kuhnya:v2',JSON.stringify(old));let p=loadProgress(s).data;
 assert.deepEqual(p.recipes?.unlocked,['blini','pelmeni','syrniki']);assert.deepEqual(p.recipes.milestones,[6,18]);
 p={...p,completed:completeTo(29),unlocked:30,game:{...newGame(30,{seed:3}),status:'won'}};p=progression.recordCampaignWin(p);
 assert.deepEqual(p.recipes.unlocked,['blini','pelmeni','syrniki','pirozhki']);
});
test('old repeated postcards keep their art when collection expands',()=>{
 const s=memory(),cards=Array.from({length:13},(_,i)=>`2026-10-${String(i+1).padStart(2,'0')}`);
 s.setItem('babushkina-kuhnya:v2',JSON.stringify({version:1,unlocked:1,best:0,game:null,completed:[],daily:{game:null,cards},settings:{sound:true,music:true,reduced:false}}));
 const {data:p,warning}=loadProgress(s);assert.equal(warning,null);assert.equal(p.daily.art?.[12],0);
 const daily=recordDailyWin({...p.daily,game:{...newDailyGame('2026-11-15'),status:'won'}});assert.equal(daily.art[13],12);assert.equal(daily.art[12],0);
});
test('daily year covers all four goals and never offers a one-helper win',()=>{
 const kinds=new Set();for(let i=0;i<40;i++){const date=new Date(Date.UTC(2026,0,1+i)).toISOString().slice(0,10),g=newDailyGame(date);kinds.add(g.goals.map(x=>x.kind).sort().join('+'));assert.equal(g.moves,16);assert.equal(openingHelperWin(g),false);}
 assert.deepEqual([...kinds].sort(),['food','food+food','food+plates','plates']);
});
test('unfinished daily helper phase is still resumable on the next date',()=>{
 const g={...newDailyGame('2026-11-15'),moves:0,status:'helpers'};assert.equal(dailyOffer({game:g,cards:[]},'2026-11-16'),'previous');
});
test('relaxed orders have no move limit and save independently from both other games',()=>{
 assert.equal(typeof relaxed.newRelaxedGame,'function');
 const g=relaxed.newRelaxedGame(1,{seed:2}),next=play(g,...legalMoves(g.board)[0]).game;assert.equal(next.moves,null);assert.equal(next.mode,'relaxed');
 const p={...defaultProgress(),game:newGame(3,{seed:5}),daily:{game:newDailyGame('2026-11-15'),cards:[],art:[]},relaxed:{game:next,completed:0}},s=memory();saveProgress(s,p);
 assert.equal(loadProgress(s).warning,null);assert.deepEqual(loadProgress(s).data,p);
});
test('zero-move phase and active dish pool survive reload while corrupt pools are rejected',()=>{
 const g={...newGame(31,{seed:2}),moves:0,status:'helpers'},p={...defaultProgress(),game:g},s=memory();saveProgress(s,p);assert.equal(loadProgress(s).warning,null);assert.deepEqual(loadProgress(s).data.game,g);
 for(const change of [{pool:[0,0,1,2,3]},{pool:[0,1,2,3,4]},{goals:[{kind:'food',type:9,amount:10}]}]){saveProgress(s,{...p,game:{...g,...change}});assert.ok(loadProgress(s).warning);}
});
test('old-tab writes cannot overwrite migrated recipes and relaxed progress',()=>{
 assert.notEqual(KEY,'babushkina-kuhnya:v2');const s=memory(),p=defaultProgress();saveProgress(s,p);s.setItem('babushkina-kuhnya:v2',JSON.stringify({version:1,unlocked:1,best:0,game:null,completed:[],settings:{sound:true,reduced:false}}));assert.deepEqual(loadProgress(s).data,p);
});
