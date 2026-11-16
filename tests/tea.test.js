import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,play,useBooster,matches,legalMoves,freshBoard,openingHelperWin} from '../dist/engine.js';
import {seededRandom} from '../dist/random.js';
import {KEY,defaultProgress,loadProgress,saveProgress} from '../dist/storage.js';
import {hintAction} from '../dist/hints.js';
import {goalMarkup,goalText,goalHint,resultGoalText} from '../dist/book.js';

const TEA=-1;
const cups=b=>b.flatMap((t,i)=>t===TEA?[i]:[]);
const latin=()=>Array.from({length:56},(_,i)=>(Math.floor(i/7)*2+i%7)%5);
function game(board,amount=1){return {...newGame(1,{seed:73}),board,goals:[{kind:'tea',amount}],servedTea:0};}
function landing(){const b=latin();b[42]=TEA;b[49]=1;b[50]=1;b[51]=2;b[44]=1;return game(b);}

test('tea never forms a match, even with three adjacent cups',()=>{
 const b=latin();b[15]=b[16]=b[17]=TEA;assert.deepEqual(matches(b),[]);
});
test('a cup swaps with an adjacent dish when that dish completes an ordinary match',()=>{
 const b=latin();b[17]=TEA;b[18]=b[10]=b[24]=1;assert.deepEqual(matches(b),[]);
 const g=game(b),r=play(g,17,18);assert.equal(r.valid,true);assert.equal(r.game.moves,23);
 assert.equal(r.frames[0].before[18],TEA);assert.ok([10,17,24].every(i=>r.frames[0].removed.includes(i)));
 assert.equal(cups(r.game.board).length+r.game.servedTea,1);assert.equal(g.board[17],TEA);
});
test('moving a cup without a food combination preserves the move and board',()=>{
 const b=latin();b[10]=TEA;const g=game(b),r=play(g,10,11);
 assert.equal(r.valid,false);assert.equal(r.game,g);assert.equal(g.moves,24);
});
test('a cup is served in the same turn that clearing beneath it reaches row eight',()=>{
 const g=landing();assert.deepEqual(matches(g.board),[]);const r=play(g,44,51);
 assert.equal(r.valid,true);assert.equal(r.game.servedTea,1);assert.equal(r.game.status,'won');
 assert.equal(r.game.moves,23);assert.deepEqual(cups(r.game.board),[]);
 const served=r.frames.filter(f=>f.kind==='tea');assert.equal(served.length,1);assert.deepEqual(served[0].removed,[49]);
 assert.equal(served[0].before[49],TEA);assert.equal(served[0].servedTea,1);
 assert.ok(r.game.collected.every(Number.isFinite));assert.equal(r.game.collected.length,10);
});
test('a valid swap directly into the bottom row also serves the cup exactly once',()=>{
 const b=latin();b[42]=TEA;b[49]=b[28]=b[35]=1;b[21]=3;
 assert.deepEqual(matches(b),[]);const r=play(game(b),42,49);
 assert.equal(r.valid,true);assert.equal(r.game.servedTea,1);assert.equal(r.game.status,'won');
 assert.equal(r.frames.filter(f=>f.kind==='tea').flatMap(f=>f.removed).length,1);
});
for(const kind of ['rolling','kettle'])test(`${kind} passes through a cup without removing it or its underlying plate`,()=>{
 const b=latin();b[24]=TEA;const g=game(b);g.plates=[24];g.goals.push({kind:'plates',amount:1});
 const r=useBooster(g,kind,24);assert.equal(r.valid,true);assert.equal(r.game.moves,24);
 assert.ok(!r.frames[0].removed.includes(24));assert.ok(r.frames[0].platesAfter.includes(24));
 assert.equal(cups(r.game.board).length+r.game.servedTea,1);assert.ok(r.game.collected.every(Number.isFinite));
 assert.deepEqual(r.earned,{rolling:0,kettle:0});
});
test('two cups stacked in a column are served without another move or duplicate credit',()=>{
 const b=latin();b[35]=b[42]=TEA;const r=useBooster(game(b,2),'rolling',49);
 assert.equal(r.game.servedTea,2);assert.deepEqual(cups(r.game.board),[]);assert.equal(r.game.status,'won');
 assert.equal(r.game.moves,24);assert.equal(r.frames.filter(f=>f.kind==='tea').flatMap(f=>f.removed).length,2);
});
test('serving tea does not bypass an unfinished second goal',()=>{
 const g=landing();g.goals.push({kind:'food',type:4,amount:100});const r=play(g,44,51);
 assert.equal(r.game.servedTea,1);assert.equal(r.game.status,'playing');
});
test('a finishing helper serves tea with zero regular moves',()=>{
 const b=latin();b[42]=TEA;const g={...game(b),moves:0,status:'helpers'};
 const r=useBooster(g,'rolling',49);assert.equal(r.game.servedTea,1);assert.equal(r.game.status,'won');assert.equal(r.game.moves,0);
});
test('reshuffling keeps cups at their current cells and produces legal food moves',()=>{
 for(let seed=1;seed<=20;seed++){
  const b=freshBoard(seededRandom(seed),[0,1,2,3,4],[16,42]);assert.deepEqual(cups(b),[16,42]);
  assert.deepEqual(matches(b),[]);assert.ok(legalMoves(b).length>0);
 }
});
test('authored tea levels begin with fixed cups and no immediate helper win',()=>{
 for(const [level,amount] of [[10,1],[16,2],[22,1],[28,2],[34,2],[40,2],[46,2],[10000,2]]){
  for(let seed=1;seed<=3;seed++){
   const g=newGame(level,{seed});assert.equal(g.goals.find(x=>x.kind==='tea')?.amount,amount,`level ${level}`);
   assert.equal(cups(g.board).length,amount);assert.ok(cups(g.board).every(i=>i<21));assert.equal(g.servedTea,0);
   assert.equal(g.pool.length,5);assert.ok(g.goals.length<=2);assert.equal(openingHelperWin(g),false);
  }
 }
});
test('current saves roundtrip partially delivered tea and remaining helper phase',()=>{
 const p=defaultProgress(),g=newGame(16,{seed:103});const positions=cups(g.board);assert.equal(positions.length,2);
 g.board[positions[0]]=0;g.servedTea=1;g.moves=0;g.status='helpers';p.game=g;p.unlocked=16;p.seenTea=true;
 const saved=new Map(),store={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)};
 assert.equal(saveProgress(store,p),true);const loaded=loadProgress(store);assert.equal(loaded.warning,null);assert.deepEqual(loaded.data,p);
});
test('current save rejects missing cups, extra delivered tea and unserved bottom-row cups',()=>{
 for(const corrupt of [
  g=>{g.board[g.board.indexOf(TEA)]=0;},
  g=>{g.servedTea=2;},
  g=>{const i=g.board.indexOf(TEA);[g.board[i],g.board[49]]=[g.board[49],g.board[i]];}
 ]){
  const p=defaultProgress();p.game=newGame(10,{seed:103});p.unlocked=10;corrupt(p.game);
  assert.ok(loadProgress({getItem:k=>k===KEY?JSON.stringify(p):null}).warning);
 }
});

