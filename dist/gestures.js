import {adjacent} from './engine.js';
// Direction locks only after a clear axis emerges; a long diagonal is not a tap.
export function swipeIntent(index,dx,dy,cellSize,lockedAxis=null){
 const threshold=Math.max(10,Math.min(22,cellSize*.24));
 let axis=lockedAxis;
 if(!axis&&Math.max(Math.abs(dx),Math.abs(dy))>=threshold){
  if(Math.abs(dx)>Math.abs(dy)*1.25)axis='x';
  else if(Math.abs(dy)>Math.abs(dx)*1.25)axis='y';
 }
 const distance=axis==='x'?dx:axis==='y'?dy:0;
 const candidate=index+(axis==='x'?(distance>0?1:-1):(distance>0?7:-7));
 const target=axis&&Math.abs(distance)>=threshold&&adjacent(index,candidate)?candidate:null;
 return {axis,target,offset:axis?Math.max(-cellSize*.55,Math.min(cellSize*.55,distance)):0};
}
