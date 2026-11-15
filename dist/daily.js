import {createGame,isActiveGame} from './engine.js';
import {PLATE_LAYOUTS} from './recipes.js';
export function localDay(date=new Date()){
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function validDay(day){
 if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;
 const date=new Date(day+'T12:00:00Z');
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===day;
}
export function displayDay(day){const [y,m,d]=day.split('-');return `${d}.${m}.${y}`;}
export function newDailyGame(day=localDay()){
 if(!validDay(day))throw Error('Invalid daily date');
 let seed=2166136261;for(const char of day)seed=Math.imul(seed^char.charCodeAt(0),16777619)>>>0;
 const variant=seed%4,type=(seed>>>4)%5,other=(type+1+((seed>>>8)%4))%5;
 const plates=variant===2?PLATE_LAYOUTS.tea:variant===3?PLATE_LAYOUTS.pairs:[];
 const goals=variant===0?[{kind:'food',type,amount:12}]:variant===1?[{kind:'food',type,amount:8},{kind:'food',type:other,amount:8}]:variant===2?[{kind:'plates',amount:6}]:[{kind:'plates',amount:4},{kind:'food',type,amount:8}];
 return createGame({goals,plates,moves:16},{seed,dailyDate:day});
}
export function recordDailyWin(daily){
 const date=daily.game?.dailyDate;
 if(daily.game?.status!=='won'||!validDay(date)||daily.cards.includes(date))return daily;
 const art=daily.art??daily.cards.map((_,i)=>i%12),used=new Set(art);
 const next=Array.from({length:24},(_,i)=>i).find(i=>!used.has(i))??((art.at(-1)??-1)+1)%24;
 return {...daily,cards:[...daily.cards,date],art:[...art,next]};
}
export function dailyOffer(daily,today=localDay()){
 if(isActiveGame(daily.game))return daily.game.dailyDate===today?'resume':'previous';
 return daily.cards.includes(today)?'completed':'new';
}
