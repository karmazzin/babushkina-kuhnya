import {RECIPE_CARDS,recipeMilestone} from './recipe-cards.js';
export {recipeMilestone} from './recipe-cards.js';
export function completedThrough(completed){const done=new Set(completed);let n=0;while(done.has(n+1))n++;return n;}
export function legacyRecipes(completed){
 const done=new Set(completed),unlocked=new Set();
 for(const n of completed)if(n%6===0&&Array.from({length:6},(_,i)=>n-5+i).every(x=>done.has(x)))unlocked.add(RECIPE_CARDS[(n/6-1)%3].id);
 const through=completedThrough(completed);
 return {unlocked:RECIPE_CARDS.filter(r=>unlocked.has(r.id)).map(r=>r.id),milestones:RECIPE_CARDS.map((_,i)=>recipeMilestone(i)).filter(n=>n<=through)};
}
export function nextRecipeReward(data){
 const state=data.recipes??{unlocked:[],milestones:[]},recipe=RECIPE_CARDS.find(r=>!state.unlocked.includes(r.id));
 if(!recipe)return null;
 const level=RECIPE_CARDS.map((_,i)=>recipeMilestone(i)).find(n=>!state.milestones.includes(n));
 if(level===undefined)return null;
 const through=completedThrough(data.completed??[]),start=level===6?0:level-12;
 return {recipe,level,remaining:Math.max(0,level-through),progress:Math.max(0,Math.min(level-start,through-start)),total:level-start};
}
export function recordCampaignWin(data){
 const g=data.game;if(!g||g.status!=='won'||g.dailyDate||g.mode==='relaxed')return data;
 const completed=[...new Set([...(data.completed??[]),g.level])].sort((a,b)=>a-b),through=completedThrough(completed);
 const recipes={unlocked:[...(data.recipes?.unlocked??[])],milestones:[...(data.recipes?.milestones??[])]};
 let recipeReward=g.recipeReward;
 for(let i=0;i<RECIPE_CARDS.length;i++){
  const milestone=recipeMilestone(i);if(milestone>through||recipes.milestones.includes(milestone))continue;
  recipes.milestones.push(milestone);const recipe=RECIPE_CARDS.find(r=>!recipes.unlocked.includes(r.id));
  if(recipe){recipes.unlocked.push(recipe.id);recipeReward=recipe.id;}
 }
 return {...data,completed,recipes,unlocked:Math.max(data.unlocked,g.level+1),best:Math.max(data.best,g.score),game:recipeReward?{...g,recipeReward}:g};
}
