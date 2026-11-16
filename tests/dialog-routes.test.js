import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import * as engine from '../dist/engine.js';
import * as storage from '../dist/storage.js';
import * as book from '../dist/book.js';
import * as recipes from '../dist/recipes.js';
import * as daily from '../dist/daily.js';
import * as progression from '../dist/progression.js';
import * as gardenEconomy from '../dist/garden.js';
import * as relaxed from '../dist/relaxed.js';
import * as pacing from '../dist/pacing.js';
import * as tea from '../dist/tea.js';
import {platform as webPlatform} from '../dist/platform.js';
import {FOODS} from '../dist/foods.js';
import {postcardMarkup} from '../dist/postcards.js';
import {createDialogControls} from '../dist/dialog.js';
const source=(await fs.readFile(new URL('../dist/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
class Node extends EventTarget{
 constructor(){super();this.hidden=false;this.open=false;this.children=[];this.classList={add(){},remove(){},toggle(){}};this.dataset={};this.style={};this.attrs={};}
 get firstElementChild(){return this.child??=new Node();}
 append(n){this.children.push(n);}replaceChildren(...n){this.children=n;}getAnimations(){return [];}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}getAttribute(k){return this.attrs[k];}hasPointerCapture(){return false;}close(){this.open=false;}showModal(){this.open=true;}focus(){}querySelectorAll(){return [];}querySelector(){return new Node();}
}
function harness(native=false){
 const platform={...webPlatform,native};
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
 const saved=new Map();const localStorage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)};
 if(native)platform.storage={...localStorage,flush:async()=>true};
 const document={getElementById:get,createElement:()=>new Node(),addEventListener(){},body:new Node(),hidden:false};
 const context=vm.createContext({platform,Event,crypto:globalThis.crypto,...engine,...storage,...book,...recipes,...daily,...progression,...gardenEconomy,...relaxed,...pacing,...tea,FOODS,postcardMarkup,bindPostcardSharing(){},renderCollection(root,data,page,onOpen){root.onOpen=onOpen;},createDialogControls,renderGarden(){},renderBook(){},gardenSprite(){return "";},createAudio:()=>({configure(){},unlock(){},visibility(){},effect(){}}),document,window:{localStorage,addEventListener(){},isSecureContext:false,open(){}},navigator:{},matchMedia:()=>({matches:false}),sessionStorage:{getItem:()=>null,removeItem(){}},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,console});
 vm.runInContext(source,context);
 const run=s=>vm.runInContext(s,context);
 const buttons=()=>get('dialog-actions').children.map(b=>b.textContent);
 return {get,run,buttons,click(text){const b=get('dialog-actions').children.find(x=>x.textContent===text);assert.ok(b,`Missing ${text}: ${buttons()}`);b.onclick();},escape(){get('dialog').dispatchEvent(new Event('cancel',{cancelable:true}));},start(){run('start()');},playable(){assert.equal(get('game').hidden,false);assert.equal(get('dialog').open,false);run('choose(0)');assert.equal(run('selected'),0);run('choose(0)');}};
}
for(const escape of [false,true]){
 const exit=(h,text)=>escape?h.escape():h.click(text),suffix=escape?'Escape':'button';
 for(let page=0;page<7;page++)test(`help page ${page+1}: ${suffix} resumes playable game`,()=>{const h=harness();h.start();h.run(`help(${page})`);exit(h,'Продолжить игру');h.playable();});
 test(`settings and nested reset: ${suffix} returns one step`,()=>{const h=harness();h.start();h.run('settings()');h.get('reset').onclick();exit(h,'Отмена');assert.equal(h.get('dialog-title').textContent,'Звуки и уют');exit(h,'Продолжить игру');h.playable();});
 for(let page=0;page<2;page++)test(`credits ${page}: ${suffix} goes to settings`,()=>{const h=harness();h.start();h.run(`credits(${page})`);exit(h,'Назад к настройкам');assert.equal(h.get('dialog-title').textContent,'Звуки и уют');exit(h,'Продолжить игру');h.playable();});
 for(const status of ['won','lost'])test(`result ${status}: ${suffix} has a usable destination`,()=>{const h=harness();h.start();h.run(`data.game.status='${status}';outcome()`);exit(h,status==='won'?'В огород':'В главное меню');assert.equal(h.get(status==='won'?'garden':'menu').hidden,false);h.run('start()');h.playable();});
 test(`installation instructions: ${suffix} returns to menu`,async()=>{const h=harness();h.run('menu()');await h.run('install()');exit(h,'Назад');assert.equal(h.get('menu').hidden,false);assert.equal(h.get('dialog').open,false);h.start();h.playable();});
}
test('reset route remains usable',async()=>{const h=harness();h.start();h.run('settings()');h.get('reset').onclick();h.click('Да, сбросить');assert.equal(h.get('menu').hidden,false);assert.equal(h.run('data.game'),null);h.start();h.playable();});
test('help forward buttons reach the final return',()=>{const h=harness();h.start();h.run('help()');for(let i=0;i<6;i++)h.click('Дальше →');assert.deepEqual(h.buttons(),['Продолжить игру']);h.click('Продолжить игру');h.playable();});
for(const status of ['won','lost'])test(`result ${status}: primary action opens a playable next/retry game`,()=>{const h=harness();h.start();h.run(`data.game.status='${status}';outcome()`);h.click(status==='won'?'Следующий уровень':'Попробовать ещё');assert.equal(h.run('data.game.level'),status==='won'?2:1);h.playable();});
test('credits source keeps a route back after opening the source',()=>{const h=harness();h.start();for(let page=0;page<2;page++){h.run(`credits(${page})`);h.click('Источник и лицензия ↗');h.click('Назад к настройкам');h.click('Продолжить игру');h.playable();}});

