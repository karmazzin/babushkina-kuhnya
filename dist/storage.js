import {validDay} from './daily.js';
import {matches,legalMoves,gameStatus} from './engine.js';
import {FOODS} from './foods.js';
import {recipeById,recipeMilestone,RECIPE_CARDS} from './recipe-cards.js';
export const KEY='babushkina-kuhnya:progress';
export const defaultProgress=()=>({unlocked:1,best:0,game:null,daily:{game:null,cards:[],art:[]},relaxed:{game:null,completed:0},recipes:{unlocked:[],milestones:[]},seenHelpers:[],completed:[],settings:{sound:true,music:true,reduced:false,soundVolume:.35}});
const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
function validGame(g){
 if(g===null)return true;
 if(!g||!integer(g.level,1)||!(g.mode==='relaxed'?g.moves===null:integer(g.moves,0,24))||!integer(g.score)||!['playing','helpers','won','lost'].includes(g.status))return false;
 if(g.mode!==undefined&&(g.mode!=='relaxed'||!integer(g.order,1)))return false;
 const pool=g.pool;
 if(!Array.isArray(pool)||pool.length!==5||new Set(pool).size!==5||!pool.every(t=>integer(t,0,FOODS.length-1)))return false;
 if(!integer(g.rng,0,4294967295)||!integer(g.actions)||!integer(g.stalled))return false;
 if(g.gaveUp!==undefined&&(g.gaveUp!==true||g.moves!==0))return false;
 if(!Array.isArray(g.board)||g.board.length!==56||!g.board.every(t=>pool.includes(t))||matches(g.board).length||!legalMoves(g.board).length)return false;
 if(!Array.isArray(g.goals)||g.goals.length<1||g.goals.length>2||!g.goals.every(x=>x&&((x.kind==='plates'&&integer(x.amount,1,56))||(x.kind==='food'&&pool.includes(x.type)&&integer(x.amount,1,1000)))))return false;
 if(!Array.isArray(g.collected)||g.collected.length!==FOODS.length||!g.collected.every(x=>integer(x)))return false;
 if(!Array.isArray(g.plates)||g.plates.length>56||!g.plates.every(n=>integer(n,0,55))||new Set(g.plates).size!==g.plates.length)return false;
 if(g.goals.some(x=>x.kind==='plates'&&g.plates.length>x.amount))return false;
 if(g.dailyDate!==undefined&&!validDay(g.dailyDate))return false;
 if(g.recipeReward!==undefined&&!recipeById(g.recipeReward))return false;
 if(!g.boosters||!integer(g.boosters.rolling,0,3)||!integer(g.boosters.kettle,0,3))return false;
 return g.status===gameStatus(g);
}
function decode(raw){
 const p=JSON.parse(raw);
 if(!p||!integer(p.unlocked,1)||!integer(p.best)||!validGame(p.game)||!p.settings||!['sound','music','reduced'].every(k=>typeof p.settings[k]==='boolean'))throw Error('invalid save');
 const volume=p.settings.soundVolume;if(typeof volume!=='number'||!Number.isFinite(volume)||volume<0||volume>1)throw Error('invalid volume');
 if(!Array.isArray(p.completed)||p.completed.length>10000||!p.completed.every(n=>integer(n,1)&&n<=p.unlocked)||new Set(p.completed).size!==p.completed.length)throw Error('invalid book');
 const daily=p.daily;
 if(!daily||!Array.isArray(daily.cards)||daily.cards.length>10000||!daily.cards.every(validDay)||new Set(daily.cards).size!==daily.cards.length||!validGame(daily.game)||(daily.game!==null&&(!validDay(daily.game.dailyDate)||daily.game.mode)))throw Error('invalid daily collection');
 if(!Array.isArray(daily.art)||daily.art.length!==daily.cards.length||!daily.art.every(n=>integer(n,0,23)))throw Error('invalid postcard artwork');
 if(p.game?.dailyDate!==undefined||p.game?.mode!==undefined)throw Error('another mode in campaign');
 const relaxed=p.relaxed;
 if(!relaxed||!integer(relaxed.completed)||!validGame(relaxed.game)||(relaxed.game!==null&&(relaxed.game.mode!=='relaxed'||relaxed.game.dailyDate!==undefined)))throw Error('invalid relaxed mode');
 const recipes=p.recipes;
 if(!recipes||!Array.isArray(recipes.unlocked)||recipes.unlocked.length>12||!recipes.unlocked.every((id,i)=>id===RECIPE_CARDS[i].id)||!Array.isArray(recipes.milestones)||recipes.milestones.length!==recipes.unlocked.length||!recipes.milestones.every((n,i)=>n===recipeMilestone(i)))throw Error('invalid recipes');
 if(!Array.isArray(p.seenHelpers)||p.seenHelpers.length>2||new Set(p.seenHelpers).size!==p.seenHelpers.length||!p.seenHelpers.every(k=>['rolling','kettle'].includes(k)))throw Error('invalid helper guidance');
 return p;
}
export function loadProgress(storage){
 try{const raw=storage.getItem(KEY);return {data:raw===null?defaultProgress():decode(raw),warning:null};}catch{}
 return {data:defaultProgress(),warning:'Сохранение недоступно или повреждено. Можно играть, но прогресс может не сохраниться.'};
}
export function saveProgress(storage,data){try{storage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}}
// Concurrent tabs must not overwrite each other's current progress during an update.
export function saveBeforeUpdate(storage,data,baseline,dirty=false){
 try{
  const current=storage.getItem(KEY);
  if(current!==baseline){
   if(dirty)return {ok:false,data};
   const latest=loadProgress(storage);if(latest.warning)return {ok:false,data};
   data=latest.data;
  }
  if(!saveProgress(storage,data))return {ok:false,data};
  return {ok:true,data,raw:storage.getItem(KEY)};
 }catch{return {ok:false,data};}
}
