import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {newGame,openingHelperWin,isActiveGame,legalMoves,matches,play,useBooster} from '../dist/engine.js';
import {TEA,teaCells,bottomTea} from '../dist/tea.js';
import {hintAction} from '../dist/hints.js';
import {seededRandom} from '../dist/random.js';

const samples=Number(process.env.TEA_SAMPLES??50),levels=[1,4,6,10,16,22,28,34,40,46,52,58,64,70,82,94,106,118,130,142,1000,10000];
const policies=['random','goals','assisted'],results=[],timings=[];let actions=0,starts=0,served=0,maxActions=0;
function run(initial,policy,seed){
 let g=structuredClone(initial),turns=0,helpers=0;const random=seededRandom(seed),target=g.goals.find(x=>x.kind==='tea')?.amount??0;
 while(isActiveGame(g)){
  if(g.status==='helpers'&&policy!=='assisted')break;
  const moves=policy==='random'?legalMoves(g.board):null;
  const action=moves?{kind:'swap',move:moves[Math.floor(random()*moves.length)]}:hintAction(policy==='goals'?{...g,stalled:0}:g);
  assert.ok(action);const r=action.kind==='swap'?play(g,...action.move):useBooster(g,action.helper,action.index);assert.equal(r.valid,true);
  if(action.kind==='helper'){helpers++;assert.deepEqual(r.earned,{rolling:0,kettle:0});}
  let foodCount=0,score=0,deliveries=0;
  for(const f of r.frames){
   if(f.kind==='tea'){assert.ok(f.removed.every(i=>i>=49&&f.before[i]===TEA));deliveries+=f.removed.length;}
   else{assert.ok(f.removed.every(i=>g.pool.includes(f.before[i])));foodCount+=f.removed.length;score+=f.removed.length*10*f.multiplier;}
   assert.equal(teaCells(f.after).length+f.servedTea,target);
  }
  assert.equal(r.game.servedTea-g.servedTea,deliveries);assert.equal(r.game.score-g.score,score);
  assert.equal(r.game.collected.reduce((a,b)=>a+b,0)-g.collected.reduce((a,b)=>a+b,0),foodCount);
  g=r.game;turns++;actions++;served+=deliveries;
  assert.equal(teaCells(g.board).length+g.servedTea,target);assert.equal(bottomTea(g.board).length,0);
  assert.equal(matches(g.board).length,0);assert.ok(legalMoves(g.board).length);assert.ok(g.board.every(t=>t===TEA||g.pool.includes(t)));
  assert.ok(turns<110,'Game must terminate');
 }
 maxActions=Math.max(maxActions,turns);return {won:g.status==='won',turns,helpers,movesLeft:g.moves};
}
for(const level of levels){
 const totals=Object.fromEntries(policies.map(p=>[p,{wins:0,actions:0,helpers:0,movesLeft:0}]));
 for(let seed=1;seed<=samples;seed++){
  const t=performance.now(),g=newGame(level,{seed:seed*7919});timings.push(performance.now()-t);starts++;
  assert.equal(openingHelperWin(g),false,`Opening helper: level ${level}, seed ${seed}`);
  for(const p of policies){const r=run(g,p,seed*17);totals[p].wins+=Number(r.won);totals[p].actions+=r.turns;totals[p].helpers+=r.helpers;totals[p].movesLeft+=r.movesLeft;}
 }
 const row={level,samples,...Object.fromEntries(policies.map(p=>[p,{winRate:totals[p].wins/samples,meanActions:totals[p].actions/samples,meanHelpers:totals[p].helpers/samples,meanMovesLeft:totals[p].movesLeft/samples}]))};results.push(row);console.log(JSON.stringify(row));
}
timings.sort((a,b)=>a-b);
const report={samples,starts,games:starts*policies.length,helperAreasChecked:starts*64,actions,served,maxActions,generationMs:{median:timings[Math.floor(timings.length*.5)],p95:timings[Math.floor(timings.length*.95)],max:timings.at(-1)},results};
await writeFile(new URL('../docs/tea-validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,results:undefined}));
