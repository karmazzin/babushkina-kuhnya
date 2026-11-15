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
import * as recipeCards from '../dist/recipe-cards.js';
import * as relaxed from '../dist/relaxed.js';
import * as pacing from '../dist/pacing.js';
import {FOODS} from '../dist/foods.js';
import {postcardMarkup} from '../dist/postcards.js';
import {createDialogControls} from '../dist/dialog.js';
const source=(await fs.readFile(new URL('../dist/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
class Node extends EventTarget{
 constructor(){super();this.hidden=false;this.open=false;this.children=[];this.classList={add(){},remove(){},toggle(){}};this.dataset={};this.style={};this.attrs={};}
 get firstElementChild(){return this.child??=new Node();}
 append(n){this.children.push(n);}replaceChildren(...n){this.children=n;}getAnimations(){return [];}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}getAttribute(k){return this.attrs[k];}hasPointerCapture(){return false;}close(){this.open=false;}showModal(){this.open=true;}focus(){}querySelectorAll(){return [];}querySelector(){return new Node();}
}
function harness(){
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
 const saved=new Map();const localStorage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)};
 const document={getElementById:get,createElement:()=>new Node(),addEventListener(){},body:new Node(),hidden:false};
 const context=vm.createContext({...engine,...storage,...book,...recipes,...daily,...progression,...recipeCards,...relaxed,...pacing,FOODS,postcardMarkup,bindPostcardSharing(){},renderCollection(root,data,page,onOpen){root.onOpen=onOpen;},createDialogControls,renderBook(root,data,page,onSelect,onRecipe){root.onRecipe=onRecipe;},createAudio:()=>({configure(){},unlock(){},visibility(){},effect(){}}),document,window:{localStorage,addEventListener(){},isSecureContext:false,open(){}},navigator:{},matchMedia:()=>({matches:false}),sessionStorage:{getItem:()=>null,removeItem(){}},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,console});
 vm.runInContext(source,context);
 const run=s=>vm.runInContext(s,context);
 const buttons=()=>get('dialog-actions').children.map(b=>b.textContent);
 return {get,run,buttons,click(text){const b=get('dialog-actions').children.find(x=>x.textContent===text);assert.ok(b,`Missing ${text}: ${buttons()}`);b.onclick();},escape(){get('dialog').dispatchEvent(new Event('cancel',{cancelable:true}));},start(){run('start()');},playable(){assert.equal(get('game').hidden,false);assert.equal(get('dialog').open,false);run('choose(0)');assert.equal(run('selected'),0);run('choose(0)');}};
}
for(const escape of [false,true]){
 const exit=(h,text)=>escape?h.escape():h.click(text),suffix=escape?'Escape':'button';
 for(let page=0;page<6;page++)test(`help page ${page+1}: ${suffix} resumes playable game`,()=>{const h=harness();h.start();h.run(`help(${page})`);exit(h,'Продолжить игру');h.playable();});
 test(`settings and nested reset: ${suffix} returns one step`,()=>{const h=harness();h.start();h.run('settings()');h.get('reset').onclick();exit(h,'Отмена');assert.equal(h.get('dialog-title').textContent,'Звуки и уют');exit(h,'Продолжить игру');h.playable();});
 for(let page=0;page<2;page++)test(`credits ${page}: ${suffix} goes to settings`,()=>{const h=harness();h.start();h.run(`credits(${page})`);exit(h,'Назад к настройкам');assert.equal(h.get('dialog-title').textContent,'Звуки и уют');exit(h,'Продолжить игру');h.playable();});
 for(let page=0;page<3;page++)test(`recipe ${page}: ${suffix} goes to book`,()=>{const h=harness();h.start();h.run(`book(0);recipePage(RECIPE_CARDS[0],${page})`);exit(h,'В книгу');assert.equal(h.get('book').hidden,false);assert.equal(h.get('dialog').open,false);h.run('openGame()');h.playable();});
 test(`new game: ${suffix} cancels without replacing save`,()=>{const h=harness();h.start();const before=h.run('JSON.stringify(data.game)');h.run('menu();requestStart()');exit(h,'Отмена');assert.equal(h.get('menu').hidden,false);assert.equal(h.run('JSON.stringify(data.game)'),before);h.run('openGame()');h.playable();});
 test(`level selection: ${suffix} cancels to book without replacing save`,()=>{const h=harness();h.start();const before=h.run('JSON.stringify(data.game)');h.run('book(0);chooseLevel(1)');exit(h,'Отмена');assert.equal(h.get('book').hidden,false);assert.equal(h.run('JSON.stringify(data.game)'),before);h.run('openGame()');h.playable();});
 for(const status of ['won','lost'])test(`result ${status}: ${suffix} has a usable destination`,()=>{const h=harness();h.start();h.run(`data.game.status='${status}';outcome()`);exit(h,status==='won'?'Книга рецептов':'В главное меню');assert.equal(h.get(status==='won'?'book':'menu').hidden,false);h.run('start()');h.playable();});
 test(`installation instructions: ${suffix} returns to menu`,async()=>{const h=harness();await h.run('install()');exit(h,'Назад');assert.equal(h.get('menu').hidden,false);assert.equal(h.get('dialog').open,false);h.start();h.playable();});
}
test('positive new game and reset routes remain usable',async()=>{const h=harness();h.start();h.run('menu();requestStart()');h.click('Начать заново');h.playable();h.run('settings()');h.get('reset').onclick();h.click('Да, сбросить');assert.equal(h.get('menu').hidden,false);assert.equal(h.run('data.game'),null);h.start();h.playable();});
test('help and recipe forward buttons reach a final return, without a hidden third exit',()=>{const h=harness();h.start();h.run('help()');for(let i=0;i<5;i++)h.click('Дальше →');assert.deepEqual(h.buttons(),['Продолжить игру']);h.click('Продолжить игру');h.playable();h.run('book(0);recipePage(RECIPE_CARDS[0])');for(let i=1;i<book.recipePages(recipeCards.RECIPE_CARDS[0]).length;i++)h.click('Дальше');assert.deepEqual(h.buttons(),['Предыдущая страница','В книгу']);h.click('В книгу');assert.equal(h.get('book').hidden,false);});
for(const status of ['won','lost'])test(`result ${status}: primary action opens a playable next/retry game`,()=>{const h=harness();h.start();h.run(`data.game.status='${status}';outcome()`);h.click(status==='won'?'Следующий уровень':'Попробовать ещё');assert.equal(h.run('data.game.level'),status==='won'?2:1);h.playable();});
test('confirm level selection starts the selected level',()=>{const h=harness();h.start();h.run('data.unlocked=2;book(0);chooseLevel(2)');h.click('Открыть уровень');assert.equal(h.run('data.game.level'),2);h.playable();});
test('credits source keeps a route back after opening the source',()=>{const h=harness();h.start();for(let page=0;page<2;page++){h.run(`credits(${page})`);h.click('Источник и лицензия ↗');h.click('Назад к настройкам');h.click('Продолжить игру');h.playable();}});

