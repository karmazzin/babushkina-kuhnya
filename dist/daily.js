import {freshBoard} from './engine.js';
import {seededRandom} from './random.js';
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
 const random=seededRandom(seed),variant=seed%4,type=(seed>>>4)%5;
 const plates=variant===3?[16,17,23,24]:[];
 const goals=plates.length?[{kind:'plates',amount:plates.length}]:[{kind:'food',type,amount:12}];
 return {level:1,dailyDate:day,board:freshBoard(random),rng:random.state,moves:16,target:1000,score:0,status:'playing',goals,plates,collected:[0,0,0,0,0],boosters:{rolling:1,kettle:1},helperRule:'turn'};
}
export function recordDailyWin(daily){
 const date=daily.game?.dailyDate;
 if(daily.game?.status!=='won'||!validDay(date)||daily.cards.includes(date))return daily;
 return {...daily,cards:[...daily.cards,date]};
}
export function dailyOffer(daily,today=localDay()){
 if(daily.game?.status==='playing')return daily.game.dailyDate===today?'resume':'previous';
 return daily.cards.includes(today)?'completed':'new';
}
