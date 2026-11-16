import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {webcrypto,createHash} from 'node:crypto';
const root=new URL('../dist/',import.meta.url);
async function harness({fail=false,staleHttp=false}={}){
 const handlers={}, stores=new Map(), scope='https://example.test/kitchen/';let network=0,activations=0;
 const caches={open:async name=>{if(!stores.has(name))stores.set(name,new Map());const m=stores.get(name);return {addAll:async urls=>{if(fail)throw Error('download failed');for(const u of urls){const url=typeof u==='string'?u:u.url;m.set(url,new Response(staleHttp?(u.cache==='reload'?'fresh':'stale'):url));}},put:async(u,response)=>m.set(u,response.clone()),match:async u=>m.get(typeof u==='string'?u:u.url)?.clone(),keys:async()=>[...m.keys()].map(url=>({url}))};},keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)};
 const self={skipWaiting:async()=>{activations++;},registration:{scope},location:{origin:'https://example.test'},clients:{claim:async()=>{},matchAll:async()=>[]},addEventListener:(n,f)=>handlers[n]=f};
 let source=await fs.readFile(new URL('sw.js',root),'utf8');
 const original=JSON.parse(source.match(/const HASHES=([\s\S]*?);\n\/\/ END RELEASE/)[1]);
 const hashes=Object.fromEntries(Object.keys(original).map(path=>[path,createHash('sha256').update(staleHttp?'fresh':scope+path).digest('hex')]));
 source=source.replace(/const HASHES=[\s\S]*?;\n\/\/ END RELEASE/,`const HASHES=${JSON.stringify(hashes)};\n// END RELEASE`);
 let installing=false;
 const context=vm.createContext({self,caches,URL,Request,Response,crypto:webcrypto,AbortController,setTimeout,clearTimeout,
  fetch:async request=>{if(!installing){network++;throw Error('offline');}if(fail)throw Error('download failed');return new Response(staleHttp?(request.cache==='reload'?'fresh':'stale'):request.url);}});
 const helper=await fs.readFile(new URL('cache-install.js',root),'utf8');context.importScripts=()=>vm.runInContext(helper,context);
 vm.runInContext(source,context);
 const fire=async(name,extra={})=>{installing=name==='install';let p;handlers[name]({...extra,waitUntil:q=>p=q,respondWith:q=>p=q});return await p;};
 return {handlers,stores,scope,fire,network:()=>network,activations:()=>activations};
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
 const image=await h.fire('fetch',{request:{url:h.scope+'assets/foods.webp',method:'GET',mode:'cors'}});assert.equal(await image.text(),h.scope+'assets/foods.webp');assert.equal(h.network(),0);
});
test('failed resource download rejects installation',async()=>{const h=await harness({fail:true});await assert.rejects(h.fire('install'),/download failed/);});
test('readiness requires all cached files and activation preserves other apps caches',async()=>{
 const h=await harness();let reply;await h.fire('install');h.stores.set('unrelated',new Map());h.stores.set('babushkina-kuhnya-v0',new Map());await h.fire('activate');assert.ok(h.stores.has('unrelated'));assert.equal(h.stores.has('babushkina-kuhnya-v0'),true);
 await h.fire('message',{data:{type:'CHECK_OFFLINE'},ports:[{postMessage:v=>reply=v}]});assert.equal(reply.ready,true);
 [...h.stores.values()][0].delete(h.scope+'assets/foods.webp');await h.fire('message',{data:{type:'CHECK_OFFLINE'},ports:[{postMessage:v=>reply=v}]});assert.equal(reply.ready,false);
});
for(const track of ['porch-swing','easy-lemon','summer-day','carefree'])test(`cached ${track} supports byte ranges required by mobile media players`,async()=>{
 const h=await harness();await h.fire('install');const url=h.scope+`assets/audio/${track}.m4a`;
 const response=await h.fire('fetch',{request:{url,method:'GET',mode:'cors',headers:{get:()=> 'bytes=2-8'}}});
 assert.equal(response.status,206);assert.equal(await response.text(),url.slice(2,9));assert.equal(response.headers.get('Content-Range'),`bytes 2-8/${url.length}`);assert.equal(h.network(),0);
 const invalid=await h.fire('fetch',{request:{url,method:'GET',mode:'cors',headers:{get:()=> 'bytes=99999-'}}});assert.equal(invalid.status,416);
});

test('worker activates early only on explicit update request',async()=>{
 const h=await harness();await h.fire('install');assert.equal(h.activations(),0);
 await h.fire('message',{data:{type:'ACTIVATE_UPDATE'}});assert.equal(h.activations(),1);
});

test('update bypasses fresh HTTP cache entries from the previous release',async()=>{const h=await harness({staleHttp:true});await h.fire('install');const response=await h.fire('fetch',{request:{url:h.scope+'app.js',method:'GET',mode:'cors'}});assert.equal(await response.text(),'fresh');});
