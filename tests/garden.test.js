import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultProgress,loadProgress,KEY} from '../dist/storage.js';
import {newGame} from '../dist/engine.js';
import {recordCampaignWin} from '../dist/progression.js';
const garden=await import('../dist/garden.js').catch(()=>({}));
const funded=(n=30)=>({...defaultProgress(),completed:Array.from({length:n},(_,i)=>i+1),unlocked:n+1});
const won=(level=1)=>{const g=newGame(level,{seed:1});g.plates=[];g.goals.filter(x=>x.kind==='food').forEach(x=>g.collected[x.type]=x.amount);g.status='won';return g;};

test('one star for each first campaign win, reopening and replay never duplicate it',()=>{
 let p={...defaultProgress(),game:won()};p=recordCampaignWin(p);
 assert.equal(garden.starBalance?.(p),1);assert.equal(p.game.starReward,true);
 assert.deepEqual(recordCampaignWin(p),p);
 p=recordCampaignWin({...p,game:won()});assert.equal(garden.starBalance(p),1);assert.equal(p.game.starReward,false);
 p=recordCampaignWin({...p,game:won(2)});assert.equal(garden.starBalance(p),2);
});
test('loss, unfinished, daily and relaxed games cannot award campaign stars',()=>{
 for(const game of [newGame(1),{...won(),status:'lost'},{...won(),dailyDate:'2026-11-16'},{...won(),mode:'relaxed'}]){
 const p={...defaultProgress(),game};assert.deepEqual(recordCampaignWin(p),p);
 }
});
test('purchases spend exact cost, preserve game and cannot be repeated or exceed funds',()=>{
 assert.equal(typeof garden.buyGardenItem,'function');
 const p={...funded(),game:newGame(31)},copy=structuredClone(p);
 const r=garden.buyGardenItem(p,0,'vegetables',0);assert.equal(r.ok,true);assert.equal(garden.starBalance(r.data),29);assert.deepEqual(p,copy);assert.deepEqual(r.data.game,p.game);
 assert.equal(garden.buyGardenItem(r.data,0,'vegetables',0).ok,false);
 assert.equal(garden.buyGardenItem(defaultProgress(),0,'vegetables',0).ok,false);
 for(const args of [[4,'vegetables',0],[-1,'vegetables',0],[1,'unknown',0],[1,'vegetables',3],[.5,'vegetables',0]])assert.equal(garden.buyGardenItem(p,...args).ok,false);
});
test('two expansions unlock four new places each and are charged once per expansion',()=>{
 assert.equal(typeof garden.expandGarden,'function');let p=funded();
 assert.equal(garden.gardenCapacity(p),4);
 let r=garden.expandGarden(p);assert.equal(r.ok,true);p=r.data;assert.equal(garden.gardenCapacity(p),8);assert.equal(garden.starBalance(p),27);
 assert.equal(garden.buyGardenItem(p,7,'greenhouse',1).ok,true);
 p=garden.expandGarden(p).data;assert.equal(garden.gardenCapacity(p),12);assert.equal(garden.starBalance(p),22);
 assert.equal(garden.expandGarden(p).ok,false);assert.equal(garden.expandGarden(defaultProgress()).ok,false);
});
test('changing purchased variant is free, keeps its type and survives save reload',()=>{
 assert.equal(typeof garden.changeGardenVariant,'function');
 let p=garden.buyGardenItem(funded(2),0,'vegetables',0).data;
 p=garden.changeGardenVariant(p,0,1).data;assert.equal(garden.starBalance(p),1);assert.equal(p.garden.plots[0].variant,1);
 assert.equal(garden.changeGardenVariant(p,1,1).ok,false);
 const saved=loadProgress({getItem:k=>k===KEY?JSON.stringify(p):null});assert.equal(saved.warning,null);assert.deepEqual(saved.data,p);
});
test('save validation rejects impossible plots, overspend and bad variants',()=>{
 assert.ok(defaultProgress().garden);
 const bad=[{expansion:3,plots:[]},{expansion:0,plots:[{slot:4,item:'vegetables',variant:0}]},{expansion:0,plots:[{slot:0,item:'vegetables',variant:2}]},{expansion:0,plots:[{slot:0,item:'bad',variant:0}]},{expansion:0,plots:[{slot:0,item:'vegetables',variant:0},{slot:0,item:'vegetables',variant:0}]}];
 for(const g of bad)assert.ok(loadProgress({getItem:k=>k===KEY?JSON.stringify({...funded(),garden:g}):null}).warning);
 assert.ok(loadProgress({getItem:k=>k===KEY?JSON.stringify({...defaultProgress(),garden:{expansion:0,plots:[{slot:0,item:'vegetables',variant:0}]}}):null}).warning);
});