for(const escape of [false,true]){
 const exit=(h,text)=>escape?h.escape():h.click(text),name=escape?'Escape':'button';
 for(const status of ['won','lost'])test(`daily ${status}: ${name} exits without a dead board or lost campaign`,()=>{const h=harness();h.start();const regular=h.run('JSON.stringify(data.game)');h.run(`beginDaily();data.daily.game.status='${status}';dailyOutcome()`);exit(h,status==='won'?'В коллекцию':'В главное меню');assert.equal(h.get(status==='won'?'collection':'menu').hidden,false);assert.equal(h.run('JSON.stringify(data.game)'),regular);h.run("openGame('regular')");h.playable();});
 for(const offer of ['previous','completed'])test(`daily ${offer}: ${name} cancels to menu without replacing either game`,()=>{const h=harness();h.start();h.run(offer==='previous'?"data.daily.game=newDailyGame('2020-01-01')":"data.daily.cards=[localDay()]");const before=h.run('JSON.stringify(data)');h.run('menu();requestDaily()');exit(h,'В меню');assert.equal(h.get('menu').hidden,false);assert.equal(h.run('JSON.stringify(data)'),before);h.run("openGame('regular')");h.playable();});
 test(`postcard: ${name} returns to collection`,()=>{const h=harness();h.start();h.run('data.daily.cards=[localDay()];collection()');h.get('collection-content').onOpen(0);exit(h,'К коллекции');assert.equal(h.get('collection').hidden,false);assert.equal(h.get('dialog').open,false);h.run("openGame('regular')");h.playable();});
}
test('daily retry, old-day continuation and today replacement remain playable',()=>{const h=harness();h.start();const regular=h.run('JSON.stringify(data.game)');h.run("beginDaily('2020-01-01');menu();requestDaily()");h.click('Продолжить начатое');h.playable();assert.equal(h.run('data.daily.game.dailyDate'),'2020-01-01');h.run('menu();requestDaily()');h.click('Сегодняшнее угощение');assert.equal(h.run('data.daily.game.dailyDate'),daily.localDay());h.playable();h.run("data.daily.game.status='lost';dailyOutcome()");h.click('Попробовать ещё');h.playable();assert.equal(h.run('JSON.stringify(data.game)'),regular);});
test('completed daily offers replay or collection; old-day victory opens today',()=>{const h=harness();h.run('data.daily.cards=[localDay()];requestDaily()');h.click('Мои открытки');assert.equal(h.get('collection').hidden,false);h.run('menu();requestDaily()');h.click('Сыграть ещё');h.playable();h.run("beginDaily('2020-01-01');data.daily.game.status='won';dailyOutcome()");h.click('Сегодняшнее угощение');assert.equal(h.get('dialog-title').textContent,'Открытка уже у вас');h.click('В меню');assert.equal(h.get('menu').hidden,false);});
test('today daily victory has an explicit main-menu action',()=>{const h=harness();h.run("beginDaily();data.daily.game.status='won';dailyOutcome()");h.click('В главное меню');assert.equal(h.get('menu').hidden,false);});

