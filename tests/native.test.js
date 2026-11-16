import test from 'node:test';
import assert from 'node:assert/strict';
import {createNativeStorage} from '../dist/native-storage.js';
import {createNativeSharing} from '../dist/native-sharing.js';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('native startup loads the existing save and never writes on a read error',async()=>{
 let writes=0;const storage=await createNativeStorage({get:async()=>({value:'saved'}),set:async()=>writes++},'progress');
 assert.equal(storage.getItem('progress'),'saved');assert.equal(writes,0);
 await assert.rejects(createNativeStorage({get:async()=>{throw Error('unavailable');},set:async()=>writes++},'progress'),/unavailable/);assert.equal(writes,0);
});
test('native writes keep order, flush waits for durable completion, and restart reads the last save',async()=>{
 let disk=null,release;const writes=[];
 const preferences={get:async()=>({value:disk}),set:async({key,value})=>{assert.equal(key,'progress');writes.push(value);await new Promise(r=>release=r);disk=value;}};
 const storage=await createNativeStorage(preferences,'progress');
 storage.setItem('progress','first');storage.setItem('progress','second');
 assert.equal(storage.getItem('progress'),'second');let flushed=false;const pending=storage.flush().then(ok=>{flushed=true;return ok;});
 await tick();assert.deepEqual(writes,['first']);assert.equal(flushed,false);release();await tick();assert.deepEqual(writes,['first','second']);assert.equal(flushed,false);release();assert.equal(await pending,true);
 assert.equal((await createNativeStorage(preferences,'progress')).getItem('progress'),'second');
});
test('failed native write stays dirty, reports failure and can retry the latest snapshot',async()=>{
 let fail=true,disk='old';const states=[];
 const storage=await createNativeStorage({get:async()=>({value:disk}),set:async({value})=>{if(fail)throw Error('full');disk=value;}},'progress',state=>states.push(state));
 storage.setItem('progress','new');assert.equal(await storage.flush(),false);assert.equal(disk,'old');assert.equal(states.at(-1),'error');
 fail=false;assert.equal(await storage.flush(),true);assert.equal(disk,'new');assert.equal(states.at(-1),'saved');
});
test('a later successful save supersedes an earlier failure without losing its own completion',async()=>{
 let calls=0,disk=null;const storage=await createNativeStorage({get:async()=>({value:disk}),set:async({value})=>{if(++calls===1)throw Error('temporary');disk=value;}},'progress');
 storage.setItem('progress','first');storage.setItem('progress','second');assert.equal(await storage.flush(),true);assert.equal(disk,'second');
});
test('native postcard prepares a cache JPEG, shares only its URI and handles cancellation',async()=>{
 const written=[],sent=[];const files={writeFile:async p=>{written.push(p);return {uri:'file:///cache/card-01.jpg'};}};
 const sharing=createNativeSharing(files,{share:async p=>sent.push(p)});
 const file=new File([new Uint8Array([255,216,255])],'card-01.jpg',{type:'image/jpeg'});
 const uri=await sharing.prepare(file);assert.equal(uri,'file:///cache/card-01.jpg');assert.deepEqual(written,[{path:'postcards/card-01.jpg',data:'/9j/',directory:'CACHE',recursive:true}]);
 assert.equal(await sharing.share(uri),'shared');assert.deepEqual(sent,[{files:['file:///cache/card-01.jpg'],dialogTitle:'Поделиться открыткой'}]);
 assert.equal(await createNativeSharing(files,{share:async()=>{throw Error('Share canceled');}}).share(uri),'cancelled');
 assert.equal(await createNativeSharing(files,{share:async()=>{throw Error('No activity');}}).share(uri),'failed');
});
test('native sharing rejects paths outside the postcard cache',async()=>{
 const sharing=createNativeSharing({writeFile:async()=>{throw Error('should not write');}},{});
 await assert.rejects(sharing.prepare(new File(['x'],'../private.jpg',{type:'image/jpeg'})),/postcard/);
});

test('native storage persists recovery records and garden together, with retry after failed disk commit',async()=>{
 const {KEY,BACKUP_KEY,CHECKPOINT_KEY,defaultProgress,saveProgress,loadProgress}=await import('../dist/storage.js');
 const keys=[KEY,BACKUP_KEY,CHECKPOINT_KEY,KEY+':recovery-complete'];let disk={},fail=false;
 const preferences={get:async({key})=>({value:disk[key]??null}),setMany:async({values})=>{if(fail)throw Error('disk full');disk={...values};}};
 const storage=await createNativeStorage(preferences,keys);const progress=defaultProgress();progress.unlocked=3;progress.completed=[1,2];
 assert.equal(saveProgress(storage,progress),true);assert.equal(await storage.flush(),true);
 assert.equal(loadProgress(await createNativeStorage(preferences,keys)).data.unlocked,3);
 const before=JSON.stringify(disk);fail=true;progress.best=900;assert.equal(saveProgress(storage,progress),true);
 assert.equal(await storage.flush(),false);assert.equal(JSON.stringify(disk),before);
 fail=false;assert.equal(await storage.flush(),true);assert.equal(loadProgress(await createNativeStorage(preferences,keys)).data.best,900);
 assert.ok(disk[BACKUP_KEY]);assert.ok(disk[CHECKPOINT_KEY]);
});

test('native startup gate distinguishes recoverable progress from unreadable primary bytes',async()=>{
 const {KEY,BACKUP_KEY,defaultProgress,loadProgress}=await import('../dist/storage.js');
 const disk=new Map(),read={getItem:key=>disk.get(key)??null};
 assert.equal(loadProgress(read).unrecoverable,false);
 disk.set(KEY,'{broken');assert.equal(loadProgress(read).unrecoverable,true);
 const progress={...defaultProgress(),unlocked:4,completed:[1,2,3],best:900};
 disk.set(BACKUP_KEY,JSON.stringify(progress));const recovered=loadProgress(read);
 assert.equal(recovered.unrecoverable,false);assert.equal(recovered.data.unlocked,4);assert.ok(recovered.warning);
});
