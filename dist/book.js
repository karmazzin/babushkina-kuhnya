import {levelRecipe} from './recipes.js';
import {FOODS} from './foods.js';
import {RECIPE_CARDS} from './recipe-cards.js';
import {nextRecipeReward} from './progression.js';
export const DISHES=FOODS.map(f=>f.plural);
export function goalHint(g){
 if(!g)return 'Соберите три одинаковых блюда в ряд';
 if(g.status==='helpers')return 'Ходы закончились — помогут скалка и чайник';
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
export function rewardMarkup(data){
 const next=nextRecipeReward(data);
 return next?`<div class="next-recipe"><b>${next.recipe.dish}</b><span>Новый рецепт после уровня ${next.level}</span><progress value="${next.progress}" max="${next.total}" aria-label="До рецепта: пройдено ${next.progress} из ${next.total} уровней"></progress><small>До награды: ${next.remaining}</small></div>`:'<p class="next-recipe">Все 12 рецептов уже в вашей книге!</p>';
}
export function renderBook(root,data,page,onSelect,onRecipe,onNav,onShelf=()=>{}){
 const last=Math.max(2,Math.floor((data.unlocked-1)/6)),current=Math.max(0,Math.min(page,last)),first=current*6+1,done=new Set(data.completed),intro=levelRecipe(first),next=nextRecipeReward(data);
 root.innerHTML=`<div class="book-heading"><span>Уровни ${first}–${first+5}</span><h2>${intro.chapter}</h2></div><div class="book-levels">${Array.from({length:6},(_,i)=>{const n=first+i,r=levelRecipe(n);return `<button class="recipe-level ${done.has(n)?'complete':''}" data-level="${n}" ${n>data.unlocked?'disabled':''}><b>${done.has(n)?'✓ ':''}${n}</b><span>${r.title}</span><small>${n>data.unlocked?'Пока закрыт':r.goals.some(g=>g.kind==='plates')?'Блюда на тарелках':'Собрать блюда'}</small></button>`;}).join('')}</div><div class="book-rewards">${rewardMarkup(data)}<button class="button secondary" id="recipe-shelf">Мои рецепты · ${data.recipes.unlocked.length} / 12</button></div><div class="book-pager"><button class="round-button" id="chapter-prev" aria-label="Предыдущие уровни" ${current===0?'disabled':''}>‹</button><span>${current+1} / ${last+1}</span><button class="round-button" id="chapter-next" aria-label="Следующие уровни" ${current>=last?'disabled':''}>›</button></div>`;
 root.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>onSelect(Number(b.dataset.level)));
 root.querySelector('#recipe-shelf').onclick=onShelf;
 root.querySelector('#chapter-prev').onclick=()=>onNav(current-1);root.querySelector('#chapter-next').onclick=()=>onNav(current+1);
}
export function recipeIllustration(recipe){return recipe.image?`<img class="recipe-illustration" src="${recipe.image}" alt="${recipe.dish}">`:`<span class="food f${recipe.food} recipe-illustration" role="img" aria-label="${recipe.dish}"></span>`;}
export function renderRecipeShelf(root,data,page,onRecipe,onNav){
 const current=Math.max(0,Math.min(2,page)),next=nextRecipeReward(data),pending=RECIPE_CARDS.filter(r=>!data.recipes.unlocked.includes(r.id));
 root.innerHTML=`<p class="shelf-caption">Семейные рецепты · открыто ${data.recipes.unlocked.length} из 12</p><div class="recipe-shelf">${RECIPE_CARDS.slice(current*4,current*4+4).map(r=>{const unlocked=data.recipes.unlocked.includes(r.id),level=next?next.level+pending.indexOf(r)*12:null;return `<button class="shelf-recipe ${unlocked?'unlocked':''}" data-recipe="${r.id}" aria-label="${r.dish}. ${unlocked?'Открыть рецепт':'После уровня '+level}">${recipeIllustration(r)}<b>${r.dish}</b><small>${unlocked?'Открыть рецепт':'После уровня '+level}</small></button>`;}).join('')}</div><div class="book-pager"><button class="round-button" id="chapter-prev" aria-label="Предыдущие рецепты" ${current===0?'disabled':''}>‹</button><span>${current+1} / 3</span><button class="round-button" id="chapter-next" aria-label="Следующие рецепты" ${current===2?'disabled':''}>›</button></div>`;
 root.querySelectorAll('[data-recipe]').forEach(b=>b.onclick=()=>onRecipe(RECIPE_CARDS.find(r=>r.id===b.dataset.recipe),data.recipes.unlocked.includes(b.dataset.recipe)));
 root.querySelector('#chapter-prev').onclick=()=>onNav(current-1);root.querySelector('#chapter-next').onclick=()=>onNav(current+1);
}
export function recipePages(recipe){
 const pages=[`${recipeIllustration(recipe)}<p class="recipe-servings">${recipe.servings}</p>`];
 for(let i=0;i<recipe.ingredients.length;i+=3)pages.push(`<p class="recipe-section">Ингредиенты${i?' · продолжение':''}</p><ul class="recipe-ingredients">${recipe.ingredients.slice(i,i+3).map(s=>`<li>${s}</li>`).join('')}</ul>`);
 recipe.steps.forEach((s,i)=>pages.push(`<p class="recipe-section">Шаг ${i+1} из ${recipe.steps.length}</p><p class="recipe-step">${s}</p>`));return pages;
}
export function resultGoalText(g){return (g.goals??[{kind:'score'}]).map(x=>x.kind==='score'?`Очки: ${g.score} из ${g.target}`:x.kind==='plates'?`Тарелки: убрано ${Math.max(0,x.amount-(g.plates?.length??0))} из ${x.amount}`:`${DISHES[x.type]}: собрано ${Math.min(x.amount,g.collected?.[x.type]??0)} из ${x.amount}`).join(' · ');}
