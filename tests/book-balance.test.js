import test from 'node:test';
import assert from 'node:assert/strict';
import * as book from '../dist/book.js';
import {defaultProgress} from '../dist/storage.js';
import {newGame} from '../dist/engine.js';
import {RECIPE_CARDS} from '../dist/recipe-cards.js';
import {postcardMarkup,renderCollection} from '../dist/postcards.js';
const root=()=>({innerHTML:'',querySelectorAll:()=>[],querySelector:()=>({})});
test('level book shows the next actual milestone and separate recipe collection',()=>{
 const data=defaultProgress(),r=root();data.completed=[1,2,3,4,5,6];data.recipes={unlocked:['blini'],milestones:[6]};data.unlocked=7;
 book.renderBook(r,data,1,()=>{},()=>{},()=>{},()=>{});
 assert.match(r.innerHTML,/18/);assert.match(r.innerHTML,/Мои рецепты/);assert.doesNotMatch(r.innerHTML,/после 6 уровней/);
});
test('recipe pages contain all ingredients and steps, with a bounded amount per page',()=>{
 assert.equal(typeof book.recipePages,'function');
 for(const recipe of RECIPE_CARDS){const pages=book.recipePages(recipe),all=pages.join(' ');assert.match(pages[0],new RegExp(recipe.servings));assert.match(pages[0],/recipe-illustration/);for(const text of [...recipe.ingredients,...recipe.steps])assert.ok(all.includes(text));assert.ok(pages.every(p=>p.length<700));}
});
test('new food names and capped result counters stay meaningful',()=>{
 const g=newGame(19);g.collected[5]=100;assert.match(book.goalText(g),/Запеканк/);assert.doesNotMatch(book.goalMarkup(g),/undefined/);assert.match(book.resultGoalText(g),/18 из 18/);
});
test('postcards and collection use their saved artwork identities',()=>{
 assert.match(postcardMarkup('2026-11-15',12,false,12),/card-13\.jpg/);
 assert.match(postcardMarkup('2026-11-16',13,false,13),/card-14\.jpg/);
 const r=root();renderCollection(r,['2026-11-15'],0,()=>{},()=>{},()=>{},[20]);assert.match(r.innerHTML,/card-21\.jpg/);
});
