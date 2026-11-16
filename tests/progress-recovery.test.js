import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,legalMoves,play} from '../dist/engine.js';
import {newDailyGame} from '../dist/daily.js';
import {newRelaxedGame} from '../dist/relaxed.js';
import * as saves from '../dist/storage.js';
const {KEY,defaultProgress,loadProgress,saveProgress}=saves;
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k),map};};
const reached=(level=30)=>({...defaultProgress(),unlocked:level,best:4200,completed:Array.from({length:level-1},(_,i)=>i+1),game:newGame(level,{seed:73}),garden:{expansion:1,plots:[{slot:4,item:'berries',variant:1}]},daily:{game:newDailyGame('2026-11-16'),cards:['2026-11-15'],art:[5]},relaxed:{game:newRelaxedGame(4,{seed:30}),completed:3}});

test('a level-30 save from before tea keeps achievements and all three playable boards',()=>{
 const s=memory(),p=reached();delete p.seenTea;for(const g of [p.game,p.daily.game,p.relaxed.game])delete g.servedTea;
 s.setItem(KEY,JSON.stringify(p));const {data,warning}=loadProgress(s);
 assert.equal(data.unlocked,30);assert.equal(data.best,4200);assert.deepEqual(data.completed,p.completed);assert.deepEqual(data.garden,p.garden);assert.deepEqual(data.daily.cards,p.daily.cards);assert.deepEqual(data.daily.art,[5]);assert.equal(data.relaxed.completed,3);assert.equal(data.seenTea,false);assert.equal(data.game.servedTea,0);assert.equal(warning,null);
 assert.equal(play(data.game,...legalMoves(data.game.board)[0]).valid,true);
});
test('one corrupt board never resets levels, collections, settings or the other modes',()=>{
 for(const mode of ['game','daily','relaxed']){
  const s=memory(),p=reached();p.settings.music=false;
  if(mode==='game')p.game.board=[7];else p[mode].game.board=[7];s.setItem(KEY,JSON.stringify(p));const r=loadProgress(s);
  assert.equal(r.data.unlocked,30,mode);assert.equal(r.data.best,4200);assert.deepEqual(r.data.completed,p.completed);assert.deepEqual(r.data.daily.cards,p.daily.cards);assert.equal(r.data.settings.music,false);assert.ok(r.warning);
  for(const other of ['game','daily','relaxed'])assert.deepEqual(other==='game'?r.data.game:r.data[other].game,other===mode?null:other==='game'?p.game:p[other].game);
 }
});
test('missing new feature/settings fields use defaults without erasing existing progress',()=>{
 const s=memory(),p=reached();delete p.seenTea;delete p.seenHelpers;delete p.settings.soundVolume;delete p.relaxed;s.setItem(KEY,JSON.stringify(p));
 const r=loadProgress(s);assert.equal(r.data.unlocked,30);assert.equal(r.data.settings.soundVolume,.35);assert.deepEqual(r.data.relaxed,{game:null,completed:0});assert.equal(r.warning,null);
});
test('an invalid setting is repaired independently of achievements',()=>{
 const s=memory(),p=reached();p.settings.soundVolume=900;s.setItem(KEY,JSON.stringify(p));const r=loadProgress(s);assert.equal(r.data.unlocked,30);assert.equal(r.data.settings.soundVolume,.35);assert.ok(r.warning);
});
test('previously named keys recover higher achievements even after a level-1 reset',()=>{
 const s=memory(),p=reached();p.game={level:30,board:[1],ruleVersion:1};delete p.completed;
 s.setItem('babushkina-kuhnya:v2',JSON.stringify(p));s.setItem(KEY,JSON.stringify(defaultProgress()));
 const r=loadProgress(s);assert.equal(r.data.unlocked,30);assert.equal(r.data.completed.length,29);assert.equal(r.data.game,null);assert.ok(r.warning);
 assert.equal(saveProgress(s,r.data),true);assert.equal(loadProgress(s).data.unlocked,30);assert.ok(s.getItem('babushkina-kuhnya:v2'));
});
test('backups recover a corrupt primary and the independent achievement checkpoint keeps the newest level',()=>{
 const s=memory();saveProgress(s,reached(30));saveProgress(s,reached(31));s.setItem(KEY,'{broken');const r=loadProgress(s);
 assert.equal(r.data.unlocked,31);assert.equal(r.data.best,4200);assert.equal(r.data.completed.length,30);assert.deepEqual(r.data.daily.art,[5]);assert.ok(r.warning);
});
test('an accidentally lower snapshot cannot erase the achievement checkpoint',()=>{
 const s=memory();saveProgress(s,reached());saveProgress(s,defaultProgress());saveProgress(s,defaultProgress());assert.equal(loadProgress(s).data.unlocked,30);
});
test('unknown additive fields survive a roundtrip',()=>{
 const s=memory(),p={...reached(),newCollection:{items:['rose']}};saveProgress(s,p);assert.deepEqual(loadProgress(s).data.newCollection,p.newCollection);
});
test('a failed main write leaves a usable latest checkpoint and does not erase the previous save',()=>{
 const s=memory();saveProgress(s,reached(30));const before=s.getItem(KEY),write=s.setItem;s.setItem=(k,v)=>{if(k===KEY)throw Error('quota');write(k,v);};
 assert.equal(saveProgress(s,reached(31)),false);assert.equal(s.getItem(KEY),before);assert.equal(loadProgress(s).data.unlocked,31);
});
test('explicit device reset does not resurrect achievements from backups or old named keys',()=>{
 assert.equal(typeof saves.resetProgress,'function');const s=memory();s.setItem('babushkina-kuhnya:v2',JSON.stringify(reached()));saveProgress(s,reached());
 const reset=saves.resetProgress(s);assert.equal(reset.ok,true);assert.equal(loadProgress(s).data.unlocked,1);assert.deepEqual(loadProgress(s).data.completed,[]);saveProgress(s,loadProgress(s).data);assert.equal(loadProgress(s).data.unlocked,1);
});
test('unexpected nested game shapes only discard that board',()=>{
 for(const bad of [{goals:{}},{goals:'tea'},{board:null},{boosters:null}]){
  const s=memory(),p=reached();Object.assign(p.game,bad);delete p.game.servedTea;s.setItem(KEY,JSON.stringify(p));const r=loadProgress(s);assert.equal(r.data.unlocked,30);assert.equal(r.data.game,null);assert.equal(r.data.daily.cards.length,1);
 }
});
test('a corrupt primary after explicit reset cannot resurrect the pre-reset backup',()=>{
 const s=memory();saveProgress(s,reached());saves.resetProgress(s);s.setItem(KEY,'{');assert.equal(loadProgress(s).data.unlocked,1);
});

