import {legalMoves,matches,earnedBoosters,boosterArea,isActiveGame} from './engine.js';

function merit(game,board,cells){
 const counts=new Map();for(const i of cells)counts.set(board[i],(counts.get(board[i])??0)+1);
 let progress=0,complete=true;
 for(const goal of game.goals??[{kind:'score'}]){
  if(goal.kind==='plates'){const remaining=game.plates??[],hit=remaining.filter(i=>cells.includes(i)).length;progress+=hit*4;if(hit<remaining.length)complete=false;}
  else if(goal.kind==='food'){const remaining=Math.max(0,goal.amount-(game.collected?.[goal.type]??0)),hit=Math.min(remaining,counts.get(goal.type)??0);progress+=hit;if(hit<remaining)complete=false;}
  else {progress+=cells.length;if(game.score+cells.length*10<game.target)complete=false;}
 }
 return {progress,complete};
}
function compare(a,b){for(let i=0;i<a.rank.length;i++){if(a.rank[i]!==b.rank[i])return a.rank[i]-b.rank[i];}return 0;}
export function hintAction(game){
 if(!isActiveGame(game))return null;
 let best=null;
 if(game.status==='playing')for(const move of legalMoves(game.board)){
  const board=game.board.slice();[board[move[0]],board[move[1]]]=[board[move[1]],board[move[0]]];
  const cells=matches(board),m=merit(game,board,cells),earned=earnedBoosters(board,cells);
  const charges=['rolling','kettle'].reduce((n,k)=>n+(earned[k]&&((game.boosters?.[k]??1)<3)?1:0),0);
  const action={kind:'swap',move,rank:[Number(m.complete),Number(m.progress>0),m.progress,charges,cells.length,Math.max(...cells)]};
  if(!best||compare(action,best)>0)best=action;
 }
 if(game.status==='helpers'||(game.stalled??0)>=3){
  let helper=null;
  for(const kind of ['rolling','kettle'])if(game.boosters?.[kind])for(let index=0;index<56;index+=kind==='rolling'?7:1){
   const cells=boosterArea(kind,index),m=merit(game,game.board,cells);
   const action={kind:'helper',helper:kind,index,rank:[Number(m.complete),Number(m.progress>0),m.progress,0,cells.length,index]};
   if(!helper||compare(action,helper)>0)helper=action;
  }
  if(helper&&(!best||(helper.rank[2]>0&&compare(helper,best)>0)))best=helper;
 }
 if(!best)return null;
 const {rank,...action}=best;return action;
}
