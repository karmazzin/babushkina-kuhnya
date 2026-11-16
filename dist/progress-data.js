import {validDay} from './daily.js';
import {matches,legalMoves,gameStatus} from './engine.js';
import {FOODS} from './foods.js';
import {TEA,teaCells,bottomTea} from './tea.js';
import {defaultGarden,validGarden} from './garden.js';
export const defaultProgress=()=>({resetToken:'initial',unlocked:1,best:0,game:null,daily:{game:null,cards:[],art:[]},relaxed:{game:null,completed:0},garden:defaultGarden(),seenHelpers:[],seenTea:false,completed:[],settings:{sound:true,music:true,reduced:false,soundVolume:.35}});
const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
function validGame(g){
 if(g===null)return true;
 if(!g||!integer(g.level,1)||!(g.mode==='relaxed'?g.moves===null:integer(g.moves,0,24))||!integer(g.score)||!['playing','helpers','won','lost'].includes(g.status))return false;
 if(g.mode!==undefined&&(g.mode!=='relaxed'||!integer(g.order,1)))return false;
 const pool=g.pool;
 if(!Array.isArray(pool)||pool.length!==5||new Set(pool).size!==5||!pool.every(t=>integer(t,0,FOODS.length-1)))return false;
 if(!integer(g.rng,0,4294967295)||!integer(g.actions)||!integer(g.stalled))return false;
 if(g.gaveUp!==undefined&&(g.gaveUp!==true||g.moves!==0))return false;
 if(!Array.isArray(g.board)||g.board.length!==56||!g.board.every(t=>t===TEA||pool.includes(t))||matches(g.board).length||!legalMoves(g.board).length)return false;
 if(!Array.isArray(g.goals)||g.goals.length<1||g.goals.length>2||!g.goals.every(x=>x&&((x.kind==='tea'&&integer(x.amount,1,2))||(x.kind==='plates'&&integer(x.amount,1,56))||(x.kind==='food'&&pool.includes(x.type)&&integer(x.amount,1,1000)))))return false;
 const teaGoals=g.goals.filter(x=>x.kind==='tea');
 if(!integer(g.servedTea,0,2)||teaGoals.length>1||g.servedTea+teaCells(g.board).length!==(teaGoals[0]?.amount??0)||bottomTea(g.board).length)return false;
 if(!Array.isArray(g.collected)||g.collected.length!==FOODS.length||!g.collected.every(x=>integer(x)))return false;
 if(!Array.isArray(g.plates)||g.plates.length>56||!g.plates.every(n=>integer(n,0,55))||new Set(g.plates).size!==g.plates.length)return false;
 if(g.goals.some(x=>x.kind==='plates'&&g.plates.length>x.amount))return false;
 if(g.dailyDate!==undefined&&!validDay(g.dailyDate))return false;
 if(g.starReward!==undefined&&(typeof g.starReward!=='boolean'||g.status!=='won'))return false;
 if(!g.boosters||!integer(g.boosters.rolling,0,3)||!integer(g.boosters.kettle,0,3))return false;
 return g.status===gameStatus(g);
}

// Achievements outlive any one board or feature. Validate each part independently.
export function normalizeProgress(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||!['unlocked','best','completed'].some(k=>Object.hasOwn(value,k)))throw Error('unreadable progress');
 const p=value,defaults=defaultProgress();let repaired=false;
 const number=(v,fallback,min=0,max=Number.MAX_SAFE_INTEGER)=>{if(v===undefined)return fallback;if(integer(v,min,max))return v;repaired=true;return fallback;};
 const boolean=(v,fallback)=>{if(v===undefined)return fallback;if(typeof v==='boolean')return v;repaired=true;return fallback;};
 const list=(v,check,max=10000)=>{if(v===undefined)return [];if(!Array.isArray(v)){repaired=true;return [];}const clean=[...new Set(v.slice(0,max).filter(check))];if(clean.length!==v.length)repaired=true;return clean;};
 let unlocked=number(p.unlocked,1,1),completed=p.completed===undefined?Array.from({length:Math.min(unlocked-1,10000)},(_,i)=>i+1):list(p.completed,n=>integer(n,1));
 if(p.unlocked===undefined||!integer(p.unlocked,1))unlocked=Math.max(unlocked,...completed.map(n=>n+1));
 completed=completed.filter(n=>{if(n<=unlocked)return true;repaired=true;return false;});
 const game=(v,mode)=>{
  if(v===null||v===undefined)return null;
  const g={...v};if(g.servedTea===undefined&&Array.isArray(g.goals)&&!g.goals.some(x=>x?.kind==='tea'))g.servedTea=0;
  if(validGame(g)&&(mode==='regular'?g.dailyDate===undefined&&g.mode===undefined:mode==='daily'?validDay(g.dailyDate)&&g.mode===undefined:g.mode==='relaxed'&&g.dailyDate===undefined))return g;
  repaired=true;return null;
 };
 const settings={...defaults.settings};
 if(p.settings!==undefined&&(!p.settings||typeof p.settings!=='object'))repaired=true;
 for(const key of ['sound','music','reduced'])settings[key]=boolean(p.settings?.[key],settings[key]);
 const volume=p.settings?.soundVolume;
 if(volume!==undefined){if(typeof volume==='number'&&Number.isFinite(volume)&&volume>=0&&volume<=1)settings.soundVolume=volume;else repaired=true;}
 const cards=list(p.daily?.cards,validDay),art=cards.map(day=>{
  const i=p.daily.cards.indexOf(day),n=p.daily.art?.[i];if(integer(n,0,23))return n;if(n!==undefined)repaired=true;return i%24;
 });
 const data={...p,resetToken:typeof p.resetToken==='string'?p.resetToken:'initial',unlocked,best:number(p.best,0),completed,game:game(p.game,'regular'),daily:{...p.daily,game:game(p.daily?.game,'daily'),cards,art},relaxed:{...p.relaxed,game:game(p.relaxed?.game,'relaxed'),completed:number(p.relaxed?.completed,0)},garden:p.garden??defaultGarden(),seenHelpers:list(p.seenHelpers,x=>['rolling','kettle'].includes(x),2),seenTea:boolean(p.seenTea,false),settings};
 if(!validGarden(data)){data.garden=defaultGarden();repaired=true;}
 return {data,repaired,gardenValid:validGarden({...data,garden:p.garden})};
}

// Whole boards and device preferences stay with the first argument.
export function mergeAchievements(local,remote){
 const cards=new Map(local.daily.cards.map((day,i)=>[day,local.daily.art[i]]));
 remote.daily.cards.forEach((day,i)=>{if(!cards.has(day))cards.set(day,remote.daily.art[i]);});
 const completed=[...new Set([...local.completed,...remote.completed])].sort((a,b)=>a-b);
 return {...remote,...local,unlocked:Math.max(local.unlocked,remote.unlocked),best:Math.max(local.best,remote.best),completed,daily:{...local.daily,cards:[...cards.keys()],art:[...cards.values()]},relaxed:{...local.relaxed,completed:Math.max(local.relaxed.completed,remote.relaxed.completed)},seenHelpers:[...new Set([...local.seenHelpers,...remote.seenHelpers])],seenTea:local.seenTea||remote.seenTea};
}

export function achievementSnapshot(p){return {...p,game:null,daily:{...p.daily,game:null},relaxed:{...p.relaxed,game:null}};}