// Fixture generated by pre-garden commit 5efc8b3d93d692b7cb72d2a8f340d4e077e456c9.
import {readFileSync} from 'node:fs';
import {starBalance,changeGardenVariant} from '../dist/garden.js';
test('actual pre-garden release save survives update and the next move',()=>{
 const p=JSON.parse(readFileSync(new URL('./fixtures/pre-garden-progress.json',import.meta.url)));const s=memory();s.setItem(KEY,JSON.stringify(p));
 const r=loadProgress(s);assert.equal(r.warning,null);assert.equal(r.data.unlocked,30);assert.equal(r.data.best,4200);assert.deepEqual(r.data.completed,p.completed);assert.deepEqual(r.data.daily,p.daily);assert.deepEqual(r.data.relaxed,p.relaxed);assert.equal(starBalance(r.data),29);
 r.data.game=play(r.data.game,...legalMoves(r.data.game.board)[0]).game;assert.equal(saveProgress(s,r.data),true);assert.deepEqual(loadProgress(s).data,r.data);
});
test('garden purchases expansions variants and spent stars survive checkpoint recovery',()=>{
 const s=memory(),p=reached();saveProgress(s,p);const updated=changeGardenVariant(p,4,0).data;saveProgress(s,updated);s.setItem(KEY,'{broken');
 const r=loadProgress(s);assert.deepEqual(r.data.garden,updated.garden);assert.equal(starBalance(r.data),24);assert.equal(r.data.unlocked,30);
});
test('invalid garden cannot erase achievements or valid boards',()=>{
 const s=memory(),p=reached();p.garden.plots[0].item='unknown';s.setItem(KEY,JSON.stringify(p));const r=loadProgress(s);
 assert.equal(r.data.unlocked,30);assert.equal(r.data.best,4200);assert.deepEqual(r.data.game,p.game);assert.deepEqual(r.data.garden,{expansion:0,plots:[]});assert.ok(r.warning);
});