test('remote save during a turn is deferred until the turn finishes',()=>{
 const h=harness();h.start();h.run('busy=true;pendingStorage=true;syncOtherTab()');
 assert.equal(h.run('busy'),true);assert.equal(h.get('game').hidden,false);assert.equal(h.run('pendingStorage'),true);
 h.run('busy=false;syncOtherTab()');assert.equal(h.run('pendingStorage'),false);assert.equal(h.get('menu').hidden,false);
});
test('failed local save is not discarded by a remote-tab event',()=>{
 const h=harness();h.start();h.run('saveDirty=true;pendingStorage=true;syncOtherTab()');
 assert.equal(h.get('game').hidden,false);assert.equal(h.run('pendingStorage'),true);
});
test('leaving the board during a cascade consumes a queued remote save before next actions',()=>{
 const h=harness();h.start();h.run('busy=true;pendingStorage=true;menu()');
 assert.equal(h.run('busy'),false);assert.equal(h.run('pendingStorage'),false);assert.equal(h.get('menu').hidden,false);
});
test('a local action cannot overwrite a newer save before its storage event is delivered',()=>{
 const h=harness();h.start();h.run("storage.setItem(KEY,JSON.stringify({...data,best:999}));data.best=100;persist()");
 assert.equal(h.run('loadProgress(storage).data.best'),999);assert.equal(h.run('saveDirty'),true);
});

