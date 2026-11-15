import {newGame,legalMoves,matches,play,useBooster,boosterArea} from '../dist/engine.js';
let seed=14932;Math.random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
function value(g,indices){let n=0;for(const i of indices){n+=1;if(g.plates?.includes(i))n+=12;for(const goal of g.goals??[])if(goal.kind==='food'&&g.board[i]===goal.type&&g.collected[goal.type]<goal.amount)n+=4;}return n;}
for(let level=1;level<=12;level++){
 let wins=0,turns=0;
 for(let run=0;run<100;run++){
  let g=newGame(level),actions=0;
  while(g.status==='playing'&&actions++<60){
   let choice=null,score=-1;
   for(const [a,b] of legalMoves(g.board)){const board=g.board.slice();[board[a],board[b]]=[board[b],board[a]];const s=value({...g,board},matches(board));if(s>score){score=s;choice=[a,b];}}
   if(g.moves<=8){let helper=null,best=0;for(const kind of ['rolling','kettle'])if(g.boosters[kind])for(let i=0;i<56;i++){const s=value(g,boosterArea(kind,i));if(s>best){best=s;helper=[kind,i];}}
    if(helper&&best>score){g=useBooster(g,...helper).game;continue;}}
   if(!choice)throw Error('no moves');g=play(g,...choice).game;
  }
  if(g.status==='won')wins++;turns+=24-g.moves;
 }
 console.log(JSON.stringify({level,wins: `${wins}/100`,meanMoves:Math.round(turns/100*10)/10}));
}
