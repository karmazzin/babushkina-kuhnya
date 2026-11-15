import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,play,boosterArea} from '../dist/engine.js';

test('a multi-cascade move earns at most one of each helper on new games',()=>{
 const g={...newGame(8),rng:0,boosters:{rolling:0,kettle:0},board:[4,4,1,1,4,0,1,1,2,2,3,4,2,3,0,3,2,2,1,1,3,0,3,0,1,0,1,0,3,1,2,2,4,0,0,0,4,0,3,3,1,1,0,4,0,0,4,3,3,2,2,4,3,1,4,3]};
 const r=play(g,25,32);assert.equal(r.valid,true);assert.deepEqual(r.game.boosters,{rolling:1,kettle:1});
});
test('chapter finale requires spatial planning and later chapters do not reset to tiny goals',()=>{
 const intro=newGame(1),finale=newGame(18),later=newGame(19),late=newGame(200);
 assert.equal(intro.moves,24);assert.ok(finale.moves<intro.moves&&finale.moves>=20);
 assert.ok(finale.goals.find(g=>g.kind==='food').amount>=24);
 const area=new Set(boosterArea('kettle',24));assert.ok(finale.plates.some(i=>!area.has(i)));
 assert.ok(later.goals.find(g=>g.kind==='food').amount>=18);
 assert.ok(late.goals.every(g=>g.kind!=='food'||g.amount<=34));
});