for(const mode of ['regular','daily','relaxed'])test(`${mode}: independent saved game resumes after menu`,()=>{
 const h=harness();h.start();const before=h.run('JSON.stringify(data.game)');
 if(mode==='daily')h.run('beginDaily()');if(mode==='relaxed')h.run('requestRelaxed()');
 const active=h.run('JSON.stringify(activeGame())');h.run(`menu();openGame('${mode}')`);h.playable();assert.equal(h.run('JSON.stringify(activeGame())'),active);
 if(mode!=='regular')assert.equal(h.run('JSON.stringify(data.game)'),before);
 if(mode==='relaxed'){assert.equal(h.get('moves').textContent,'∞');assert.equal(h.run('activeGame().moves'),null);}
});
for(const mode of ['regular','daily'])test(`${mode}: last-move helpers resume, block swaps and allow a finishing helper`,async()=>{
 const h=harness();h.start();if(mode==='daily')h.run('beginDaily()');
 h.run("activeGame().moves=0;activeGame().status='helpers';activeGame().plates=[24];activeGame().goals=[{kind:'plates',amount:1}];persist();menu()");
 h.run(`data=loadProgress(storage).data;openGame('${mode}')`);assert.equal(h.get('dialog').open,false);assert.equal(h.get('kettle').disabled,false);assert.equal(h.get('finish-attempt').hidden,false);
 h.run('choose(0)');assert.equal(h.run('selected'),null);
 await h.run("data.settings.reduced=true;selectHelper('kettle');swap(24,null,'kettle')");
 assert.equal(h.run('activeGame().status'),mode==='daily'?'won':'playing');assert.equal(h.get('dialog').open,true);
 h.escape();assert.equal(h.get(mode==='daily'?'collection':'garden').hidden,false);
});
for(const escape of [false,true])test(`finish attempt: ${escape?'Escape keeps helpers':'confirm ends attempt'} has a usable route`,()=>{
 const h=harness();h.start();h.run("data.game.moves=0;data.game.status='helpers';openGame();requestFinish()");
 if(escape){h.escape();assert.equal(h.run('data.game.status'),'helpers');assert.equal(h.get('dialog').open,false);}
 else{h.click('Завершить попытку');assert.equal(h.run('data.game.status'),'lost');h.click('Попробовать ещё');h.playable();}
});
test('relaxed victory advances its order without awarding campaign stars or postcards',()=>{
 const h=harness();h.start();const regular=h.run('JSON.stringify(data.game)');h.run("requestRelaxed();data.relaxed.game.status='won';outcome()");h.click('Следующее угощение');h.playable();
 assert.equal(h.run('data.relaxed.game.order'),2);assert.equal(h.run('JSON.stringify(data.game)'),regular);assert.equal(h.run('data.daily.cards.length'),0);assert.equal(h.run('starBalance(data)'),0);
 h.run("data.relaxed.game.status='won';outcome()");h.escape();assert.equal(h.get('menu').hidden,false);h.run('requestRelaxed()');h.click('Следующее угощение');h.playable();
});
test('first earned helper explains its rule once and returns to play',()=>{
 const h=harness();h.start();h.run("earnedHelperNotice({rolling:1,kettle:0},()=>{})");assert.equal(h.get('dialog').open,true);assert.match(h.get('dialog-content').innerHTML,/четыре|4/i);h.escape();h.playable();
 assert.equal(h.run("earnedHelperNotice({rolling:1,kettle:0},()=>{})"),false);assert.equal(h.get('dialog').open,false);
});

test('settings label describes animation rather than a separate game mode',()=>{const h=harness();h.run('settings()');assert.match(h.get('dialog-content').innerHTML,/Меньше анимации/);assert.doesNotMatch(h.get('dialog-content').innerHTML,/Спокойный режим/);});


test('daily defeat reports the actual remaining objective',()=>{const h=harness();h.run("beginDaily();data.daily.game.goals=[{kind:'food',type:1,amount:12}];data.daily.game.collected[1]=7;data.daily.game.status='lost';dailyOutcome()");assert.match(h.get('dialog-content').innerHTML,/Блины: собрано 7 из 12/);h.click('Попробовать ещё');h.playable();});

for(const escape of [false,true])test(`first tea level explains delivery once; ${escape?'Escape':'button'} returns to the intact board`,()=>{
 const h=harness();h.run('data.unlocked=10;start()');const before=h.run('JSON.stringify(data.game)');
 assert.equal(h.get('dialog').open,true);assert.match(h.get('dialog-title').textContent,/чай/i);
 assert.deepEqual(h.buttons(),['К полю']);if(escape)h.escape();else h.click('К полю');h.playable();
 assert.equal(h.run('JSON.stringify(data.game)'),before);assert.equal(h.run('data.seenTea'),true);
 assert.match(h.get('board').children[10].getAttribute('aria-label'),/Чашка чая/);
 h.run('menu();data=loadProgress(storage).data;openGame()');h.playable();
});
test('tea helper phase reloads, serves the cup and opens a playable next level',async()=>{
 const h=harness();h.run(`data.unlocked=10;data.game=newGame(10,{seed:73});data.seenTea=true;
 const b=Array.from({length:56},(_,i)=>(Math.floor(i/7)*2+i%7)%5);b[42]=TEA;b[49]=b[50]=b[44]=1;b[51]=2;
 data.game.board=b;data.game.moves=0;data.game.status='helpers';persist();menu();data=loadProgress(storage).data;openGame()`);
 assert.equal(h.get('dialog').open,false);assert.equal(h.get('finish-attempt').hidden,false);
 await h.run("data.settings.reduced=true;selectHelper('rolling');swap(49,null,'rolling')");
 assert.equal(h.run('data.game.level'),11);assert.equal(h.run('data.game.status'),'playing');
 assert.match(h.get('dialog-content').innerHTML,/Чай: подано 1 из 1/);h.click('Следующий уровень');h.playable();
 assert.equal(h.run('data.game.level'),11);
});

