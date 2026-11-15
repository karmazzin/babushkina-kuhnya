import {matches,legalMoves,goalComplete} from './engine.js';
export const KEY='babushkina-kuhnya:v1';
export const defaultProgress=()=>({version:1,unlocked:1,best:0,game:null,completed:[],settings:{sound:true,music:true,reduced:false}});
const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
function validGame(g){
 if(g===null)return true;
 if(!g||!integer(g.level,1)||!integer(g.moves,0,24)||!integer(g.target,1)||!integer(g.score)||!['playing','won','lost'].includes(g.status))return false;
 if(!Array.isArray(g.board)||g.board.length!==56||!g.board.every(t=>integer(t,0,4))||matches(g.board).length||!legalMoves(g.board).length)return false;
 if(g.goals!==undefined&&(!Array.isArray(g.goals)||g.goals.length<1||g.goals.length>2||!g.goals.every(x=>x&&((x.kind==='score')||(x.kind==='plates'&&integer(x.amount,1,56))||(x.kind==='food'&&integer(x.type,0,4)&&integer(x.amount,1,1000))))))return false;
 if(g.goals!==undefined&&(!Array.isArray(g.collected)||g.collected.length!==5||!g.collected.every(x=>integer(x))))return false;
 if(g.plates!==undefined&&(!Array.isArray(g.plates)||g.plates.length>56||!g.plates.every(n=>integer(n,0,55))||new Set(g.plates).size!==g.plates.length))return false;
 if(g.goals?.some(x=>x.kind==='plates'&&(!Array.isArray(g.plates)||g.plates.length>x.amount)))return false;
 if(g.boosters!==undefined&&(!g.boosters||!integer(g.boosters.rolling,0,3)||!integer(g.boosters.kettle,0,3)))return false;
 return g.status===(goalComplete(g)?'won':g.moves===0?'lost':'playing');
}
export function loadProgress(storage){
 try{
  const raw=storage.getItem(KEY);if(raw===null)return {data:defaultProgress(),warning:null};const p=JSON.parse(raw);
  if(!p||p.version!==1||!integer(p.unlocked,1)||!integer(p.best)||!validGame(p.game)||!p.settings||typeof p.settings.sound!=='boolean'||typeof p.settings.reduced!=='boolean'||(p.settings.music!==undefined&&typeof p.settings.music!=='boolean'))throw Error('invalid save');
  if(p.settings.soundVolume!==undefined&&(typeof p.settings.soundVolume!=='number'||!Number.isFinite(p.settings.soundVolume)||p.settings.soundVolume<0||p.settings.soundVolume>1))throw Error('invalid volume');
  if(p.completed!==undefined&&(!Array.isArray(p.completed)||p.completed.length>10000||!p.completed.every(n=>integer(n,1)&&n<=p.unlocked)))throw Error('invalid book');
  return {data:{completed:p.completed??Array.from({length:Math.min(p.unlocked-1,10000)},(_,i)=>i+1),version:1,unlocked:p.unlocked,best:p.best,game:p.game,settings:{...(p.settings.soundVolume!==undefined?{soundVolume:p.settings.soundVolume}:{}),sound:p.settings.sound,music:p.settings.music??p.settings.sound,reduced:p.settings.reduced}},warning:null};
 }catch{return {data:defaultProgress(),warning:'Сохранение недоступно или повреждено. Можно играть, но прогресс может не сохраниться.'};}
}
export function saveProgress(storage,data){try{storage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}}
