import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {FOODS} from '../dist/foods.js';
import {postcardInfo} from '../dist/postcards.js';
const read=path=>readFile(new URL('../dist/'+path,import.meta.url));
test('all 24 postcards have unique local artwork and matching offline entries',async()=>{
 const sw=String(await read('sw.js')),hashes=new Set(),titles=new Set();
 for(let i=0;i<24;i++){const info=postcardInfo(i),bytes=await read(info.image);assert.ok(bytes.length>50000);assert.ok(sw.includes('"'+info.image+'"'));hashes.add(createHash('sha256').update(bytes).digest('hex'));titles.add(info.title);}
 assert.equal(hashes.size,24);assert.equal(titles.size,24);
});
test('new food icons are local transparent PNGs available offline',async()=>{
 const sw=String(await read('sw.js')),css=String(await read('gameplay.css'));
 for(const path of FOODS.map(x=>x.image).filter(Boolean)){
  const bytes=await read(path);assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.equal(bytes[25],6,'RGBA image');assert.ok(sw.includes('"'+path+'"'));
 }
 for(const food of FOODS.filter(f=>f.image))assert.ok(css.includes(food.image));
});

test('garden art is local and cached; culinary recipe catalogue is removed',async()=>{const sw=String(await read('sw.js'));for(const path of ['assets/garden/yard.png','assets/garden/objects.png']){assert.ok((await read(path)).length>50000);assert.ok(sw.includes('"'+path+'"'));}assert.ok(!sw.includes('recipe-cards.js'));assert.ok(!sw.includes('assets/recipes/'));});