for(const level of [1,6])for(const route of ['next','garden','escape','reload'])test(`campaign victory ${level}: ${route} saves and resumes the next playable level`,()=>{
 const h=harness();h.start();
 h.run(`data.completed=Array.from({length:${level-1}},(_,i)=>i+1);data.unlocked=${level};data.game=newGame(${level});data.game.goals=[{kind:'food',type:0,amount:1}];data.game.collected[0]=1;data.game.status='won';outcome()`);
 assert.match(h.get('dialog-content').innerHTML,new RegExp(`Уровень ${level} пройден`));
 const saved=h.run('loadProgress(storage)');assert.equal(saved.warning,null);assert.equal(saved.data.game.level,level+1);assert.equal(saved.data.game.status,'playing');
 if(route==='next')h.click('Следующий уровень');
 if(route==='garden')h.click('В огород');
 if(route==='escape')h.escape();
 if(route==='reload')h.run("$('dialog').close();data=loadProgress(storage).data");
 h.run('menu()');assert.equal(h.get('continue').textContent,'Продолжить готовить');h.get('continue').onclick();h.playable();
 assert.equal(h.run('data.game.level'),level+1);
 h.run('persist();data=loadProgress(storage).data;openGame()');h.playable();assert.equal(h.run('data.game.level'),level+1);
});

