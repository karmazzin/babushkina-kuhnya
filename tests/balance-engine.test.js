import test from 'node:test';
import assert from 'node:assert/strict';
import * as engine from '../dist/engine.js';
import * as pacing from '../dist/pacing.js';

const board=[1,2,0,1,1,3,1,1,0,3,3,4,3,4,0,4,2,0,0,4,2,3,4,0,2,3,3,4,0,0,3,0,4,4,3,0,4,1,2,2,1,2,2,1,1,0,4,3,4,0,3,4,0,2,2,0];
const state=(extra={})=>({level:1,board:board.slice(),moves:24,score:0,status:'playing',goals:[{kind:'food',type:2,amount:12}],plates:[],collected:Array(10).fill(0),boosters:{rolling:1,kettle:1},rng:7,pool:[0,1,2,3,4],actions:0,stalled:0,...extra});

test('hint collects the requested dish instead of the first top-row match',()=>{
 assert.equal(typeof pacing.hintAction,'function');
 const g=state(),before=structuredClone(g);const h=pacing.hintAction(g);
 assert.deepEqual(h.move,[40,41]);assert.equal(h.kind,'swap');assert.deepEqual(g,before);
});
test('hint reaches a bottom plate and does not inspect future random numbers',()=>{
 assert.equal(typeof pacing.hintAction,'function');
 const g=state({goals:[{kind:'plates',amount:1}],plates:[52]});
 Object.defineProperty(g,'rng',{get(){throw Error('hint looked into future');}});
 assert.deepEqual(pacing.hintAction(g).move,[31,38]);
});
test('hint caps dish credit at the actual remaining amount',()=>{
 assert.equal(typeof pacing.hintAction,'function');
 const g=state({goals:[{kind:'food',type:0,amount:10},{kind:'food',type:2,amount:3}],collected:[9,0,0,0,0]});
 assert.deepEqual(pacing.hintAction(g).move,[40,41]);
});
test('helper hint is offered after stagnation without consuming a charge',()=>{
 assert.equal(typeof pacing.hintAction,'function');
 const g=state({stalled:3,goals:[{kind:'plates',amount:2}],plates:[50,51]});
 const h=pacing.hintAction(g);assert.equal(h.kind,'helper');assert.ok(engine.boosterArea(h.helper,h.index).includes(50));assert.deepEqual(g.boosters,{rolling:1,kettle:1});
});
test('campaign seed repeats initial board and subsequent refill',()=>{
 const a=engine.newGame(5,{seed:1991}),b=engine.newGame(5,{seed:1991});
 assert.ok(Number.isInteger(a.rng));assert.deepEqual(a,b);
 const move=engine.legalMoves(a.board)[0];assert.deepEqual(engine.play(a,...move),engine.play(b,...move));
});
test('new plate game cannot win from any single initial helper, including cascades',()=>{
 for(let seed=1;seed<=12;seed++){const g=engine.newGame(4,{seed});
  for(const kind of ['rolling','kettle'])for(let i=0;i<56;i++)assert.notEqual(engine.useBooster(g,kind,i).game.status,'won',`${seed} ${kind} ${i}`);
 }
});
test('last ordinary move leaves new rules in the helper phase',()=>{
 const g=state({rng:7,moves:1,goals:[{kind:'food',type:2,amount:1000}]});
 const r=engine.play(g,5,6);assert.equal(r.game.moves,0);assert.equal(r.game.status,'helpers');assert.equal(engine.play(r.game,40,41).valid,false);
});
test('zero-move helper can complete the goal and otherwise exhausts into loss',()=>{
 const g=state({rng:7,moves:0,status:'helpers',goals:[{kind:'plates',amount:1}],plates:[52],boosters:{rolling:0,kettle:1}});
 const r=engine.useBooster(g,'kettle',52);assert.equal(r.valid,true);assert.equal(r.game.status,'won');assert.equal(r.game.moves,0);
 const loss=engine.useBooster({...g,plates:[],goals:[{kind:'food',type:2,amount:1000}]},'kettle',52);assert.equal(loss.game.status,'lost');
});
test('voluntary finish is explicit and leaves an already won game unchanged',()=>{
 assert.equal(typeof engine.finishAttempt,'function');
 const g=state({moves:0,status:'helpers'}),r=engine.finishAttempt(g);
 assert.equal(r.status,'lost');assert.equal(g.status,'helpers');assert.equal(engine.finishAttempt({...g,status:'won'}).status,'won');
});
test('refill stays inside the five saved active dish types',()=>{
 assert.equal(typeof engine.createGame,'function');
 const g=engine.createGame({goals:[{kind:'food',type:5,amount:24}],plates:[],moves:24,pool:[5,6,7,8,9]},{seed:123});
 assert.ok(g.board.every(t=>t>=5&&t<=9));
 const r=engine.useBooster(g,'kettle',24).game;assert.ok(r.board.every(t=>t>=5&&t<=9));assert.equal(r.collected.length,10);
});
