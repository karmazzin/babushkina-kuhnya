import {levelRecipe} from './recipes.js';
export const COLS=7, ROWS=8, TYPES=5;
export function adjacent(a,b){return Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<56&&b<56&&(Math.abs(a-b)===7||(Math.floor(a/7)===Math.floor(b/7)&&Math.abs(a-b)===1));}
export function matches(board){
 const found=new Set();
 for(let r=0;r<8;r++)for(let c=0;c<7;c++){
  const i=r*7+c, type=board[i];if(type===null||type===undefined)continue;
  if(c<=4&&type===board[i+1]&&type===board[i+2]){for(let k=c;k<7&&board[r*7+k]===type;k++)found.add(r*7+k);}
  if(r<=5&&type===board[i+7]&&type===board[i+14]){for(let k=r;k<8&&board[k*7+c]===type;k++)found.add(k*7+c);}
 }return [...found];
}
export function legalMoves(board){
 const result=[];
 for(let a=0;a<56;a++)for(const b of [a+1,a+7])if(adjacent(a,b)&&board[a]!==board[b]){
  const copy=board.slice();[copy[a],copy[b]]=[copy[b],copy[a]];if(matches(copy).length)result.push([a,b]);
 }return result;
}
function randomType(){return Math.floor(Math.random()*TYPES);}
export function freshBoard(){
 for(let attempt=0;attempt<100;attempt++){
  const b=[];
  for(let i=0;i<56;i++){
   const choices=[0,1,2,3,4].filter(t=>!(i%7>1&&b[i-1]===t&&b[i-2]===t)&&!(i>=14&&b[i-7]===t&&b[i-14]===t));
   b.push(choices[Math.floor(Math.random()*choices.length)]);
  }
  if(legalMoves(b).length)return b;
 }
 // Guaranteed match-free board with a legal swap at 1↔8.
 const b=Array.from({length:56},(_,i)=>(i%7+Math.floor(i/7)*2)%5);
 b[0]=0;b[1]=1;b[2]=0;b[8]=0;return b;
}
export function newGame(level=1){return {level,board:freshBoard(),moves:24,target:1000+Math.floor(((level-1)%18)/6)*120+((level-1)%6)*50+Math.min(Math.floor((level-1)/18),4)*75,score:0,status:'playing',goals:levelRecipe(level).goals,plates:levelRecipe(level).plates,collected:[0,0,0,0,0],boosters:{rolling:1,kettle:1}};}
export function goalComplete(g){return !g.goals?g.score>=g.target:g.goals.every(x=>x.kind==='score'?g.score>=g.target:x.kind==='plates'?Array.isArray(g.plates)&&g.plates.length===0:(g.collected?.[x.type]??0)>=x.amount);}
export function boosterArea(kind,index){
 if(!Number.isInteger(index)||index<0||index>=56)return [];
 const row=Math.floor(index/7),col=index%7;
 if(kind==='rolling')return Array.from({length:7},(_,c)=>row*7+c);
 if(kind!=='kettle')return [];
 const cells=[];for(let r=Math.max(0,row-1);r<=Math.min(7,row+1);r++)for(let c=Math.max(0,col-1);c<=Math.min(6,col+1);c++)cells.push(r*7+c);return cells;
}
export function earnedBoosters(board,removed){
 const set=new Set(removed),horizontal=new Set(),vertical=new Set();let rolling=0;
 for(const i of removed){
  for(const step of [1,7]){
   const prev=i-step;if(adjacent(prev,i)&&set.has(prev)&&board[prev]===board[i])continue;
   const run=[i];let j=i+step;
   while(adjacent(j-step,j)&&set.has(j)&&board[j]===board[i]){run.push(j);j+=step;}
   if(run.length>=3)run.forEach(k=>(step===1?horizontal:vertical).add(k));
   if(run.length>=4)rolling=1;
  }
 }
 return {rolling,kettle:[...horizontal].some(i=>vertical.has(i))?1:0};
}
function settle(game,board,removed,moves,boosters,reward){
 const next={...game,board,moves,collected:[...(game.collected??[0,0,0,0,0])],boosters:{...boosters}};
 const frames=[];let multiplier=1,shuffled=false;
 while(removed.length&&multiplier<=100){
  const before=board.slice(),platesBefore=[...(next.plates??[])];next.score+=removed.length*10*multiplier;
  if(reward){const earned=earnedBoosters(before,removed);for(const k of ['rolling','kettle'])next.boosters[k]=Math.min(3,next.boosters[k]+earned[k]);}
  if(next.plates)next.plates=next.plates.filter(i=>!removed.includes(i));
  removed.forEach(i=>{next.collected[board[i]]++;board[i]=null;});
  for(let c=0;c<7;c++){
   const survivors=[];for(let r=7;r>=0;r--)if(board[r*7+c]!==null)survivors.push(board[r*7+c]);
   for(let r=7;r>=0;r--)board[r*7+c]=survivors[7-r]??randomType();
  }
  frames.push({before,after:board.slice(),removed,multiplier,platesBefore,platesAfter:[...(next.plates??[])],collected:[...next.collected]});multiplier++;removed=matches(board);
 }
 if(removed.length||!legalMoves(board).length){next.board=freshBoard();shuffled=true;}
 next.status=goalComplete(next)?'won':next.moves===0?'lost':'playing';
 return {game:next,valid:true,frames,shuffled};
}
const invalid=game=>({game,valid:false,frames:[],shuffled:false});
export function play(game,a,b){
 if(game.status!=='playing'||game.moves<=0||!adjacent(a,b))return invalid(game);
 const board=game.board.slice();[board[a],board[b]]=[board[b],board[a]];
 const removed=matches(board);if(!removed.length)return invalid(game);
 return settle(game,board,removed,game.moves-1,game.boosters??{rolling:1,kettle:1},true);
}
export function useBooster(game,kind,index){
 const area=boosterArea(kind,index),boosters={...(game.boosters??{rolling:1,kettle:1})};
 if(game.status!=='playing'||game.moves<=0||!area.length||!boosters[kind])return invalid(game);
 boosters[kind]--;return settle(game,game.board.slice(),area,game.moves,boosters,false);
}
