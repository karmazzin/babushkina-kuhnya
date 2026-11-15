import {CHAPTERS,levelRecipe} from './recipes.js';
export const DISHES=['Пирожки','Блины','Пельмени','Борщ','Сырники'];
export function goalHint(g){
 if(!g)return 'Соберите три одинаковых блюда в ряд';
 if(g.goals?.some(x=>x.kind==='plates')&&g.plates?.length)return 'Собирайте блюда на тарелках';
 if(g.goals?.some(x=>x.kind==='food'&&(g.collected?.[x.type]??0)<x.amount))return 'Соберите блюда, показанные сверху';
 if((!g.goals||g.goals.some(x=>x.kind==='score'))&&g.score<g.target)return 'Соберите три одинаковых блюда в ряд';
 return 'Угощение готово!';
}
export function goalText(g){return (g.goals??[{kind:'score'}]).map(x=>x.kind==='score'?`${g.target} очков`:x.kind==='plates'?`Тарелки: ${x.amount}`:`${DISHES[x.type]}: ${x.amount}`).join(' · ');}
export function goalMarkup(g){return (g.goals??[]).filter(x=>x.kind!=='score').map(x=>{
 const plate=x.kind==='plates',count=Math.min(x.amount,plate?x.amount-(g.plates?.length??0):(g.collected?.[x.type]??0)),name=plate?'Тарелки':DISHES[x.type];
 return `<span class="dish-goal" aria-label="${name}: ${count} из ${x.amount}"><span class="${plate?'plate-icon':'food f'+x.type}" aria-hidden="true"></span><span>${count}<small>/${x.amount}</small></span>${count>=x.amount?'<span class="goal-check" aria-hidden="true">✓</span>':''}</span>`;
 }).join('');}
export function renderBook(root,data,page,onSelect,onRecipe,onNav){
 const chapter=CHAPTERS[page%3],first=page*6+1,done=new Set(data.completed),complete=Array.from({length:6},(_,i)=>first+i).every(n=>done.has(n));
 root.innerHTML=`<div class="book-heading"><span class="food f${chapter.types[0]} book-dish" aria-hidden="true"></span><span>Тетрадь ${Math.floor(page/3)+1} · глава ${page%3+1}</span><h2>${chapter.title}</h2><p>Каждый уровень — маленькое угощение</p></div><div class="book-levels">${Array.from({length:6},(_,i)=>{const n=first+i,r=levelRecipe(n);return `<button class="recipe-level ${done.has(n)?'complete':''}" data-level="${n}" ${n>data.unlocked?'disabled':''}><b>${done.has(n)?'✓ ':''}${n}</b><span>${r.title}</span><small>${n>data.unlocked?'Пока закрыт':r.goals.some(g=>g.kind==='plates')?'Блюда на тарелках':r.goals.some(g=>g.kind==='food')?'Собрать блюда':'Набрать очки'}</small></button>`;}).join('')}</div><button class="button secondary recipe-unlock" id="chapter-recipe">${complete?'Открыть рецепт':'Рецепт откроется после 6 уровней'}<small>${chapter.dish}</small></button><div class="book-pager"><button class="round-button" id="chapter-prev" aria-label="Предыдущая глава" ${page===0?'disabled':''}>‹</button><span>${page+1} / ${Math.max(3,Math.floor((data.unlocked-1)/6)+1)}</span><button class="round-button" id="chapter-next" aria-label="Следующая глава" ${page>=Math.max(2,Math.floor((data.unlocked-1)/6))?'disabled':''}>›</button></div>`;
 root.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>onSelect(Number(b.dataset.level)));
 root.querySelector('#chapter-recipe').onclick=()=>onRecipe(chapter,complete);
 root.querySelector('#chapter-prev').onclick=()=>onNav(page-1);root.querySelector('#chapter-next').onclick=()=>onNav(page+1);
}

export function resultGoalText(g){return (g.goals??[{kind:'score'}]).map(x=>x.kind==='score'?`Очки: ${g.score} из ${g.target}`:x.kind==='plates'?`Тарелки: убрано ${Math.max(0,x.amount-(g.plates?.length??0))} из ${x.amount}`:`${DISHES[x.type]}: собрано ${g.collected?.[x.type]??0} из ${x.amount}`).join(' · ');}
