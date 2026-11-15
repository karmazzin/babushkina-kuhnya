import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {FOODS} from '../dist/foods.js';
import {RECIPE_CARDS} from '../dist/recipe-cards.js';
import {postcardInfo} from '../dist/postcards.js';
const read=path=>readFile(new URL('../dist/'+path,import.meta.url));
test('all 24 postcards have unique local artwork and matching offline entries',async()=>{
 const sw=String(await read('sw.js')),hashes=new Set(),titles=new Set();
 for(let i=0;i<24;i++){const info=postcardInfo(i),bytes=await read(info.image);assert.ok(bytes.length>50000);assert.ok(sw.includes('"'+info.image+'"'));hashes.add(createHash('sha256').update(bytes).digest('hex'));titles.add(info.title);}
 assert.equal(hashes.size,24);assert.equal(titles.size,24);
});
test('new food icons and recipe covers are local transparent PNGs available offline',async()=>{
 const sw=String(await read('sw.js')),css=String(await read('gameplay.css'));
 for(const path of [...FOODS,...RECIPE_CARDS].map(x=>x.image).filter(Boolean)){
  const bytes=await read(path);assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes[25],6,'RGBA image');assert.ok(sw.includes('"'+path+'"'));
 }
 for(const food of FOODS.filter(f=>f.image))assert.ok(css.includes(food.image));
});
