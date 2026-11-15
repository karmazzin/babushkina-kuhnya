import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url);
async function harness({fail=false}={}){
 const handlers={}, stores=new Map(), scope='https://example.test/kitchen/';let network=0;
 const caches={open:async name=>{if(!stores.has(name))stores.set(name,new Map());const m=stores.get(name);return {addAll:async urls=>{if(fail)throw Error('download failed');for(const u of urls)m.set(u,new Response(u));},match:async u=>m.get(typeof u==='string'?u:u.url),keys:async()=>[...m.keys()].map(url=>({url}))};},keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)};
 const self={registration:{scope},location:{origin:'https://example.test'},clients:{claim:async()=>{}},addEventListener:(n,f)=>handlers[n]=f};
 vm.runInNewContext(await fs.readFile(new URL('sw.js',root),'utf8'),{self,caches,URL,Response,fetch:async()=>{network++;throw Error('offline');}});
 const fire=async(name,extra={})=>{let p;handlers[name]({...extra,waitUntil:q=>p=q,respondWith:q=>p=q});return await p;};
 return {handlers,stores,scope,fire,network:()=>network};
}
test('installation caches every shipped runtime file, including icons and start URL',async()=>{
 const h=await harness();await h.fire('install');const urls=[...h.stores.values()][0];
 async function files(dir,prefix=''){const result=[];for(const f of await fs.readdir(dir,{withFileTypes:true})){if(f.isDirectory())result.push(...await files(new URL(f.name+'/',dir),prefix+f.name+'/'));else if(f.name!=='sw.js')result.push(prefix+f.name);}return result;}
 for(const f of await files(root))assert.ok(urls.has(h.scope+f),`missing ${f}`);assert.ok(urls.has(h.scope));
 for(const url of urls.keys())if(url!==h.scope)await fs.access(new URL(url.slice(h.scope.length),root));
});
test('offline navigation and assets work without any network call',async()=>{
 const h=await harness();await h.fire('install');
 const page=await h.fire('fetch',{request:{url:h.scope+'?installed=1',method:'GET',mode:'navigate'}});assert.equal(await page.text(),h.scope+'index.html');
 const image=await h.fire('fetch',{request:{url:h.scope+'assets/foods.png',method:'GET',mode:'cors'}});assert.equal(await image.text(),h.scope+'assets/foods.png');assert.equal(h.network(),0);
});
test('failed resource download rejects installation',async()=>{const h=await harness({fail:true});await assert.rejects(h.fire('install'),/download failed/);});
test('readiness requires all cached files and activation preserves other apps caches',async()=>{
 const h=await harness();let reply;await h.fire('install');h.stores.set('unrelated',new Map());h.stores.set('babushkina-kuhnya-v0',new Map());await h.fire('activate');assert.ok(h.stores.has('unrelated'));assert.equal(h.stores.has('babushkina-kuhnya-v0'),false);
 await h.fire('message',{data:{type:'CHECK_OFFLINE'},ports:[{postMessage:v=>reply=v}]});assert.equal(reply.ready,true);
 [...h.stores.values()][0].delete(h.scope+'assets/foods.png');await h.fire('message',{data:{type:'CHECK_OFFLINE'},ports:[{postMessage:v=>reply=v}]});assert.equal(reply.ready,false);
});
test('cached audio supports byte ranges required by mobile media players',async()=>{
 const h=await harness();await h.fire('install');const url=h.scope+'assets/audio/porch-swing.m4a';
 const response=await h.fire('fetch',{request:{url,method:'GET',mode:'cors',headers:{get:()=> 'bytes=2-8'}}});
 assert.equal(response.status,206);assert.equal(await response.text(),url.slice(2,9));assert.equal(response.headers.get('Content-Range'),`bytes 2-8/${url.length}`);assert.equal(h.network(),0);
 const invalid=await h.fire('fetch',{request:{url,method:'GET',mode:'cors',headers:{get:()=> 'bytes=99999-'}}});assert.equal(invalid.status,416);
});
