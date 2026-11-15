import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import {webcrypto,createHash} from 'node:crypto';
const digest=s=>createHash('sha256').update(s).digest('hex');
async function harness({old={},network={},failures=0}={}){
 const source=await fs.readFile(new URL('../dist/cache-install.js',import.meta.url),'utf8');
 const stores=new Map([['babushkina-kuhnya-old',new Map(Object.entries(old).map(([p,s])=>['https://test/k/'+p,new Response(s)]))]]);let requests=0;
 const caches={keys:async()=>[...stores.keys()],open:async name=>{if(!stores.has(name))stores.set(name,new Map());const m=stores.get(name);return {match:async key=>m.get(key)?.clone(),put:async(key,value)=>m.set(key,value.clone())};}};
 const self={};vm.runInNewContext(source,{self,caches,crypto:webcrypto,URL,Request,Response,AbortController,setTimeout,clearTimeout,fetch:async req=>{requests++;assert.equal(req.cache,'reload');if(requests<=failures)throw Error('network');const p=new URL(req.url).pathname.slice(3);return new Response(network[p]??'wrong');}});
 return {install:hashes=>self.installRelease({name:'babushkina-kuhnya-new',root:'https://test/k/',hashes}),stores,requests:()=>requests};
}
test('unchanged files are verified and reused even from the previous installer cache',async()=>{
 const h=await harness({old:{'index.html':'old','song.m4a':'music'},network:{'index.html':'new'}});
 await h.install({'index.html':digest('new'),'song.m4a':digest('music')});assert.equal(h.requests(),1);
 assert.equal(await h.stores.get('babushkina-kuhnya-new').get('https://test/k/').text(),'new');
 assert.equal(await h.stores.get('babushkina-kuhnya-old').get('https://test/k/index.html').text(),'old');
});
test('interrupted download retries, and a later install resumes verified partial files',async()=>{
 const h=await harness({network:{'index.html':'page'},failures:1});await h.install({'index.html':digest('page')});assert.equal(h.requests(),2);
 await h.install({'index.html':digest('page')});assert.equal(h.requests(),2);
});
test('incorrect or partial releases cannot install successfully',async()=>{
 const h=await harness({old:{'index.html':'old'},network:{'index.html':'wrong'}});
 await assert.rejects(h.install({'index.html':digest('new')}),/integrity/);assert.equal(h.requests(),3);
 assert.equal(h.stores.get('babushkina-kuhnya-new').has('https://test/k/'),false);
 assert.equal(await h.stores.get('babushkina-kuhnya-old').get('https://test/k/index.html').text(),'old');
});
