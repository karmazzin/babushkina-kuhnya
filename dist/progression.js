import {RECIPE_CARDS,recipeMilestone} from './recipe-cards.js';
export {recipeMilestone} from './recipe-cards.js';
export function completedThrough(completed){const done=new Set(completed);let n=0;while(done.has(n+1))n++;return n;}
export function nextRecipeReward(data){
 const index=data.recipes.unlocked.length;if(index===RECIPE_CARDS.length)return null;
 const level=recipeMilestone(index),through=completedThrough(data.completed),start=index===0?0:level-12;
 return {recipe:RECIPE_CARDS[index],level,remaining:Math.max(0,level-through),progress:Math.max(0,Math.min(level-start,through-start)),total:level-start};
}
export function recordCampaignWin(data){
 const g=data.game;if(!g||g.status!=='won'||g.dailyDate||g.mode==='relaxed')return data;
 const completed=[...new Set([...data.completed,g.level])].sort((a,b)=>a-b),through=completedThrough(completed);
 const recipes={unlocked:[...data.recipes.unlocked],milestones:[...data.recipes.milestones]};
 let recipeReward=g.recipeReward;
 while(recipes.unlocked.length<RECIPE_CARDS.length&&recipeMilestone(recipes.unlocked.length)<=through){
  const index=recipes.unlocked.length;recipes.milestones.push(recipeMilestone(index));recipeReward=RECIPE_CARDS[index].id;recipes.unlocked.push(recipeReward);
 }
 return {...data,completed,recipes,unlocked:Math.max(data.unlocked,g.level+1),best:Math.max(data.best,g.score),game:recipeReward?{...g,recipeReward}:g};
}
