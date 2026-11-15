import {seededRandom} from './random.js';
import {levelRecipe} from './recipes.js';
import {BASE_POOL,FOODS} from './foods.js';
export const COLS=7, ROWS=8, TYPES=5;
export function adjacent(a,b){return Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<56&&b<56&&(Math.abs(a-b)===7||(Math.floor(a/7)===Math.floor(b/7)&&Math.abs(a-b)===1));}
export function matches(board){
 const found=new Set();
 for(let r=0;r<8;r++)for(let c=0;c<7;c++){
  const i=r*7+c,type=board[i];if(type===null||type===undefined)continue;
  if(c<=4&&type===board[i+1]&&type===board[i+2])for(let k=c;k<7&&board[r*7+k]===type;k++)found.add(r*7+k);
  if(r<=5&&type===board[i+7]&&type===board[i+14])for(let k=r;k<8&&board[k*7+c]===type;k++)found.add(k*7+c);
 }return [...found];
}
export function legalMoves(board){
 const result=[];
 for(let a=0;a<56;a++)for(const b of [a+1,a+7])if(adjacent(a,b)&&board[a]!==board[b]){
  const copy=board.slice();[copy[a],copy[b]]=[copy[b],copy[a]];if(matches(copy).length)result.push([a,b]);
 }return result;
}
const randomType=(random,pool=BASE_POOL)=>pool[Math.floor(random()*pool.length)];
export function freshBoard(random=Math.random,pool=BASE_POOL){
 for(let attempt=0;attempt<100;attempt++){
  const b=[];
  for(let i=0;i<56;i++){
   const choices=pool.filter(t=>!(i%7>1&&b[i-1]===t&&b[i-2]===t)&&!(i>=14&&b[i-7]===t&&b[i-14]===t));
   b.push(choices[Math.floor(random()*choices.length)]);
  }
  if(legalMoves(b).length)return b;
 }
 const b=Array.from({length:56},(_,i)=>pool[(i%7+Math.floor(i/7)*2)%5]);
 b[0]=pool[0];b[1]=pool[1];b[2]=pool[0];b[8]=pool[0];return b;
}
export function newGame(level=1,options={}){return createGame(levelRecipe(level),{...options,level});}
export function createGame(recipe,{seed=Math.floor(Math.random()*4294967296),level=1,mode='regular',dailyDate,order}={}){
 const pool=[...(recipe.pool??BASE_POOL)];
 if(pool.length!==5||new Set(pool).size!==5||!pool.every(t=>Number.isInteger(t)&&t>=0&&t<FOODS.length))throw Error('Invalid food pool');
 if(recipe.goals.some(g=>g.kind==='food'&&!pool.includes(g.type)))throw Error('Goal is outside active food pool');
 const game={level,pool,moves:mode==='relaxed'?null:recipe.moves??24,score:0,status:'playing',goals:recipe.goals.map(g=>({...g})),plates:[...(recipe.plates??[])],collected:Array(FOODS.length).fill(0),boosters:{rolling:1,kettle:1},stalled:0,actions:0};
 if(mode==='relaxed'){game.mode=mode;game.order=order??1;}
 if(dailyDate)game.dailyDate=dailyDate;
 const random=seededRandom(seed);
 // Check each possible first helper with its actual saved refill stream.
 // During play all cascades remain natural; only unsafe starts are discarded.
 for(let attempt=0;attempt<48;attempt++){
  const candidate={...game,board:freshBoard(random,pool),rng:random.state};
  if(!openingHelperWin(candidate))return candidate;
 }
 // A bounded independent reserve is checked with the same complete rule.
 const reserve=seededRandom(74921);
 for(let attempt=0;attempt<256;attempt++){
  const candidate={...game,board:freshBoard(reserve,pool),rng:reserve.state};
  if(!openingHelperWin(candidate))return candidate;
 }
 throw Error('No safe opening for these goals');
}
export function openingHelperWin(game){
 for(const kind of ['rolling','kettle'])for(let i=0;i<56;i+=kind==='rolling'?7:1)if(useBooster(game,kind,i).game.status==='won')return true;
 return false;
}
export function goalComplete(g){return g.goals.every(x=>x.kind==='plates'?g.plates.length===0:g.collected[x.type]>=x.amount);}
export const isActiveGame=g=>!!g&&['playing','helpers'].includes(g.status);
export function gameStatus(g){
 if(goalComplete(g))return 'won';
 if(g.gaveUp)return 'lost';
 if(g.moves!==0)return 'playing';
 return g.boosters.rolling+g.boosters.kettle>0?'helpers':'lost';
}
export function finishAttempt(g){return g.status==='helpers'?{...g,status:'lost',gaveUp:true}:g;}
export function objectiveProgress(g){return g.goals.reduce((n,x)=>n+(x.kind==='plates'?x.amount-g.plates.length:Math.min(g.collected[x.type],x.amount)),0);}
export function boosterArea(kind,index){
 if(!Number.isInteger(index)||index<0||index>=56)return [];
 const row=Math.floor(index/7),col=index%7;
 if(kind==='rolling')return Array.from({length:7},(_,c)=>row*7+c);
 if(kind!=='kettle')return [];
 const cells=[];for(let r=Math.max(0,row-1);r<=Math.min(7,row+1);r++)for(let c=Math.max(0,col-1);c<=Math.min(6,col+1);c++)cells.push(r*7+c);return cells;
}
export function earnedBoosters(board,removed){
 const set=new Set(removed),horizontal=new Set(),vertical=new Set();let rolling=0;
 for(const i of removed)for(const step of [1,7]){
  const prev=i-step;if(adjacent(prev,i)&&set.has(prev)&&board[prev]===board[i])continue;
  const run=[i];let j=i+step;
  while(adjacent(j-step,j)&&set.has(j)&&board[j]===board[i]){run.push(j);j+=step;}
  if(run.length>=3)run.forEach(k=>(step===1?horizontal:vertical).add(k));
  if(run.length>=4)rolling=1;
 }
 return {rolling,kettle:[...horizontal].some(i=>vertical.has(i))?1:0};
}
function settle(game,board,removed,moves,boosters,reward){
 const next={...game,board,moves,collected:[...game.collected],boosters:{...boosters}};
 const random=seededRandom(game.rng);
 const frames=[],awarded={rolling:0,kettle:0},earnedCharges={rolling:0,kettle:0};let multiplier=1,shuffled=false;
 while(removed.length&&multiplier<=100){
  const before=board.slice(),platesBefore=[...(next.plates??[])];next.score+=removed.length*10*multiplier;
  if(reward){const earned=earnedBoosters(before,removed);for(const k of ['rolling','kettle']){const charge=Math.max(0,earned[k]-awarded[k]),old=next.boosters[k];next.boosters[k]=Math.min(3,old+charge);earnedCharges[k]+=next.boosters[k]-old;awarded[k]=Math.max(awarded[k],earned[k]);}}
  if(next.plates)next.plates=next.plates.filter(i=>!removed.includes(i));
  removed.forEach(i=>{next.collected[board[i]]++;board[i]=null;});
  for(let c=0;c<7;c++){
   const survivors=[];for(let r=7;r>=0;r--)if(board[r*7+c]!==null)survivors.push(board[r*7+c]);
   for(let r=7;r>=0;r--)board[r*7+c]=survivors[7-r]??randomType(random,game.pool);
  }
  frames.push({before,after:board.slice(),removed,multiplier,platesBefore,platesAfter:[...(next.plates??[])],collected:[...next.collected]});multiplier++;removed=matches(board);
 }
 if(removed.length||!legalMoves(board).length){next.board=freshBoard(random,game.pool);shuffled=true;}
 next.rng=random.state;
 next.actions=game.actions+1;next.stalled=objectiveProgress(next)>objectiveProgress(game)?0:game.stalled+1;
 next.status=gameStatus(next);
 return {game:next,valid:true,frames,shuffled,earned:earnedCharges};
}
const invalid=game=>({game,valid:false,frames:[],shuffled:false});
export function play(game,a,b){
 if(game.status!=='playing'||(game.mode!=='relaxed'&&game.moves<=0)||!adjacent(a,b))return invalid(game);
 const board=game.board.slice();[board[a],board[b]]=[board[b],board[a]];
 const removed=matches(board);if(!removed.length)return invalid(game);
 return settle(game,board,removed,game.mode==='relaxed'?null:game.moves-1,game.boosters,true);
}
export function useBooster(game,kind,index){
 const area=boosterArea(kind,index),boosters={...game.boosters};
 if(!isActiveGame(game)||!area.length||!boosters[kind])return invalid(game);
 boosters[kind]--;return settle(game,game.board.slice(),area,game.moves,boosters,false);
}