for(const mode of ['regular','daily','relaxed'])test(`Android Back: ${mode} helper cancellation and return preserve a playable save`,()=>{
 const h=harness(true);h.start();if(mode==='daily')h.run('beginDaily()');if(mode==='relaxed')h.run('requestRelaxed()');
 h.run("selectHelper('rolling');systemBack()");assert.equal(h.run('helper'),null);h.playable();
 const before=h.run('JSON.stringify(activeGame())');h.run('systemBack()');assert.equal(h.get('menu').hidden,false);
 h.run(`openGame('${mode}')`);h.playable();assert.equal(h.run('JSON.stringify(activeGame())'),before);
});
test('Android Back follows nested modal returns, garden and result destinations',()=>{
 const h=harness(true);h.start();h.run('settings()');h.get('reset').onclick();h.run('systemBack()');assert.equal(h.get('dialog-title').textContent,'Звуки и уют');h.run('systemBack()');h.playable();
 h.run('showGarden();systemBack()');assert.equal(h.get('menu').hidden,false);
 h.run("start();data.game.status='won';outcome();systemBack()");assert.equal(h.get('garden').hidden,false);h.run('systemBack();start()');h.playable();
});
test('Android Back waits for save before minimizing and stays on a failed save',async()=>{
 const h=harness(true);h.run('var minimized=0; platform.app={minimizeApp:async()=>minimized++}; storage.flush=async()=>false');
 await h.run('systemBack()');assert.equal(h.run('minimized'),0);
 h.run('storage.flush=async()=>true');await h.run('systemBack()');assert.equal(h.run('minimized'),1);
});
test('Android settings and menu do not expose browser install or service-worker updates',()=>{
 const h=harness(true);assert.equal(h.get('install').hidden,true);h.run('settings()');assert.equal(h.get('check-update').hidden,true);assert.equal(h.get('update-status').hidden,true);
});
test('menu is home, garden opens separately and retains an active game',()=>{const h=harness();assert.equal(h.get('menu').hidden,false);assert.equal(h.get('garden').hidden,true);h.start();const before=h.run('JSON.stringify(data.game)');h.run('showGarden();menu()');assert.equal(h.get('menu').hidden,false);h.get('menu-garden').onclick();assert.equal(h.get('garden').hidden,false);h.run('gardenPlay()');h.playable();assert.equal(h.run('JSON.stringify(data.game)'),before);});
test('garden purchase saves atomically and double activation cannot spend twice',()=>{const h=harness();h.run('data.completed=[1,2,3];data.unlocked=4;persist();showGarden();confirmGardenItem(0,"vegetables",0)');h.click('Посадить · 1 ★');assert.equal(h.run('starBalance(data)'),2);assert.equal(h.run('loadProgress(storage).data.garden.plots.length'),1);h.run('confirmGardenItem(0,"vegetables",0)');assert.equal(h.run('starBalance(data)'),2);});
test('failed purchase write rolls back garden and does not show success',()=>{const h=harness();h.run('data.completed=[1];data.unlocked=2;persist();showGarden();storage.setItem=()=>{throw Error("full")};confirmGardenItem(0,"vegetables",0)');h.click('Посадить · 1 ★');assert.equal(h.run('data.garden.plots.length'),0);assert.equal(h.run('starBalance(data)'),1);assert.equal(h.get('dialog-title').textContent,'Не удалось сохранить');h.escape();assert.equal(h.get('garden').hidden,false);});
test('purchase cannot overwrite a newer tab before storage event arrives',()=>{const h=harness();h.run('data.completed=[1,2];data.unlocked=3;persist();showGarden();confirmGardenItem(0,"vegetables",0);storage.setItem(KEY,JSON.stringify(buyGardenItem(data,1,"berries",0).data))');h.click('Посадить · 1 ★');assert.equal(h.run('loadProgress(storage).data.garden.plots[0].slot'),1);assert.equal(h.run('data.garden.plots.length'),0);h.escape();assert.equal(h.run('data.garden.plots[0].slot'),1);});
test('replayed campaign result explains that its star was already received',()=>{const h=harness();h.run('data.completed=[1];data.unlocked=2;data.game={...newGame(1),status:"won"};openGame()');assert.match(h.get('dialog-content').innerHTML,/уже получена/);h.click('В огород');assert.equal(h.run('starBalance(data)'),1);});
test('unaffordable expansion plays a level for stars and preserves an active game',()=>{for(const resume of [false,true]){const h=harness();if(resume)h.start();const before=h.run('JSON.stringify(data.game)');h.run('showGarden();requestGardenExpansion()');h.click('Играть за звёздочку');h.playable();if(resume)assert.equal(h.run('JSON.stringify(data.game)'),before);}});

 test('single campaign action starts the unlocked level without a saved game',()=>{const h=harness();h.run('data.unlocked=4;menu()');assert.equal(h.get('continue').hidden,false);assert.equal(h.get('continue').textContent,'Играть · уровень 4');h.get('continue').onclick();assert.equal(h.run('data.game.level'),4);h.playable();});
 test('single campaign action preserves the entire active save',()=>{const h=harness();h.start();h.run('data.game.moves=7;menu()');const before=h.run('JSON.stringify(data.game)');h.get('continue').onclick();assert.equal(h.run('JSON.stringify(data.game)'),before);h.playable();});
 test('menu has no level picker or competing start button',async()=>{const html=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');assert.doesNotMatch(html,/id="(?:open-book|book|start)"/);});

test('native garden purchase cannot announce success before durable confirmation',async()=>{
 const h=harness(true);h.run('data.completed=[1,2];data.unlocked=3;persist();showGarden();storage.flush=async()=>false');
 await h.run('commitGarden(buyGardenItem(data,0,"vegetables",0),"Посажено")');
 assert.equal(h.get('dialog-title').textContent,'Не удалось сохранить');
 assert.notEqual(h.get('garden-message').textContent,'Посажено');
});
