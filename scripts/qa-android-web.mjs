// Browser integration smoke test. Native APIs are simulated at the Capacitor bridge;
// this does NOT replace APK testing on Android hardware.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url)),shots=resolve(root,'build/qa-android');await mkdir(shots,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.m4a':'audio/mp4','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const folder=resolve(root,pathname.startsWith('/pwa/')?'dist':'build/android-web');let rel=pathname.replace(/^\/(pwa|native)\//,'');if(!rel||rel.endsWith('/'))rel+='index.html';const path=resolve(folder,rel);if(!path.startsWith(folder+sep))throw Error('path');res.setHeader('Content-Type',mime[extname(path)]??'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 for(const [name,width,height] of [['pixel',393,851],['small',320,568],['landscape',740,360]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:1});
  await context.addInitScript(()=>{
   window.androidBridge={};window.nativeEvents={};window.nativeShares=[];window.nativeWrites=[];window.nativeMinimized=0;
   window.Capacitor={PluginHeaders:[['KitchenSave',['get','set','setMany']],['SystemBars',['setStyle']],['Filesystem',['writeFile']],['Share',['share']],['App',['minimizeApp']]].map(([name,methods])=>({name,methods:[...methods.map(name=>({name,rtype:'promise'})),{name:'addListener',rtype:'callback'},{name:'removeListener',rtype:'promise'}]})),
    nativeCallback:(_plugin,_method,options,callback)=>{window.nativeEvents[options.eventName]=callback;return options.eventName;},
    nativePromise:async(plugin,method,options)=>{
     if(plugin==='KitchenSave'){
      const slot=key=>key==='babushkina-kuhnya:progress'?'qa-save':'qa-save:'+key;
      if(method==='get'){if(sessionStorage.failRead)throw Error('read failure');return {value:localStorage.getItem(slot(options.key))};}
      if(sessionStorage.failWrite)throw Error('write failure');
      for(const [key,value] of Object.entries(options.values)){if(value===null)localStorage.removeItem(slot(key));else localStorage.setItem(slot(key),value);}
      window.nativeWrites.push(options.values);return;
     }
     if(plugin==='Filesystem')return {uri:'file:///cache/'+options.path};
     if(plugin==='Share'){window.nativeShares.push(options);return {};}
     if(plugin==='App'&&method==='minimizeApp')window.nativeMinimized++;
    }};
  });
  const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(origin+'/native/');await page.waitForFunction(()=>document.getElementById('app').inert===false&&document.getElementById('install').hidden);
  await page.waitForLoadState('networkidle');await page.screenshot({path:resolve(shots,name+'-menu.png')});
  const menuBounds=await page.locator('#menu button:visible').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {id:n.id,x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
  for(const b of menuBounds)assert.ok(b.x>=0&&b.y>=0&&b.right<=width+1&&b.bottom<=height+1,JSON.stringify({name,b}));
  await page.locator('#continue').tap();await page.waitForFunction(()=>localStorage.getItem('qa-save'));
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-save')).game);
  const move=await page.evaluate(async()=>{const {legalMoves}=await import('./engine.js');return legalMoves(JSON.parse(localStorage.getItem('qa-save')).game.board)[0];});
  await page.locator('#board .tile').nth(move[0]).tap();await page.locator('#board .tile').nth(move[1]).tap();
  await page.waitForFunction(n=>JSON.parse(localStorage.getItem('qa-save')).game.actions>n,before.actions);
  // Simulated lifecycle interruption during the cascade and system return to menu.
  await page.evaluate(()=>{window.nativeEvents.appStateChange({isActive:false});window.nativeEvents.appStateChange({isActive:true});window.nativeEvents.backButton({});});
  await page.locator('#continue').tap();await page.waitForFunction(()=>!document.getElementById('game').hidden);
  const stored=await page.evaluate(()=>localStorage.getItem('qa-save'));await page.reload();await page.waitForFunction(()=>!document.getElementById('app').inert);await page.locator('#continue').tap();
  assert.equal(await page.evaluate(()=>localStorage.getItem('qa-save')),stored);
  const boxes=await page.evaluate(()=>['board','back','rolling','kettle','recipe-goals'].map(id=>{const r=document.getElementById(id).getBoundingClientRect();return {id,x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
  for(const b of boxes)assert.ok(b.x>=0&&b.y>=0&&b.right<=width+1&&b.bottom<=height+1,JSON.stringify({name,b}));
  await page.waitForLoadState('networkidle');await page.screenshot({path:resolve(shots,name+'-game.png')});
  await page.locator('#sound').tap();await page.locator('#reset').tap();await page.evaluate(()=>window.nativeEvents.backButton({}));assert.equal(await page.locator('#dialog-title').textContent(),'Звуки и уют');await page.evaluate(()=>window.nativeEvents.backButton({}));await page.locator('#rolling').tap();await page.evaluate(()=>window.nativeEvents.backButton({}));assert.equal(await page.locator('#helper-cancel').isVisible(),false);
  // Exercise the new garden through the native multi-record storage and Android Back.
  await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('qa-save'));d.completed=[1,2];d.unlocked=3;localStorage.setItem('qa-save',JSON.stringify(d));});
  await page.reload();await page.waitForFunction(()=>!document.getElementById('app').inert);await page.locator('#menu-garden').tap();
  await page.locator('[data-plot="0"]').tap();await page.locator('[data-item="vegetables"]').tap();
  await page.evaluate(()=>sessionStorage.failWrite='1');await page.getByRole('button',{name:'Посадить · 1 ★',exact:true}).tap();
  await page.getByRole('heading',{name:'Не удалось сохранить',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-save')).garden.plots.length),0);
  await page.evaluate(()=>sessionStorage.removeItem('failWrite'));await page.getByRole('button',{name:'Повторить сохранение',exact:true}).tap();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('qa-save')).garden.plots.length===1&&document.getElementById('storage-warning').hidden);
  const gardenSave=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('qa-save')).garden));
  await page.screenshot({path:resolve(shots,name+'-garden.png')});
  await page.evaluate(()=>window.nativeEvents.backButton({}));await page.locator('#continue').tap();
  const nextPair=await page.evaluate(async()=>{const {legalMoves}=await import('./engine.js');return legalMoves(JSON.parse(localStorage.getItem('qa-save')).game.board)[0];});
  const actionBefore=await page.evaluate(()=>JSON.parse(localStorage.getItem('qa-save')).game.actions);
  for(const cell of nextPair)await page.locator('#board .tile').nth(cell).tap();
  await page.waitForFunction(n=>JSON.parse(localStorage.getItem('qa-save')).game.actions>n,actionBefore);
  await page.reload();await page.waitForFunction(()=>!document.getElementById('app').inert);assert.equal(await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('qa-save')).garden)),gardenSave);
  // Seed an earned card only to exercise real collection/share UI.
  await page.evaluate(()=>{const d=JSON.parse(localStorage.getItem('qa-save'));d.daily.cards=['2026-11-16'];d.daily.art=[0];localStorage.setItem('qa-save',JSON.stringify(d));});
  await page.reload();await page.waitForFunction(()=>!document.getElementById('app').inert);await page.locator('#open-collection').tap();await page.locator('[data-card]').first().tap();await page.locator('[data-share-card]').tap();await page.waitForFunction(()=>window.nativeShares.length===1);assert.deepEqual(await page.evaluate(()=>window.nativeShares[0]),{files:['file:///cache/postcards/card-01.jpg'],dialogTitle:'Поделиться открыткой'});
  assert.equal(await page.locator('[download]').isVisible(),false);
  assert.equal((await page.evaluate(()=>navigator.serviceWorker.getRegistrations())).length,0);assert.equal(requests.some(url=>url.endsWith('/sw.js')),false);assert.equal(requests.some(url=>!url.startsWith(origin)),false);
  // Read failure must stop startup, preserve bytes and provide a usable retry.
  const saved=await page.evaluate(()=>localStorage.getItem('qa-save'));await page.evaluate(()=>sessionStorage.failRead='1');await page.reload();await page.getByRole('button',{name:'Попробовать ещё раз'}).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('qa-save')),saved);await page.evaluate(()=>sessionStorage.removeItem('failRead'));await page.getByRole('button',{name:'Попробовать ещё раз'}).tap();await page.locator('#continue').tap();
  assert.deepEqual(errors,[]);console.log(`${name}: play, interrupt, resume, Back, share, startup failure, layout PASS`);await context.close();
 }
 const context=await browser.newContext({viewport:{width:393,height:851},hasTouch:true,isMobile:true});const page=await context.newPage();await page.goto(origin+'/pwa/');await page.locator('#continue').tap();await page.waitForFunction(()=>document.getElementById('offline').textContent==='Готово к игре без интернета');await page.reload();await context.setOffline(true);await page.reload();await page.locator('#continue').tap();await page.locator('#board .tile').first().tap();assert.equal(await page.locator('#board .tile').first().getAttribute('aria-pressed'),'true');console.log('PWA: nested path, worker install, offline reload and next useful action PASS');await context.close();
}finally{await browser.close();await new Promise(r=>server.close(r));}