for(const escape of [false,true])test(`locked recipe return: ${escape?'Escape':'button'}`,()=>{const h=harness();h.start();h.run('book(0)');h.get('book-content').onRecipe(recipeCards.RECIPE_CARDS[0],false);if(escape)h.escape();else h.click('Назад');assert.equal(h.get('book').hidden,false);assert.equal(h.get('dialog').open,false);h.run('openGame()');h.playable();});
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
 assert.equal(h.run('activeGame().status'),'won');assert.equal(h.get('dialog').open,true);
 h.escape();assert.equal(h.get(mode==='daily'?'collection':'book').hidden,false);
});
for(const escape of [false,true])test(`finish attempt: ${escape?'Escape keeps helpers':'confirm ends attempt'} has a usable route`,()=>{
 const h=harness();h.start();h.run("data.game.moves=0;data.game.status='helpers';openGame();requestFinish()");
 if(escape){h.escape();assert.equal(h.run('data.game.status'),'helpers');assert.equal(h.get('dialog').open,false);}
 else{h.click('Завершить попытку');assert.equal(h.run('data.game.status'),'lost');h.click('Попробовать ещё');h.playable();}
});
test('relaxed victory advances its order without awarding campaign recipes or postcards',()=>{
 const h=harness();h.start();const regular=h.run('JSON.stringify(data.game)');h.run("requestRelaxed();data.relaxed.game.status='won';outcome()");h.click('Следующее угощение');h.playable();
 assert.equal(h.run('data.relaxed.game.order'),2);assert.equal(h.run('JSON.stringify(data.game)'),regular);assert.equal(h.run('data.daily.cards.length'),0);assert.equal(h.run('data.recipes.unlocked.length'),0);
 h.run("data.relaxed.game.status='won';outcome()");h.escape();assert.equal(h.get('menu').hidden,false);h.run('requestRelaxed()');h.click('Следующее угощение');h.playable();
});
test('first earned helper explains its rule once and returns to play',()=>{
 const h=harness();h.start();h.run("earnedHelperNotice({rolling:1,kettle:0},()=>{})");assert.equal(h.get('dialog').open,true);assert.match(h.get('dialog-content').innerHTML,/четыре|4/i);h.escape();h.playable();
 assert.equal(h.run("earnedHelperNotice({rolling:1,kettle:0},()=>{})"),false);assert.equal(h.get('dialog').open,false);
});
test('recipe milestone result records reward, opens its full recipe and returns safely',()=>{
 const h=harness();h.start();h.run("data.completed=[1,2,3,4,5];data.game=newGame(6);data.game.status='won';outcome()");assert.equal(h.run('data.recipes.unlocked[0]'),'blini');
 h.click('Посмотреть рецепт');assert.match(h.get('dialog-content').innerHTML,/4 порции/);h.escape();assert.equal(h.get('book').hidden,false);h.run('start()');h.playable();
});
test('settings label describes animation rather than a separate game mode',()=>{const h=harness();h.run('settings()');assert.match(h.get('dialog-content').innerHTML,/Меньше анимации/);assert.doesNotMatch(h.get('dialog-content').innerHTML,/Спокойный режим/);});

test('recipe shelf back button names its real destination',()=>{const h=harness();h.run('recipeShelf()');assert.equal(h.get('book-back').getAttribute('aria-label'),'К уровням');h.get('book-back').onclick();assert.equal(h.get('book-back').getAttribute('aria-label'),'В главное меню');});

test('daily defeat reports the actual remaining objective',()=>{const h=harness();h.run("beginDaily();data.daily.game.goals=[{kind:'food',type:1,amount:12}];data.daily.game.collected[1]=7;data.daily.game.status='lost';dailyOutcome()");assert.match(h.get('dialog-content').innerHTML,/Блины: собрано 7 из 12/);h.click('Попробовать ещё');h.playable();});
