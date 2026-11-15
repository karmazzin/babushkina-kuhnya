import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, matches, legalMoves, play, adjacent } from '../dist/engine.js';
const pattern = () => Array.from({length:56},(_,i)=>(i%7+Math.floor(i/7)*2)%5);
test('fresh 7 by 8 boards have no matches and at least one move',()=>{
 for(let n=0;n<100;n++){const g=newGame(1);assert.equal(g.board.length,56);assert.equal(matches(g.board).length,0);assert.ok(legalMoves(g.board).length);assert.equal(g.moves,24);assert.equal(g.target,1000);}
});
test('finds horizontal, vertical and intersecting matches without duplicates',()=>{
 let b=pattern();[8,9,10,2,16].forEach(i=>b[i]=4);assert.deepEqual(matches(b).sort((a,b)=>a-b),[2,8,9,10,16]);
});
test('row ends do not wrap and invalid inputs are rejected',()=>{assert.equal(adjacent(6,7),false);assert.equal(adjacent(-1,0),false);assert.equal(adjacent(0,7),true);assert.equal(adjacent(1,2),true);});
test('invalid swap leaves board, score and moves untouched',()=>{
 const g={...newGame(1),board:pattern()};const copy=structuredClone(g);const r=play(g,0,1);assert.equal(r.valid,false);assert.deepEqual(g,copy);assert.deepEqual(r.game,g);
});
test('legal turn settles all cascades, scores and uses one move without mutating input',()=>{
 for(let n=0;n<60;n++){const g=newGame(1), copy=structuredClone(g), [a,b]=legalMoves(g.board)[0];const r=play(g,a,b);assert.equal(r.valid,true);assert.equal(r.game.moves,23);assert.ok(r.game.score>=30);assert.equal(matches(r.game.board).length,0);assert.ok(legalMoves(r.game.board).length);assert.deepEqual(g,copy);assert.equal(r.game.score,r.frames.reduce((s,f)=>s+f.removed.length*10*f.multiplier,0));}
});
test('win is evaluated before loss on last move and completed games cannot change',()=>{
 const g={...newGame(1),moves:1,target:10};let r=play(g,...legalMoves(g.board)[0]);assert.equal(r.game.status,'won');assert.equal(play(r.game,0,1).valid,false);
 const h={...newGame(2),goals:[{kind:'score'}],moves:1,target:999999};r=play(h,...legalMoves(h.board)[0]);assert.equal(r.game.status,'lost');assert.ok(newGame(2).target>newGame(1).target);
});
