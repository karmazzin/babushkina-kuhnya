import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,useBooster,play,legalMoves,goalComplete} from '../dist/engine.js';
import {levelRecipe} from '../dist/recipes.js';
import {loadProgress,defaultProgress} from '../dist/storage.js';
import {goalText,goalMarkup} from '../dist/book.js';
import * as book from '../dist/book.js';
import * as gestures from '../dist/gestures.js';
import {createAudio} from '../dist/audio.js';

test('first twelve authored levels have distinct names and introduce plates on four',()=>{
 const levels=Array.from({length:12},(_,i)=>levelRecipe(i+1));
 assert.equal(new Set(levels.map(l=>l.title)).size,12);
 assert.ok(levels.every(l=>l.goals.length>=1&&l.goals.length<=2));
 assert.ok(levels.slice(0,3).every(l=>l.goals.every(g=>g.kind==='food')));
 assert.ok(levels[3].goals.some(g=>g.kind==='plates'));
 assert.ok(levels[10].goals.some(g=>g.kind==='plates'));
 for(let i=0;i<12;i++){const g=newGame(i+1);assert.equal(g.plates.length,new Set(g.plates).size);assert.ok(g.plates.every(n=>n>=0&&n<56));assert.equal(goalComplete(g),false);}
});
test('plates stay fixed, clear once under matches and helpers, frames keep progress',()=>{
 const g={...newGame(4),plates:[0,7,24,55],goals:[{kind:'plates',amount:4}]},copy=structuredClone(g);
 const r=useBooster(g,'rolling',1);
 assert.deepEqual(g,copy);
 assert.deepEqual(r.frames[0].platesBefore,[0,7,24,55]);assert.deepEqual(r.frames[0].platesAfter,[7,24,55]);
 const removed=new Set(r.frames.flatMap(f=>f.removed));assert.deepEqual(r.game.plates,g.plates.filter(i=>!removed.has(i)));
 assert.ok(r.frames.every(f=>Array.isArray(f.collected)));assert.equal(r.game.moves,g.moves);
});
test('plate objective can win with no food objective and on the final move',()=>{
 const g=newGame(4),move=legalMoves(g.board)[0];const baseline=play(g,...move);
 const last={...g,moves:1,plates:[baseline.frames[0].removed[0]],goals:[{kind:'plates',amount:1}]};
 assert.equal(play(last,...move).game.status,'won');
 const helper={...g,plates:[24],goals:[{kind:'plates',amount:1}]};assert.equal(useBooster(helper,'kettle',24).game.status,'won');
});
test('plate save roundtrips and corrupt or missing plate cells are rejected',()=>{
 const p={...defaultProgress(),game:newGame(4)};const read=x=>loadProgress({getItem:k=>k==='babushkina-kuhnya:progress'?JSON.stringify(x):null});
 assert.deepEqual(read(p).data,p);assert.equal(read(p).warning,null);
 for(const plates of [[-1],[56],[1,1],undefined])assert.ok(read({...p,game:{...p.game,plates}}).warning);
});
test('plate goal text and accessible progress are meaningful',()=>{
 const g={...newGame(4),plates:[24],goals:[{kind:'plates',amount:4}]};
 assert.match(goalText(g),/тарел/i);assert.match(goalMarkup(g),/Тарелки: 3 из 4/);assert.doesNotMatch(goalMarkup(g),/undefined|NaN/);
});
test('gesture ignores jitter and diagonal ambiguity, locks axis and never wraps',()=>{
 assert.equal(typeof gestures.swipeIntent,'function');const swipe=gestures.swipeIntent;
 assert.equal(swipe(8,3,2,48).target,null);assert.equal(swipe(8,16,15,48).target,null);
 assert.equal(swipe(8,18,2,48).target,9);assert.equal(swipe(8,2,-18,48).target,1);
 assert.equal(swipe(6,30,0,48).target,null);assert.equal(swipe(0,0,-30,48).target,null);
 assert.equal(swipe(8,20,35,48,'x').target,9);assert.equal(swipe(8,4,35,48,'x').target,null);
});
test('quiet effects obey saved gain, avoid overlap and stop at zero',async()=>{
 let now=1000;const clips=[];
 const audio=createAudio(src=>{const c={src,paused:true,plays:0,currentTime:0,play(){this.paused=false;this.plays++;return Promise.resolve();},pause(){this.paused=true;}};clips.push(c);return c;},()=>now);
 audio.configure({music:true,sound:true,soundVolume:.35});await audio.unlock();await Promise.resolve();
 await audio.effect('match');const match=clips.find(c=>c.src.includes('match'));
 assert.ok(match.volume<=.07);const count=match.plays;await audio.effect('match');assert.equal(match.plays,count);
 now+=300;await audio.effect('win');assert.equal(match.paused,true);
 audio.configure({soundVolume:0});now+=300;await audio.effect('match');assert.equal(match.paused,true);
});

test('instruction switches to the remaining dish after all plates are cleared',()=>{
 assert.equal(typeof book.goalHint,'function');
 const g={...newGame(6),plates:[]};
 assert.match(book.goalHint(g),/блюда/);assert.doesNotMatch(book.goalHint(g),/тарел/);
 g.collected[4]=g.goals.find(x=>x.kind==='food').amount;assert.match(book.goalHint(g),/готово/);
});
