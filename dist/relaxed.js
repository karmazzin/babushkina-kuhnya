import {createGame} from './engine.js';
import {foodPool} from './foods.js';
import {PLATE_LAYOUTS} from './recipes.js';
export function newRelaxedGame(order=1,options={}){
 const pool=foodPool(order),type=pool[(order-1)%5],other=pool[order%5],variant=(order-1)%4;
 const plates=variant===2?PLATE_LAYOUTS.tea:variant===3?PLATE_LAYOUTS.pairs:[];
 const goals=variant===0?[{kind:'food',type,amount:12}]:variant===1?[{kind:'food',type,amount:8},{kind:'food',type:other,amount:8}]:variant===2?[{kind:'plates',amount:6}]:[{kind:'plates',amount:4},{kind:'food',type,amount:8}];
 return createGame({pool,plates,goals},{...options,mode:'relaxed',order});
}
