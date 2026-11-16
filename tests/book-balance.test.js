import test from 'node:test';
import assert from 'node:assert/strict';
import * as book from '../dist/book.js';
import {defaultProgress} from '../dist/storage.js';
import {newGame} from '../dist/engine.js';
import {postcardMarkup,renderCollection} from '../dist/postcards.js';
const root=()=>({innerHTML:'',querySelectorAll:()=>[],querySelector:()=>({})});
test('level list marks earned stars and keeps recipe collection out',()=>{
 const data=defaultProgress(),r=root();data.completed=[1,2,3,4,5,6];data.unlocked=7;
 book.renderBook(r,data,0,()=>{},()=>{});
 assert.match(r.innerHTML,/Звезда уже получена/);assert.doesNotMatch(r.innerHTML,/Мои рецепты|recipe-shelf/);
 book.renderBook(r,data,1,()=>{},()=>{});assert.match(r.innerHTML,/1 ★ за победу/);
});
test('new food names and capped result counters stay meaningful',()=>{
 const g=newGame(19);g.collected[5]=100;assert.match(book.goalText(g),/Запеканк/);assert.doesNotMatch(book.goalMarkup(g),/undefined/);assert.match(book.resultGoalText(g),/18 из 18/);
});
test('postcards and collection use their saved artwork identities',()=>{
 assert.match(postcardMarkup('2026-11-15',12,false,12),/card-13\.jpg/);
 assert.match(postcardMarkup('2026-11-16',13,false,13),/card-14\.jpg/);
 const r=root();renderCollection(r,['2026-11-15'],0,()=>{},()=>{},()=>{},[20]);assert.match(r.innerHTML,/card-21\.jpg/);
});
