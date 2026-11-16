import {FOODS} from './foods.js';
export const DISHES=FOODS.map(f=>f.plural);
export function goalHint(g){
 if(!g)return 'Соберите три одинаковых блюда в ряд';
 if(g.status==='helpers')return 'Ходы закончились — помогут скалка и чайник';
 if(g.goals.some(x=>x.kind==='tea'&&g.servedTea<x.amount))return 'Опустите чашки в нижний ряд';
 if(g.goals?.some(x=>x.kind==='plates')&&g.plates?.length)return 'Собирайте блюда на тарелках';
 if(g.goals?.some(x=>x.kind==='food'&&(g.collected?.[x.type]??0)<x.amount))return 'Соберите блюда, показанные сверху';
 return 'Угощение готово!';
}
export function goalText(g){return g.goals.map(x=>x.kind==='plates'?`Тарелки: ${x.amount}`:x.kind==='tea'?`Чай: ${x.amount}`:`${DISHES[x.type]}: ${x.amount}`).join(' · ');}
export function goalMarkup(g){return g.goals.map(x=>{
 const plate=x.kind==='plates',tea=x.kind==='tea',count=Math.min(x.amount,plate?x.amount-(g.plates?.length??0):tea?g.servedTea:(g.collected?.[x.type]??0)),name=plate?'Тарелки':tea?'Чай':DISHES[x.type];
 return `<span class="dish-goal" aria-label="${name}: ${count} из ${x.amount}"><span class="${plate?'plate-icon':tea?'food tea':'food f'+x.type}" aria-hidden="true"></span><span>${count}<small>/${x.amount}</small></span>${count>=x.amount?'<span class="goal-check" aria-hidden="true">✓</span>':''}</span>`;
 }).join('');}
export function resultGoalText(g){return g.goals.map(x=>x.kind==='plates'?`Тарелки: убрано ${Math.max(0,x.amount-(g.plates?.length??0))} из ${x.amount}`:x.kind==='tea'?`Чай: подано ${Math.min(x.amount,g.servedTea)} из ${x.amount}`:`${DISHES[x.type]}: собрано ${Math.min(x.amount,g.collected?.[x.type]??0)} из ${x.amount}`).join(' · ');}