test('hint clears three cells below the cup instead of making an unrelated match',()=>{
 const g=game([1,2,0,3,3,0,1,2,2,3,-1,3,0,2,3,1,2,0,1,4,2,4,3,3,1,1,0,0,0,0,2,2,0,1,2,3,2,1,4,3,4,3,4,3,4,1,0,4,4,4,1,2,4,0,0,3]);
 Object.defineProperty(g,'rng',{get(){throw Error('Hint read future draws');}});
 assert.deepEqual(hintAction(g),{kind:'swap',move:[44,45]});
 g.goals.push({kind:'food',type:0,amount:1});g.collected[0]=1;
 assert.deepEqual(hintAction(g),{kind:'swap',move:[44,45]});
});
test('tea helper hint finishes a visible path at zero moves without erasing cups',()=>{
 const g={...landing(),moves:0,status:'helpers'};const action=hintAction(g);
 assert.equal(action.kind,'helper');const next=useBooster(g,action.helper,action.index).game;
 assert.equal(next.servedTea,1);assert.equal(next.status,'won');
});
test('goal copy and counters distinguish served tea from collected dishes',()=>{
 const g=landing();assert.match(goalText(g),/Чай: 1/);assert.match(goalMarkup(g),/Чай: 0 из 1/);
 assert.match(goalHint(g),/чашк.*нижн/i);assert.match(resultGoalText(g),/Чай: подано 0 из 1/);
 const won=play(g,44,51).game;assert.match(goalMarkup(won),/Чай: 1 из 1/);assert.match(resultGoalText(won),/Чай: подано 1 из 1/);
});
