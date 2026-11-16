import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import {webcrypto,createHash} from 'node:crypto';
const digest=s=>createHash('sha256').update(s).digest('hex');
async function harness({old={},network={},failures=0,fetcher,timers={setTimeout,clearTimeout}}={}){
 const source=await fs.readFile(new URL('../dist/cache-install.js',import.meta.url),'utf8');
 const stores=new Map([['babushkina-kuhnya-old',new Map(Object.entries(old).map(([p,s])=>['https://test/k/'+p,new Response(s)]))]]);let requests=0;
 const caches={keys:async()=>[...stores.keys()],open:async name=>{if(!stores.has(name))stores.set(name,new Map());const m=stores.get(name);return {match:async key=>m.get(key)?.clone(),put:async(key,value)=>m.set(key,value.clone())};}};
 const self={};vm.runInNewContext(source,{self,caches,crypto:webcrypto,URL,Request,Response,AbortController,Headers,Uint8Array,...timers,fetch:async req=>{requests++;assert.equal(req.cache,'reload');if(fetcher)return fetcher(req);if(requests<=failures)throw Error('network');const p=new URL(req.url).pathname.slice(3);return new Response(network[p]??'wrong');}});
 return {install:(hashes,progress)=>self.installRelease({name:'babushkina-kuhnya-new',root:'https://test/k/',hashes,progress}),stores,requests:()=>requests};
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

function clock(){
 let time=0,id=0;const pending=new Map();
 return {now:()=>time,timers:{Date:{now:()=>time},setTimeout(fn,delay){pending.set(++id,{fn,at:time+delay});return id;},clearTimeout(id){pending.delete(id);}},
  async tick(ms){time+=ms;for(const [id,t] of [...pending])if(t.at<=time){pending.delete(id);t.fn();}await new Promise(setImmediate);},size:()=>pending.size};
}
test('music can take longer than 25 seconds while bytes keep arriving, without restarting',async()=>{
 const c=clock();let stream,aborted=0;
 const h=await harness({timers:c.timers,fetcher:req=>new Response(new ReadableStream({start(controller){stream=controller;req.signal.addEventListener('abort',()=>{aborted++;controller.error(Error('aborted'));});}}))});
 const beats=[];const pending=h.install({'index.html':digest('abcd')},done=>{if(!done)beats.push(c.now());});pending.catch(()=>{});
 await new Promise(setImmediate);
 for(const char of 'abcd'){await c.tick(20000);stream.enqueue(new TextEncoder().encode(char));await new Promise(setImmediate);}
 stream.close();await pending;
 assert.equal(aborted,0);assert.equal(h.requests(),1);assert.equal(c.size(),0);
 assert.deepEqual(beats,[20000,40000,60000,80000]);
 assert.equal(await h.stores.get('babushkina-kuhnya-new').get('https://test/k/index.html').text(),'abcd');
});
test('a stalled body is aborted and retried; partial bytes never enter the cache',async()=>{
 const c=clock();let aborted=0;
 const h=await harness({timers:c.timers,fetcher:req=>new Response(new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('partial'));req.signal.addEventListener('abort',()=>{aborted++;controller.error(Error('stalled'));});}}))});
 const pending=h.install({'index.html':digest('complete')});const rejected=assert.rejects(pending,/stalled/);
 await new Promise(setImmediate);
 for(let i=0;i<3;i++)await c.tick(60001);
 await rejected;assert.equal(aborted,3);assert.equal(h.requests(),3);assert.equal(c.size(),0);
 assert.equal(h.stores.get('babushkina-kuhnya-new').size,0);
});
test('a connection with no response headers is bounded and retries',async()=>{
 const c=clock();const h=await harness({timers:c.timers,fetcher:req=>new Promise((resolve,reject)=>req.signal.addEventListener('abort',()=>reject(Error('no headers'))))});
 const pending=h.install({'index.html':digest('page')});const rejected=assert.rejects(pending,/no headers/);
 await new Promise(setImmediate);for(let i=0;i<3;i++)await c.tick(60001);
 await rejected;assert.equal(h.requests(),3);assert.equal(c.size(),0);assert.equal(h.stores.get('babushkina-kuhnya-new').size,0);
});