import {createUpdater} from '../dist/update.js';
test('update activation saves first and reload retains garden achievements and all boards',()=>{
 const s=memory(),p=reached();saveProgress(s,p);const baseline=s.getItem(KEY);
 const sw=new EventTarget(),registration=new EventTarget();sw.controller={};let reloaded=null,activations=0;
 registration.waiting={postMessage(){activations++;assert.equal(loadProgress(s).data.unlocked,30);sw.dispatchEvent(new Event('controllerchange'));}};
 const updater=createUpdater({serviceWorker:sw,registration,isBusy:()=>false,save:()=>saves.saveBeforeUpdate(s,p,baseline).ok,reload:()=>{reloaded=loadProgress(s).data;},show(){}});
 try{updater.request();assert.equal(activations,1);assert.deepEqual(reloaded,p);assert.equal(starBalance(reloaded),24);assert.equal(play(reloaded.game,...legalMoves(reloaded.game.board)[0]).valid,true);}finally{updater.dispose();}
});
test('failed backup write leaves original save intact and blocks update activation',()=>{
 const s=memory(),p=reached();saveProgress(s,p);const baseline=s.getItem(KEY);s.setItem=()=>{throw Error('quota');};
 const sw=new EventTarget(),registration=new EventTarget();sw.controller={};let state;registration.waiting={postMessage(){assert.fail('must not activate');}};
 const updater=createUpdater({serviceWorker:sw,registration,isBusy:()=>false,save:()=>saves.saveBeforeUpdate(s,p,baseline).ok,reload:()=>assert.fail('must not reload'),show:value=>state=value});
 try{updater.request();assert.equal(state,'save-error');assert.equal(s.getItem(KEY),baseline);assert.equal(loadProgress(s).data.unlocked,30);}finally{updater.dispose();}
});
test('recovering an abandoned save also preserves its valid garden',()=>{
 const s=memory(),p=reached();s.setItem('babushkina-kuhnya:v2',JSON.stringify(p));const r=loadProgress(s);assert.deepEqual(r.data.garden,p.garden);assert.equal(starBalance(r.data),24);
});
test('new progress after explicit reset replaces the previous generation backup',()=>{
 const s=memory();saveProgress(s,reached(30));const reset=saves.resetProgress(s);const p={...reached(8),resetToken:reset.data.resetToken};saveProgress(s,p);saveProgress(s,p);s.setItem(KEY,'{');s.setItem(saves.CHECKPOINT_KEY,'{');
 const r=loadProgress(s);assert.equal(r.data.unlocked,8);assert.deepEqual(r.data.garden,p.garden);
});
test('explicit reset also replaces the backup before any new play',()=>{
 const s=memory();saveProgress(s,reached());saveProgress(s,reached());saves.resetProgress(s);s.setItem(KEY,'{');s.setItem(saves.CHECKPOINT_KEY,'{');assert.equal(loadProgress(s).data.unlocked,1);
});
