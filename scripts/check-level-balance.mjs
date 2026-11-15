import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {newGame,openingHelperWin,isActiveGame,legalMoves,play,useBooster,boosterArea} from '../dist/engine.js';
import {hintAction} from '../dist/hints.js';
import {newDailyGame} from '../dist/daily.js';
import {seededRandom} from '../dist/random.js';
const samples=Number(process.env.BALANCE_SAMPLES??50);
const levels=[...Array.from({length:42},(_,i)=>i+1),54,66,78,90,102,114,126,138,150,200,500,10000];
const draws=Array(10).fill(0),drawSlots=Array(5).fill(0),timings=[],policies=['random','goals','assisted'];
let starts=0,actions=0,maxActions=0;
function run(initial,policy,seed){
 let g=structuredClone(initial),turns=0,helpers=0;const random=seededRandom(seed);
 while(isActiveGame(g)){
  if(g.status==='helpers'&&policy!=='assisted')break;
  let action=hintAction(policy==='goals'?{...g,stalled:0}:g);
  if(policy==='random'){const moves=legalMoves(g.board);action={kind:'swap',move:moves[Math.floor(random()*moves.length)]};}
  assert.ok(action);const result=action.kind==='swap'?play(g,...action.move):useBooster(g,action.helper,action.index);
  assert.ok(result.valid);if(action.kind==='helper')helpers++;
  for(const frame of result.frames){for(let c=0;c<7;c++){const count=frame.removed.filter(i=>i%7===c).length;for(let r=0;r<count;r++){const type=frame.after[r*7+c];draws[type]++;drawSlots[g.pool.indexOf(type)]++;}}}
  g=result.game;turns++;actions++;assert.ok(turns<110,'A game must terminate');
 }
 maxActions=Math.max(maxActions,turns);return {won:g.status==='won',movesLeft:g.moves,helpers,turns};
}
const results=[];
for(const level of levels){
 const stats=Object.fromEntries(policies.map(p=>[p,{wins:0,movesLeft:0,helpers:0,turns:0}]));
 for(let seed=1;seed<=samples;seed++){
  const t=performance.now(),g=newGame(level,{seed:seed*7919});timings.push(performance.now()-t);starts++;
  assert.equal(openingHelperWin(g),false,`Opening helper wins level ${level}`);
  for(let i=0;i<56;i++){const direct=g.plates.filter(n=>boosterArea('kettle',i).includes(n)).length;assert.ok(direct<=g.plates.length/2);}
  for(const p of policies){const r=run(g,p,seed*17);stats[p].wins+=Number(r.won);stats[p].movesLeft+=r.movesLeft;stats[p].helpers+=r.helpers;stats[p].turns+=r.turns;}
 }
 results.push({level,samples,...Object.fromEntries(policies.map(p=>[p,{winRate:stats[p].wins/samples,meanMovesLeft:stats[p].movesLeft/samples,meanHelpers:stats[p].helpers/samples,meanActions:stats[p].turns/samples}]))});
 if(level%6===0||level>42)console.log(JSON.stringify(results.at(-1)));
}
const daily=[];
for(let i=0;i<365;i++){
 const day=new Date(Date.UTC(2026,0,1+i)).toISOString().slice(0,10),g=newDailyGame(day);assert.equal(openingHelperWin(g),false,day);starts++;
 daily.push({day,...run(g,'assisted',i+1)});
}
timings.sort((a,b)=>a-b);
const report={samples,policies,starts,helperAreasChecked:starts*64,games:levels.length*samples*policies.length+daily.length,actions,maxActions,generationMs:{median:timings[Math.floor(timings.length*.5)],p95:timings[Math.floor(timings.length*.95)],max:timings.at(-1)},draws,drawSlots,results,daily:{games:daily.length,wins:daily.filter(x=>x.won).length,losses:daily.filter(x=>!x.won).map(x=>x.day),meanActions:daily.reduce((n,x)=>n+x.turns,0)/daily.length}};
await writeFile(new URL('../docs/balance-validation.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({summary:{...report,results:undefined,draws:undefined}},null,2));
