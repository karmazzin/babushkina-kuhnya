import {validDay} from './daily.js';
import {matches,legalMoves,gameStatus} from './engine.js';
import {FOODS,BASE_POOL} from './foods.js';
import {recipeById,recipeMilestone,RECIPE_CARDS} from './recipe-cards.js';
import {legacyRecipes} from './progression.js';
// Old tabs keep writing v2; they cannot discard the new collection or mode.
export const KEY='babushkina-kuhnya:v3';
export const defaultProgress=()=>({version:2,unlocked:1,best:0,game:null,daily:{game:null,cards:[],art:[]},relaxed:{game:null,completed:0},recipes:{unlocked:[],milestones:[]},seenHelpers:[],completed:[],settings:{sound:true,music:true,reduced:false}});
const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
function validGame(g){
 if(g===null)return true;
 if(!g||!integer(g.level,1)||!(g.mode==='relaxed'?g.moves===null:integer(g.moves,0,24))||!integer(g.target,1)||!integer(g.score)||!['playing','helpers','won','lost'].includes(g.status))return false;
 if(g.ruleVersion!==undefined&&g.ruleVersion!==3)return false;
 if(g.mode!==undefined&&(g.mode!=='relaxed'||g.ruleVersion!==3||!integer(g.order,1)))return false;
 const pool=g.ruleVersion===3?g.pool:BASE_POOL;
 if(!Array.isArray(pool)||pool.length!==5||new Set(pool).size!==5||!pool.every(t=>integer(t,0,FOODS.length-1)))return false;
 if(g.ruleVersion===3&&(!integer(g.rng,0,4294967295)||!integer(g.actions)||!integer(g.stalled)))return false;
 if(g.gaveUp!==undefined&&(g.gaveUp!==true||g.ruleVersion!==3||g.moves!==0))return false;
 if(!Array.isArray(g.board)||g.board.length!==56||!g.board.every(t=>pool.includes(t))||matches(g.board).length||!legalMoves(g.board).length)return false;
 if(g.goals!==undefined&&(!Array.isArray(g.goals)||g.goals.length<1||g.goals.length>2||!g.goals.every(x=>x&&((x.kind==='score')||(x.kind==='plates'&&integer(x.amount,1,56))||(x.kind==='food'&&pool.includes(x.type)&&integer(x.amount,1,1000))))))return false;
 if(g.goals!==undefined&&(!Array.isArray(g.collected)||g.collected.length!==(g.ruleVersion===3?FOODS.length:5)||!g.collected.every(x=>integer(x))))return false;
 if(g.plates!==undefined&&(!Array.isArray(g.plates)||g.plates.length>56||!g.plates.every(n=>integer(n,0,55))||new Set(g.plates).size!==g.plates.length))return false;
 if(g.goals?.some(x=>x.kind==='plates'&&(!Array.isArray(g.plates)||g.plates.length>x.amount)))return false;
 if(g.rng!==undefined&&!integer(g.rng,0,4294967295))return false;
 if(g.dailyDate!==undefined&&(!validDay(g.dailyDate)||g.rng===undefined))return false;
 if(g.recipeReward!==undefined&&!recipeById(g.recipeReward))return false;
 if(g.helperRule!==undefined&&g.helperRule!=='turn')return false;
 if(g.boosters!==undefined&&(!g.boosters||!integer(g.boosters.rolling,0,3)||!integer(g.boosters.kettle,0,3)))return false;
 return g.status===gameStatus(g);
}
function decode(raw){
 const p=JSON.parse(raw);
 if(!p||![1,2].includes(p.version)||!integer(p.unlocked,1)||!integer(p.best)||!validGame(p.game)||!p.settings||typeof p.settings.sound!=='boolean'||typeof p.settings.reduced!=='boolean'||(p.settings.music!==undefined&&typeof p.settings.music!=='boolean'))throw Error('invalid save');
 if(p.settings.soundVolume!==undefined&&(typeof p.settings.soundVolume!=='number'||!Number.isFinite(p.settings.soundVolume)||p.settings.soundVolume<0||p.settings.soundVolume>1))throw Error('invalid volume');
 if(p.completed!==undefined&&(!Array.isArray(p.completed)||p.completed.length>10000||!p.completed.every(n=>integer(n,1)&&n<=p.unlocked)))throw Error('invalid book');
 const completed=[...new Set(p.completed??Array.from({length:Math.min(p.unlocked-1,10000)},(_,i)=>i+1))];
 const daily=p.daily??{game:null,cards:[]};
 if(!daily||typeof daily!=='object'||!Array.isArray(daily.cards)||daily.cards.length>10000||!daily.cards.every(validDay)||new Set(daily.cards).size!==daily.cards.length||!validGame(daily.game)||(daily.game!==null&&(!validDay(daily.game.dailyDate)||daily.game.mode)))throw Error('invalid daily collection');
 const art=daily.art??daily.cards.map((_,i)=>i%12);
 if(!Array.isArray(art)||art.length!==daily.cards.length||!art.every(n=>integer(n,0,23)))throw Error('invalid postcard artwork');
 if(p.game?.dailyDate!==undefined||p.game?.mode!==undefined)throw Error('another mode in campaign');
 const relaxed=p.relaxed??{game:null,completed:0};
 if(!relaxed||!integer(relaxed.completed)||!validGame(relaxed.game)||(relaxed.game!==null&&(relaxed.game.mode!=='relaxed'||relaxed.game.dailyDate!==undefined)))throw Error('invalid relaxed mode');
 const recipes=p.recipes??legacyRecipes(completed),milestones=RECIPE_CARDS.map((_,i)=>recipeMilestone(i));
 if(!recipes||!Array.isArray(recipes.unlocked)||recipes.unlocked.length>12||new Set(recipes.unlocked).size!==recipes.unlocked.length||!recipes.unlocked.every(recipeById)||!Array.isArray(recipes.milestones)||recipes.milestones.length>12||new Set(recipes.milestones).size!==recipes.milestones.length||!recipes.milestones.every(n=>milestones.includes(n)))throw Error('invalid recipes');
 const seenHelpers=p.seenHelpers??[];
 if(!Array.isArray(seenHelpers)||seenHelpers.length>2||new Set(seenHelpers).size!==seenHelpers.length||!seenHelpers.every(k=>['rolling','kettle'].includes(k)))throw Error('invalid helper guidance');
 return {version:2,unlocked:p.unlocked,best:p.best,game:p.game,daily:{...daily,art},relaxed,recipes,seenHelpers,completed,settings:{...(p.settings.soundVolume!==undefined?{soundVolume:p.settings.soundVolume}:{}),sound:p.settings.sound,music:p.settings.music??p.settings.sound,reduced:p.settings.reduced}};
}
export function loadProgress(storage){
 let damaged=false;
 try{
  for(const key of [KEY,'babushkina-kuhnya:v2','babushkina-kuhnya:v1']){
   const raw=storage.getItem(key);if(raw===null)continue;
   try{return {data:decode(raw),warning:damaged?'Новое сохранение повреждено. Восстановлен более ранний прогресс.':null};}catch{damaged=true;}
  }
  if(!damaged)return {data:defaultProgress(),warning:null};
 }catch{}
 return {data:defaultProgress(),warning:'Сохранение недоступно или повреждено. Можно играть, но прогресс может не сохраниться.'};
}
export function saveProgress(storage,data){try{storage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}}
// Update must never write a stale tab's snapshot over a newer persisted game.
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
