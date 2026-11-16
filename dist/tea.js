export const TEA=-1;
export const teaCells=board=>board.flatMap((type,i)=>type===TEA?[i]:[]);
export const bottomTea=board=>teaCells(board).filter(i=>i>=49);
export const teaProgress=game=>game.servedTea*8+teaCells(game.board).reduce((n,i)=>n+Math.floor(i/7),0);

// A null refill lets hints inspect only the visible pieces, without future draws.
export function fallBoard(board,removed,fill=()=>null){
 const gone=new Set(removed),after=board.slice();
 for(let c=0;c<7;c++){
  const survivors=[];
  for(let r=7;r>=0;r--){const i=r*7+c;if(!gone.has(i)&&board[i]!==null)survivors.push(board[i]);}
  for(let r=7;r>=0;r--)after[r*7+c]=survivors[7-r]??fill();
 }
 return after;
}
