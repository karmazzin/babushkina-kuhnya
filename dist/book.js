import {levelRecipe} from './recipes.js';
import {FOODS} from './foods.js';
import {starBalance} from './garden.js';
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
export function renderBook(root,data,page,onSelect,onNav){
 const last=Math.max(2,Math.floor((data.unlocked-1)/6)),current=Math.max(0,Math.min(page,last)),first=current*6+1,done=new Set(data.completed),intro=levelRecipe(first);
 root.innerHTML=`<div class="book-heading"><span>Уровни ${first}–${first+5}</span><h2>${intro.chapter}</h2></div><div class="book-levels">${Array.from({length:6},(_,i)=>{const n=first+i,r=levelRecipe(n);return `<button class="recipe-level ${done.has(n)?'complete':''}" data-level="${n}" ${n>data.unlocked?'disabled':''}><b>${done.has(n)?'✓ ':''}${n}</b><span>${r.title}</span><small>${n>data.unlocked?'Пока закрыт':done.has(n)?'Звезда уже получена':'+1 ★ за победу'}</small></button>`;}).join('')}</div><p class="garden-level-note">${starBalance(data)} ★ для огорода · новые уровни — новые звёзды</p><div class="book-pager"><button class="round-button" id="chapter-prev" aria-label="Предыдущие уровни" ${current===0?'disabled':''}>‹</button><span>${current+1} / ${last+1}</span><button class="round-button" id="chapter-next" aria-label="Следующие уровни" ${current>=last?'disabled':''}>›</button></div>`;
 root.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>onSelect(Number(b.dataset.level)));
 root.querySelector('#chapter-prev').onclick=()=>onNav(current-1);root.querySelector('#chapter-next').onclick=()=>onNav(current+1);
}
export function resultGoalText(g){return g.goals.map(x=>x.kind==='plates'?`Тарелки: убрано ${Math.max(0,x.amount-(g.plates?.length??0))} из ${x.amount}`:x.kind==='tea'?`Чай: подано ${Math.min(x.amount,g.servedTea)} из ${x.amount}`:`${DISHES[x.type]}: собрано ${Math.min(x.amount,g.collected?.[x.type]??0)} из ${x.amount}`).join(' · ');}
