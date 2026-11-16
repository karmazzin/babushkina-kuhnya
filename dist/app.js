import {bindPostcardSharing} from './sharing.js';
import {localDay,displayDay,newDailyGame,recordDailyWin,dailyOffer} from './daily.js';
import {renderCollection,postcardMarkup} from './postcards.js';
import {createDialogControls} from './dialog.js';
import {swipeIntent} from './gestures.js';
import {createUpdater,checkForUpdate} from './update.js';
import {renderBook,renderRecipeShelf,recipePages,recipeIllustration,goalText,resultGoalText,goalMarkup,goalHint} from './book.js';
import {levelRecipe} from './recipes.js';
import {FOODS} from './foods.js';
import {TEA} from './tea.js';
import {recipeById} from './recipe-cards.js';
import {recordCampaignWin,nextRecipeReward} from './progression.js';
import {newRelaxedGame} from './relaxed.js';
import {createPacing,hintAction} from './pacing.js';
import {gravityMap,TIMING,animate} from './animation.js';
import {createAudio} from './audio.js';
import {offlineRegistration} from './offline.js';
import {newGame,play,adjacent,useBooster,boosterArea,isActiveGame,finishAttempt} from './engine.js';
import {KEY,loadProgress,saveProgress,saveBeforeUpdate,defaultProgress} from './storage.js';
const $=id=>document.getElementById(id), fmt=n=>n.toLocaleString('ru-RU');
// Identify this loaded page, never the waiting or newly activated worker.
const installedVersion=document.querySelector?.('meta[name="kitchen-version"]')?.content??'неизвестна';
const installedBuild=document.querySelector?.('meta[name="kitchen-build"]')?.content??'—';
const names=FOODS.map(f=>f.name);
let storage;try{storage=window.localStorage;}catch{storage=null;}
let loaded=loadProgress(storage), data=loaded.data, selected=null, busy=false, epoch=0, installPrompt=null;
let gameMode='regular',pendingStorage=false,saveDirty=!!loaded.warning;
let savedRaw;try{savedRaw=storage?.getItem(KEY)??null;}catch{savedRaw=null;}
const activeGame=()=>gameMode==='daily'?data.daily.game:gameMode==='relaxed'?data.relaxed.game:data.game;
function setActiveGame(game){if(gameMode==='daily')data.daily.game=game;else if(gameMode==='relaxed')data.relaxed.game=game;else data.game=game;}
const audio=createAudio();
document.addEventListener('pointerdown',()=>audio.unlock(),{capture:true});
document.addEventListener('keydown',()=>audio.unlock(),{capture:true});
document.addEventListener('visibilitychange',()=>audio.visibility(!document.hidden));
const reduce=()=>data.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches;
function warning(text){$('storage-warning').textContent=text;$('storage-warning').hidden=!text;}
warning(loaded.warning);
function persist(){
 try{if(storage.getItem(KEY)!==savedRaw){saveDirty=true;pendingStorage=true;warning('В другой вкладке есть более новое сохранение. Эта партия пока не сохранена — не закрывайте её.');return false;}}catch{}
 const ok=saveProgress(storage,data);saveDirty=!ok;if(ok)savedRaw=JSON.stringify(data);warning(ok?'':'Хранилище недоступно. Не закрывайте игру: прогресс сейчас не сохраняется.');return ok;}
function settingsApplied(){document.body.classList.toggle('reduced',data.settings.reduced);audio.configure(data.settings);}
let pacing=null,hintTimer=null,helper=null,helperTarget=null;
function clearHint(){clearTimeout(hintTimer);tiles.forEach(t=>t.classList.remove('hint','hint-area'));for(const k of ['rolling','kettle'])$(k).classList.remove('hint');if(!helper)$('helper-prompt').textContent=goalHint(activeGame());}
function showHint(){
 const action=hintAction(activeGame());if(!action)return;
 if(action.kind==='swap')action.move.forEach(i=>tiles[i].classList.add('hint'));
 else{$(action.helper).classList.add('hint');boosterArea(action.helper,action.index).forEach(i=>tiles[i].classList.add('hint-area'));$('helper-prompt').textContent=action.helper==='rolling'?'Скалка поможет в выделенном ряду':'Чайник поможет в выделенной области';}
}
function armHint(){
 clearHint();if(helper||busy||document.hidden||$('game').hidden||$('dialog').open||!isActiveGame(activeGame()))return;
 hintTimer=setTimeout(showHint,9000);
}
function accelerate(){if(!busy||!pacing)return;pacing.fast();$('game-message').textContent='Готовим побыстрее…';}
function cancelMotion(){resetPointer();clearHint();clearHelper();$('helper-effect').getAnimations().forEach(a=>a.cancel());$('helper-effect').replaceChildren();pacing?.cancel();pacing=null;epoch++;busy=false;selected=null;tiles.forEach(t=>{t.firstElementChild.getAnimations().forEach(a=>a.cancel());t.classList.remove('matching');});$('board').removeAttribute('aria-busy');syncOtherTab();}
function hideScreens(){for(const id of ['menu','game','book','collection'])$(id).hidden=true;}
function refreshDailyMenu(){
 const offer=dailyOffer(data.daily),pending=data.daily.game;
 $('daily-label').textContent=offer==='resume'||offer==='previous'?'Продолжить угощение':'Угощение дня';
 $('daily-caption').textContent=offer==='previous'?`Начато ${displayDay(pending.dailyDate)}`:offer==='completed'?'Открытка уже в коллекции':offer==='resume'?'Партия сохранена':'Короткая игра · открытка в подарок';
 $('collection-count').textContent=data.daily.cards.length;
}
function menu(){cancelMotion();hideScreens();$('menu').hidden=false;$('continue').hidden=!data.game;$('continue').textContent=isActiveGame(data.game)?'Продолжить готовить':'Результат уровня';$('start').textContent=data.game?`Играть · уровень ${data.unlocked}`:'Начать готовить';$('unlocked').textContent=data.unlocked;$('best').textContent=fmt(data.best);refreshDailyMenu();}
function start(){data.game=newGame(data.unlocked);persist();openGame('regular');navigator.storage?.persist?.().catch(()=>{});}
function requestStart(){if(isActiveGame(data.game)){modal('Начать заново?','<p>Текущая обычная партия будет заменена. Угощение дня, уровни и открытки останутся.</p>',[{text:'Отмена',cancel:true,action:menu},{text:'Начать заново',action:start,secondary:true}]);}else start();}
function openGame(mode='regular'){
 cancelMotion();gameMode=mode;
 if(!activeGame())return mode==='daily'?requestDaily():mode==='relaxed'?requestRelaxed():start();
 hideScreens();$('game').hidden=false;paint();
 if(!isActiveGame(activeGame()))outcome();else if(!teaNotice())armHint();
}
function teaNotice(){
 if(data.seenTea||!activeGame().goals.some(g=>g.kind==='tea'))return false;
 data.seenTea=true;persist();
 modal('Подайте чай к столу','<span class="food tea tea-example" aria-hidden="true"></span><p>Собирайте блюда под чашкой, чтобы она опускалась.</p><p>Чашку можно менять местами с блюдом, если получается ряд.</p><p><b>Достигла нижнего ряда — чай подан!</b></p>',[{text:'К полю',cancel:true,action:()=>{}}]);return true;
}
function beginDaily(day=localDay()){cancelMotion();data.daily.game=newDailyGame(day);persist();openGame('daily');}
function requestDaily(){
 const today=localDay(),offer=dailyOffer(data.daily,today),saved=data.daily.game;
 if(saved?.status==='won'&&!data.daily.cards.includes(saved.dailyDate))return openGame('daily');
 if(offer==='resume')return openGame('daily');
 if(offer==='previous')return modal('Угощение вас дождалось',`<p>Осталась партия за ${displayDay(saved.dailyDate)}. Можно спокойно её закончить и получить открытку.</p><p>Или начать сегодняшнюю — незавершённая ежедневная партия будет заменена. Обычная игра и открытки сохранятся.</p>`,[{text:'Продолжить начатое',action:()=>openGame('daily')},{text:'Сегодняшнее угощение',secondary:true,action:()=>beginDaily(today)},{text:'В меню',cancel:true,secondary:true,action:menu}]);
 if(offer==='completed')return modal('Открытка уже у вас','<p>Сегодняшнее угощение пройдено. Можно сыграть ещё для удовольствия или посмотреть коллекцию.</p>',[{text:'Мои открытки',action:()=>collection()},{text:'Сыграть ещё',secondary:true,action:()=>beginDaily(today)},{text:'В меню',cancel:true,secondary:true,action:menu}]);
 if(saved?.dailyDate===today&&saved.status==='lost')return openGame('daily');
 beginDaily(today);
}
function requestRelaxed(){
 if(!data.relaxed.game){data.relaxed.game=newRelaxedGame(data.relaxed.completed+1);persist();}
 openGame('relaxed');
}
function relaxedOutcome(){
 const g=data.relaxed.game;data.relaxed.completed=Math.max(data.relaxed.completed,g.order);persist();
 modal('Угощение готово!',`<div class="result-goals">${goalMarkup(g)}</div><p>Можно приготовить ещё одно<br>или вернуться позже.</p>`,[{text:'Следующее угощение',action:()=>{data.relaxed.game=newRelaxedGame(g.order+1);persist();openGame('relaxed');}},{text:'В главное меню',secondary:true,cancel:true,action:menu}]);
}
function requestFinish(){
 if(activeGame()?.status!=='helpers')return;
 modal('Завершить попытку?','<p>Помощники ещё могут помочь. Можно использовать их или попробовать этот уровень заново.</p>',[{text:'Продолжить с помощниками',cancel:true,action:()=>{}},{text:'Завершить попытку',secondary:true,action:()=>{setActiveGame(finishAttempt(activeGame()));persist();stats();outcome();}}]);
}
function earnedHelperNotice(earned,after){
 const unseen=['rolling','kettle'].filter(k=>earned?.[k]>0&&!data.seenHelpers.includes(k));if(!unseen.length)return false;
 data.seenHelpers.push(...unseen);persist();
 const text=unseen.map(k=>k==='rolling'?'Четыре блюда в ряд подарили скалку. Она собирает целый ряд.':'Пересечение двух рядов подарило чайник. Он собирает область 3 × 3.').join('</p><p>');
 modal('Новый помощник!',`<p>${text}</p><p>Выберите помощника, затем место на поле. Ход не тратится. Можно хранить до трёх зарядов каждого.</p>`,[{text:'Продолжить',cancel:true,action:after}]);return true;
}
function collection(page=0){
 cancelMotion();hideScreens();$('collection').hidden=false;
 renderCollection($('collection-content'),data.daily.cards,page,i=>modal('Ваша открытка',postcardMarkup(data.daily.cards[i],i,false,data.daily.art[i]),[{text:'К коллекции',cancel:true,action:()=>collection(page)}]),collection,requestDaily,data.daily.art);
}
function dailyOutcome(){
 const g=data.daily.game,won=g.status==='won';
 if(won){const rewarded=recordDailyWin(data.daily);if(rewarded!==data.daily){data.daily=rewarded;persist();}}
 const index=data.daily.cards.indexOf(g.dailyDate);
 modal(won?'Открытка для вас':'Попробуем ещё?',won?postcardMarkup(g.dailyDate,index,false,data.daily.art[index])+'<p class="daily-reassurance">Открытка останется в коллекции.<br>Возвращайтесь, когда захочется.</p>':`<div class="result-goals">${goalMarkup(g)}</div><p class="result-detail">${resultGoalText(g)}</p><p>Угощение можно попробовать снова — столько раз, сколько хочется. Открытки и обычная партия сохранены.</p>`,won?[{text:'В коллекцию',cancel:true,action:()=>collection()},{text:g.dailyDate===localDay()?'В главное меню':'Сегодняшнее угощение',secondary:true,action:()=>g.dailyDate===localDay()?menu():requestDaily()}]:[{text:'Попробовать ещё',action:()=>beginDaily(g.dailyDate)},{text:'В главное меню',cancel:true,secondary:true,action:menu}]);
}
const tiles=[];
for(let i=0;i<56;i++){
 const tile=document.createElement('button');tile.className='tile';tile.type='button';tile.dataset.index=i;tile.tabIndex=i===0?0:-1;tile.innerHTML='<span class="food" aria-hidden="true"></span>';
 tile.addEventListener('click',()=>{if(Date.now()<suppressClick)return;choose(i);});
 tile.addEventListener('keydown',e=>{
  let j=i;const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];
  if(delta!==undefined){e.preventDefault();j=i+delta;if(adjacent(i,j)){tile.tabIndex=-1;tiles[j].tabIndex=0;tiles[j].focus();}}
  if(e.key==='Escape'){clearHelper();selected=null;selection();}
 });
 $('board').append(tile);tiles.push(tile);
}
function paintBoard(board,removed=[],plates=activeGame()?.plates??[]){
 const set=new Set(removed),teaGoal=activeGame().goals.some(g=>g.kind==='tea');
 $('board').setAttribute('aria-label',`Игровое поле: 7 столбцов, 8 строк${teaGoal?'. Нижний ряд — подача чая':''}`);
 board.forEach((t,i)=>{const tile=tiles[i];tile.dataset.type=t;tile.classList.toggle('has-plate',plates.includes(i));tile.classList.toggle('serving-row',teaGoal&&i>=49);tile.firstElementChild.className=t===TEA?'food tea':`food f${t}`;tile.setAttribute('aria-label',`${t===TEA?'Чашка чая':names[t]}${plates.includes(i)?', на тарелке':''}, строка ${Math.floor(i/7)+1}, столбец ${i%7+1}`);tile.classList.toggle('matched',set.has(i));tile.classList.remove('falling','invalid','matching');});selection();
}
function selection(){tiles.forEach((tile,i)=>{tile.classList.toggle('selected',i===selected);tile.setAttribute('aria-pressed',String(i===selected));});}
function stats(g=activeGame()){
 if(!g)return;if(!helper)$('helper-prompt').textContent=goalHint(g);$('game-mode').textContent=gameMode==='daily'?'Угощение дня':gameMode==='relaxed'?'Без спешки':'Уровень';$('level').textContent=gameMode==='daily'?displayDay(g.dailyDate).slice(0,5):gameMode==='relaxed'?g.order:g.level;$('moves').textContent=g.moves===null?'∞':g.moves;$('moves-label').textContent=g.moves===null?'Без лимита':'Ходы';$('finish-attempt').hidden=g.status!=='helpers';
 $('recipe-goals').innerHTML=goalMarkup(g);
 for(const kind of ['rolling','kettle']){$(kind+'-count').textContent=g.boosters[kind];$(kind).disabled=busy||(g.boosters[kind])===0||!isActiveGame(g);}
}
function goalInstruction(){return goalHint(activeGame());}
function clearHelper(){
 helper=null;helperTarget=null;$('helper-cancel').hidden=true;
 $('helper-prompt').textContent=goalInstruction();
 for(const kind of ['rolling','kettle']){$(kind).classList.remove('helper-selected');$(kind).setAttribute('aria-pressed','false');}
 tiles.forEach(t=>t.classList.remove('helper-preview'));
}
function selectHelper(kind){
 if(busy||!isActiveGame(activeGame())||!(activeGame().boosters[kind]))return;
 if(helper===kind){clearHelper();armHint();return;}
 clearHelper();clearHint();selected=null;selection();helper=kind;
 $(kind).classList.add('helper-selected');$(kind).setAttribute('aria-pressed','true');
 $('helper-cancel').hidden=false;$('helper-prompt').textContent=kind==='rolling'?'Коснитесь нужного ряда':'Коснитесь места для чайника';
}
function previewHelper(i){
 helperTarget=i;const area=new Set(i===null?[]:boosterArea(helper,i));
 tiles.forEach((t,n)=>t.classList.toggle('helper-preview',area.has(n)));
}
function applyHelper(i){
 if(i===null||!helper||busy)return;
 const kind=helper;clearHelper();swap(i,null,kind);
}
async function helperVisual(kind,index){
 const motionEpoch=epoch,host=$('helper-effect'),board=$('board').getBoundingClientRect(),cell=tiles[index].getBoundingClientRect(),frame=$('helper-effect').parentElement.getBoundingClientRect();
 host.className=kind;host.style.top=`${cell.y-frame.y}px`;host.style.left=`${board.x-frame.x}px`;host.style.width=`${board.width}px`;host.style.height=`${cell.height}px`;
 host.innerHTML=kind==='rolling'?'<img src="./assets/ui/rolling-pin.png" alt="">':'<span class="steam">☁</span><img src="./assets/ui/tea-kettle.png" alt="">';
 if(kind==='kettle'){host.style.left=`${cell.x-frame.x-cell.width}px`;host.style.top=`${cell.y-frame.y-cell.height}px`;host.style.width=`${cell.width*3}px`;host.style.height=`${cell.height*3}px`;}
 const cleanup=await animate([host],kind==='rolling'?[{opacity:0,transform:'translateX(-12%)'},{opacity:1,offset:.2},{opacity:1,offset:.8},{opacity:0,transform:'translateX(12%)'}]:[{opacity:0,transform:'scale(.65)'},{opacity:.85,offset:.4},{opacity:0,transform:'scale(1.15) translateY(-10px)'}],{duration:900,easing:'ease-in-out'},a=>pacing.track(a));cleanup();if(motionEpoch===epoch)host.replaceChildren();
}

function paint(){paintBoard(activeGame().board);stats();settingsApplied();$('game-message').textContent='';}
const sleep=ms=>pacing.wait(ms);
function food(i){return tiles[i].firstElementChild;}
async function swapVisual(a,b,back=false){
 const ra=tiles[a].getBoundingClientRect(),rb=tiles[b].getBoundingClientRect();
 const dx=rb.x-ra.x,dy=rb.y-ra.y;
 const aa=food(a).animate([{transform:'translate(0,0)'},{transform:`translate(${dx}px,${dy}px)`}],{duration:TIMING.swap,easing:'ease-in-out',fill:'forwards',direction:back?'alternate':'normal',iterations:back?2:1});
 const ab=food(b).animate([{transform:'translate(0,0)'},{transform:`translate(${-dx}px,${-dy}px)`}],{duration:TIMING.swap,easing:'ease-in-out',fill:'forwards',direction:back?'alternate':'normal',iterations:back?2:1});
 pacing.track(aa);pacing.track(ab);
 await Promise.all([aa.finished.catch(()=>{}),ab.finished.catch(()=>{})]);return ()=>{aa.cancel();ab.cancel();};
}
async function swap(a,b,kind=null){
 if(busy||!isActiveGame(activeGame())||(!kind&&activeGame().status==='helpers'))return;
 clearHint();pacing=createPacing();
 const result=kind?useBooster(activeGame(),kind,a):play(activeGame(),a,b);selected=null;selection();busy=true;const turn=++epoch;
 if(!result.valid){
  $('game-message').textContent='Нет совпадения. Ход сохранён.';
  if(!reduce()){const cleanup=await swapVisual(a,b,true);cleanup();}if(turn===epoch){busy=false;syncOtherTab();armHint();}return;
 }
 // Persist settled state first, but reveal points as each cascade resolves.
 setActiveGame(result.game);if(gameMode==='daily')data.daily=recordDailyWin(data.daily);else if(gameMode==='regular'){data.best=Math.max(data.best,activeGame().score);data=recordCampaignWin(data);}else if(activeGame().status==='won')data.relaxed.completed=Math.max(data.relaxed.completed,activeGame().order);persist();
 $('moves').textContent=activeGame().moves??'∞';$('board').setAttribute('aria-busy','true');
 try{
  if(!reduce()&&kind){await helperVisual(kind,a);if(turn!==epoch)return;}
  if(!reduce()&&!kind){const cleanup=await swapVisual(a,b);if(turn!==epoch){cleanup();return;}paintBoard(result.frames[0].before,[],result.frames[0].platesBefore);cleanup();}
  for(const frame of result.frames){
   if(turn!==epoch)return;
   if(reduce())continue;
   paintBoard(frame.before,[],frame.platesBefore);frame.removed.forEach(i=>tiles[i].classList.add('matching'));
   const serving=frame.kind==='tea';
   $('game-message').textContent=serving?'Чай подан!':frame.multiplier>1?`Каскад ×${frame.multiplier} · собрано: ${frame.removed.length}`:`Собрано блюд: ${frame.removed.length}`;
   await sleep(TIMING.highlight);if(turn!==epoch)return;audio.effect(serving?'land':'match');
   const clearFade=await animate(frame.removed.map(food),serving?[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(65%) scale(.85)'}]:[{opacity:1,transform:'scale(1)'},{opacity:.7,transform:'scale(1.08)',offset:.35},{opacity:0,transform:'scale(.75)'}],{duration:TIMING.fade,easing:'ease-in',fill:'forwards'},a=>pacing.track(a));
   if(turn!==epoch){clearFade();return;}
   $('score-pop').classList.remove('show');if(!serving){$('score-pop').textContent=`+${frame.removed.length*10*frame.multiplier}`;void $('score-pop').offsetWidth;$('score-pop').classList.add('show');}
   const step=tiles[7].getBoundingClientRect().y-tiles[0].getBoundingClientRect().y;
   const progress={...activeGame(),plates:frame.platesAfter,collected:frame.collected,servedTea:frame.servedTea};
   paintBoard(frame.after,[],frame.platesAfter);$('recipe-goals').innerHTML=goalMarkup(progress);$('helper-prompt').textContent=goalHint(progress);clearFade();
   const falling=gravityMap(frame.removed).filter(m=>m.from!==m.to).map(m=>food(m.to).animate([{transform:`translateY(${(m.from-m.to)/7*step}px)`,opacity:m.from<0?0:1},{transform:'translateY(0)',opacity:1}],{duration:TIMING.fall,easing:'cubic-bezier(.22,.68,.3,1)',fill:'both'}));
   falling.forEach(a=>pacing.track(a));
   await Promise.all(falling.map(a=>a.finished.catch(()=>{})));falling.forEach(a=>a.cancel());if(turn!==epoch)return;
   await sleep(TIMING.settle);
  }
  if(turn!==epoch)return;paintBoard(activeGame().board);stats();if(reduce())audio.effect('match');
  $('game-message').textContent=result.shuffled?'Новые блюда — новые ходы!':'';
  const after=()=>{if(!isActiveGame(activeGame())){if(activeGame().status==='won')audio.effect('win');outcome();}};if(!earnedHelperNotice(result.earned,after))after();
 }finally{if(turn===epoch){busy=false;$('board').removeAttribute('aria-busy');stats();syncOtherTab();armHint();}}
}
function choose(i){if(busy){accelerate();return;}if(!isActiveGame(activeGame()))return;if(helper){applyHelper(i);return;}if(activeGame().status==='helpers')return;if(selected===null){selected=i;selection();}else if(selected===i){selected=null;selection();}else if(adjacent(selected,i)){swap(selected,i);}else{selected=i;selection();}}
let pointer=null,suppressClick=0;
function resetPointer(){
 const p=pointer;pointer=null;
 if(p&&$('board').hasPointerCapture(p.id))$('board').releasePointerCapture(p.id);
 tiles.forEach(t=>{t.classList.remove('drag-source','swipe-target');t.firstElementChild.style.transform='';});
}
function cellAt(x,y){
 const tile=document.elementFromPoint(x,y)?.closest('#board .tile');
 return tile?Number(tile.dataset.index):null;
}
function dragPreview(e){
 if(!pointer||pointer.id!==e.pointerId)return;
 if(helper){previewHelper(cellAt(e.clientX,e.clientY));return;}
 const p=pointer,dx=e.clientX-p.x,dy=e.clientY-p.y;
 p.travel=Math.max(p.travel,Math.hypot(dx,dy));
 const intent=swipeIntent(p.i,dx,dy,p.size,p.axis);p.axis=intent.axis;p.target=intent.target;
 tiles.forEach(t=>t.classList.remove('swipe-target'));
 const offset=intent.target===null?intent.offset*.25:intent.offset;
 food(p.i).style.transform=p.axis=== 'x'?`translateX(${offset}px)`:p.axis==='y'?`translateY(${offset}px)`:'';
 if(intent.target!==null)tiles[intent.target].classList.add('swipe-target');
}
$('board').addEventListener('pointerdown',e=>{
 if(e.isPrimary===false||e.button!==0||pointer)return;
 if(busy){accelerate();suppressClick=Date.now()+500;return;}
 const t=e.target.closest('.tile');if(!t||!isActiveGame(activeGame())||(activeGame().status==='helpers'&&!helper))return;
 clearHint();const i=Number(t.dataset.index);
 pointer={id:e.pointerId,i,x:e.clientX,y:e.clientY,size:t.getBoundingClientRect().width,axis:null,target:null,travel:0};
 $('board').setPointerCapture(e.pointerId);
 if(helper)previewHelper(i);else t.classList.add('drag-source');
});
$('board').addEventListener('pointermove',dragPreview);
$('board').addEventListener('pointerup',e=>{
 if(!pointer||pointer.id!==e.pointerId)return;
 dragPreview(e);const p=pointer,hit=cellAt(e.clientX,e.clientY),target=p.target;
 suppressClick=Date.now()+400;resetPointer();
 if(helper){if(hit!==null)applyHelper(hit);else previewHelper(null);return;}
 const bounds=$('board').getBoundingClientRect();
 if(e.clientX<bounds.left||e.clientX>bounds.right||e.clientY<bounds.top||e.clientY>bounds.bottom){armHint();return;}
 if(target!==null)swap(p.i,target);
 else if(p.travel<Math.max(10,p.size*.24))choose(p.i);
 else armHint();
});
function cancelPointer(){if(!pointer)return;suppressClick=Date.now()+400;resetPointer();if(helper)previewHelper(null);armHint();}
$('board').addEventListener('pointercancel',cancelPointer);
$('board').addEventListener('lostpointercapture',cancelPointer);
window.addEventListener('blur',cancelPointer);
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelPointer();});
const dialogControls=createDialogControls($('dialog'));
function modal(title,html,actions){const bound=dialogControls.actions(actions);resetPointer();clearHelper();clearHint();$('dialog-title').textContent=title;$('dialog-content').innerHTML=html;$('dialog-actions').replaceChildren();for(const a of bound){const b=document.createElement('button');b.className=`button ${a.secondary?'secondary':'primary'} ${a.cancel?'dialog-return':''}`;b.textContent=a.text;b.onclick=a.run;$('dialog-actions').append(b);}if(!$('dialog').open)$('dialog').showModal();bindPostcardSharing($('dialog-content'));}
$('dialog').addEventListener('close',armHint);
document.addEventListener('pointerdown',armHint,{capture:true});
document.addEventListener('keydown',armHint,{capture:true});
document.addEventListener('visibilitychange',armHint);
function outcome(){
 if(gameMode==='daily')return dailyOutcome();if(gameMode==='relaxed')return relaxedOutcome();
 data=recordCampaignWin(data);const g=activeGame(),won=g.status==='won',reward=recipeById(g.recipeReward),next=nextRecipeReward(data);
 // Commit the next board with the victory; result navigation must not own progression.
 if(won)data.game=newGame(g.level+1);
 persist();
 const rewardText=reward?`<p class="result-reward">Новый рецепт: <b>${reward.dish}</b></p>`:won&&next?`<p>До рецепта «${next.recipe.dish}»: ${next.remaining}</p>`:'';
 modal(won?'Угощение готово!':'Попробуем ещё?',`<p>${won?'Все цели выполнены. Уровень '+g.level+' пройден!':'Не все цели выполнены. Попробуем ещё раз?'}</p><div class="result-goals">${goalMarkup(g)}</div><p class="result-detail">${resultGoalText(g)}</p>${rewardText}<p class="result-points">Очки: ${fmt(g.score)}</p>`,[{text:won?'Следующий уровень':'Попробовать ещё',action:()=>{if(!won){data.game=newGame(g.level);persist();}openGame();}},{text:won?(reward?'Посмотреть рецепт':'Книга рецептов'):'В главное меню',action:()=>{if(!won)return menu();if(reward){recipeShelf();recipePage(reward);}else book(Math.floor((g.level-1)/6));},secondary:true,cancel:true}]);
}
function help(page=0){
 const pages=[['Выберите два блюда','Нажмите на блюдо, затем на соседнее. Или проведите по нему пальцем.'],['Соберите три в ряд','Три и больше одинаковых блюда по горизонтали или вертикали исчезнут. Новые опустятся сверху.'],['Готовьте без спешки','В обычной игре соберите цели за отведённые ходы. Потом можно использовать оставшихся помощников. В режиме «Без спешки» ходы не ограничены.'],['Блюда на тарелках','Голубые тарелки остаются на месте. Соберите на них три блюда в ряд — тарелки уберутся. Скалка и чайник тоже помогают.'],['Подайте чай к столу','Собирайте блюда под чашкой, чтобы она опускалась. Чашку можно менять местами с блюдом, если получается ряд. Нижний ряд — чай подан! Помощники чашку не убирают.'],['Помощники на кухне','Нажмите скалку или чайник, затем коснитесь места на поле. Скалка собирает ряд, чайник — область 3 × 3. Ход не тратится. Нажмите помощника ещё раз, чтобы отменить выбор.'],['Каскады вкуснее','Нажмите на поле во время каскада, чтобы ускорить его. Подсказка появится после паузы. Клавиатура: стрелки, Enter для выбора, Esc для отмены.']];
 modal(pages[page][0],`<div class="legend">${page===4?'<span class="food tea"></span>':(activeGame()?.pool??[0,1,2,3,4]).map(i=>`<span class="food f${i}"></span>`).join('')}</div><p>${pages[page][1]}</p><p class="page-count">${page+1} / ${pages.length}</p>`,[...(page<pages.length-1?[{text:'Дальше →',action:()=>help(page+1)}]:[]),{text:$('game').hidden?'В меню':'Продолжить игру',cancel:true,secondary:page<pages.length-1,action:()=>{}}]);
}
function credits(page=0){const music=page===0;modal(music?'Музыка на кухне':'Звуки на кухне',music?'<p><b>Porch Swing Days — slower<br>Easy Lemon · Summer Day · Carefree</b></p><p>Kevin MacLeod · incompetech.com<br>Creative Commons Attribution 4.0.</p><p>Полные композиции, AAC; громкость выровнена.</p>':'<p><b>Interface Sounds</b><br>Kenney · kenney.nl</p><p>Creative Commons Zero (CC0).<br>Готовые записи, перекодированы в MP3.</p>',[...(music?[{text:'Звуковые эффекты →',action:()=>credits(1)}]:[]),{text:'Назад к настройкам',cancel:true,action:settings},{text:'Источник и лицензия ↗',secondary:true,action:()=>{window.open(music?'https://incompetech.com/music/royalty-free/licenses/':'https://kenney.nl/assets/interface-sounds','_blank','noopener');credits(page);}}]);}
function settings(){
 modal('Звуки и уют',`<div class="settings-options"><label class="setting">♫ Музыка<input id="setting-music" type="checkbox" ${data.settings.music?'checked':''}></label><label class="setting">♪ Звуки блюд<input id="setting-sound" type="checkbox" ${data.settings.sound?'checked':''}></label><label class="volume-setting" for="setting-volume">Громкость звуков <output id="volume-value">${Math.round((data.settings.soundVolume)*100)}%</output><input id="setting-volume" type="range" min="0" max="100" step="5" value="${Math.round((data.settings.soundVolume)*100)}"></label><label class="setting">Меньше анимации<input id="setting-reduced" type="checkbox" ${data.settings.reduced?'checked':''}></label></div><div class="settings-tools"><button class="button secondary" id="credits">Авторы музыки</button><button class="button secondary" id="check-update">Проверить обновление</button><p id="update-status" role="status"></p><button class="button secondary" id="reset">Сброс прогресса</button><p class="installed-version"><span id="installed-version"></span><small id="installed-build"></small></p></div>`,[{text:$('game').hidden?'В меню':'Продолжить игру',cancel:true,action:()=>{}}]);
 for(const key of ['music','sound','reduced'])$('setting-'+key).onchange=e=>{data.settings[key]=e.target.checked;settingsApplied();persist();};
 $('setting-volume').oninput=e=>{data.settings.soundVolume=Number(e.target.value)/100;$('volume-value').textContent=e.target.value+'%';settingsApplied();persist();};
 $('setting-volume').onchange=()=>audio.effect('match');
 $('installed-version').textContent='Версия '+installedVersion;
 $('installed-build').textContent='Сборка '+installedBuild;
 $('check-update').onclick=manualUpdateCheck;paintUpdateStatus();
 $('credits').onclick=()=>credits();$('reset').onclick=()=>modal('Сбросить всё?','<p>Все три партии, рецепты, открытки, открытые уровни и рекорд будут удалены. Это нельзя отменить.</p>',[{text:'Отмена',cancel:true,action:settings},{text:'Да, сбросить',secondary:true,action:()=>{data=defaultProgress();persist();settingsApplied();menu();}}]);
}
let bookReturnPage=0;
function showRecipe(recipe,complete){if(complete)recipePage(recipe);else {const next=nextRecipeReward(data);modal('Ещё немного угощений',`<p>Следующий рецепт — «${next?.recipe.dish??recipe.dish}» — откроется после уровня ${next?.level??6}.</p><p>Уже полученные рецепты всегда доступны в книге.</p>`,[{text:'Назад',cancel:true,action:()=>{}}]);}}
function book(page=Math.floor((data.unlocked-1)/6)){
 cancelMotion();hideScreens();$('book').hidden=false;bookReturnPage=page;$('book-title').textContent='Бабушкина книга';$('book-back').setAttribute('aria-label','В главное меню');$('book-back').onclick=menu;
 renderBook($('book-content'),data,page,chooseLevel,showRecipe,book,()=>recipeShelf());
}
function recipeShelf(page=0){
 cancelMotion();hideScreens();$('book').hidden=false;$('book-title').textContent='Мои рецепты';$('book-back').setAttribute('aria-label','К уровням');$('book-back').onclick=()=>book(bookReturnPage);
 renderRecipeShelf($('book-content'),data,page,showRecipe,recipeShelf);
}
function chooseLevel(level){if(level>data.unlocked)return;const begin=()=>{data.game=newGame(level);persist();openGame('regular');};if(isActiveGame(data.game))modal('Открыть другой уровень?','<p>Обычная партия будет заменена. Остальные партии, рецепты и открытки останутся.</p>',[{text:'Открыть уровень',action:begin},{text:'Отмена',cancel:true,secondary:true,action:()=>{}}]);else begin();}
function recipePage(recipe,page=0){
 const pages=recipePages(recipe);
 modal(recipe.dish,`<div class="recipe-page">${pages[page]}</div><p class="page-count">${page+1} / ${pages.length}</p>`,[...(page<pages.length-1?[{text:'Дальше',action:()=>recipePage(recipe,page+1)}]:[]),...(page>0?[{text:'Предыдущая страница',secondary:true,action:()=>recipePage(recipe,page-1)}]:[]),{text:'В книгу',cancel:true,secondary:page<pages.length-1,action:()=>{}}]);
}
$('open-relaxed').onclick=requestRelaxed;$('finish-attempt').onclick=requestFinish;
$('open-daily').onclick=requestDaily;$('open-collection').onclick=()=>collection();$('collection-back').onclick=menu;
$('open-book').onclick=()=>book();$('book-back').onclick=menu;
$('rolling').onclick=()=>selectHelper('rolling');$('kettle').onclick=()=>selectHelper('kettle');$('helper-cancel').onclick=()=>{clearHelper();armHint();};
async function install(){if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;return;}
 const apple=/iPhone|iPad|iPod/.test(navigator.userAgent);
 modal('Всегда под рукой',`<p>${apple?'<b>Safari:</b> нажмите «Поделиться», затем «На экран Домой».':'<b>Меню браузера:</b> выберите «Установить приложение» или «Добавить на главный экран».'}</p><p>Сначала дождитесь «Готово к игре без интернета». После установки можно играть без сети.</p><p>Прогресс хранится на этом устройстве.</p>`,[{text:'Назад',cancel:true,action:()=>{}}]);
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
window.addEventListener('appinstalled',()=>{installPrompt=null;$('install').textContent='Об установке';});
$('start').onclick=requestStart;$('continue').onclick=()=>openGame('regular');$('back').onclick=menu;$('how').onclick=()=>help();$('game-help').onclick=()=>help();$('settings').onclick=settings;$('install').onclick=install;
$('sound').onclick=settings;
function syncOtherTab(){
 if(!pendingStorage||busy||saveDirty)return;
 const latest=loadProgress(storage);if(latest.warning){warning(latest.warning);return;}
 pendingStorage=false;data=latest.data;try{savedRaw=storage.getItem(KEY);}catch{};
 dialogControls.close();settingsApplied();menu();
}
window.addEventListener('storage',e=>{if(e.key!==KEY)return;pendingStorage=true;syncOtherTab();});
settingsApplied();menu();
try{const resume=sessionStorage.getItem('kitchen-update-screen');sessionStorage.removeItem('kitchen-update-screen');if(resume==='daily'&&data.daily.game)openGame('daily');else if(resume==='relaxed'&&data.relaxed.game)openGame('relaxed');else if(resume==='game'&&data.game)openGame('regular');else if(resume==='book')book();else if(resume==='collection')collection();}catch{}
let updater=null,updateRegistration=null,updateAvailable=false,checking=null,preparing=null;
let updateState='idle',downloadInfo=null,lastCheck=0;
const updateMessages={idle:'',checking:'Проверяем обновление…',current:'У вас последняя версия игры.',available:'Новая версия готова. Партия сохранится.',downloading:'Загружаем новую версию…',waiting:'Обновим после этого хода…',activating:'Открываем обновлённую игру…','save-error':'Не удалось сохранить партию. Обновление отложено.','retry':'Обновление пока не применилось. Попробуйте ещё раз.','download-error':'Загрузка не завершена. Игра работает; попробуйте ещё раз.','check-error':'Не удалось проверить. Проверьте интернет и попробуйте ещё раз.'};
function updateText(){return updateState==='downloading'&&downloadInfo?.total?`Загружаем обновление: ${downloadInfo.done} из ${downloadInfo.total}`:updateMessages[updateState];}
function paintUpdateStatus(){
 const button=$('check-update'),status=$('update-status');if(!button||!status)return;
 status.textContent=updateText();button.textContent=updateAvailable?'Обновить игру':'Проверить обновление';
 button.disabled=['checking','downloading','waiting','activating'].includes(updateState);
}
function showUpdate(state,info){
 if(updateAvailable&&['checking','current','downloading','download-error','check-error'].includes(state))return;
 updateState=state;downloadInfo=info??null;if(state==='available')updateAvailable=true;
 const notice=!['idle','checking','current','check-error'].includes(state);
 $('update-notice').hidden=!notice;$('update-text').textContent=updateText();
 $('update-game').textContent=updateAvailable?'Обновить игру':'Повторить загрузку';
 $('update-game').disabled=['downloading','waiting','activating'].includes(state);
 $('app').inert=state==='activating';paintUpdateStatus();
}
async function manualUpdateCheck(){
 if(updateAvailable&&updater){dialogControls.close();updater.request();return;}
 await checkUpdates(true);
}
function checkUpdates(force=false){
 if(checking)return checking;
 if(!force&&(document.hidden||Date.now()-lastCheck<30000))return Promise.resolve();
 lastCheck=Date.now();showUpdate('checking');
 checking=(async()=>{
  try{
   const registration=updateRegistration??await offlineRegistration(navigator.serviceWorker);
   watchUpdates(registration);
   const result=await checkForUpdate(registration);
   if(result==='available'&&navigator.serviceWorker.controller)showUpdate('available');
   else showUpdate('current');
  }catch{showUpdate(['downloading','download-error'].includes(updateState)?'download-error':'check-error');}
  finally{checking=null;paintUpdateStatus();}
 })();return checking;
}
function watchUpdates(registration){
 if(updater)return;
 updateRegistration=registration;
 updater=createUpdater({serviceWorker:navigator.serviceWorker,registration,isBusy:()=>busy,
  save:()=>{
   const snapshot=saveBeforeUpdate(storage,data,savedRaw,saveDirty);if(!snapshot.ok)return false;
   data=snapshot.data;savedRaw=snapshot.raw;saveDirty=false;pendingStorage=false;
   try{sessionStorage.setItem('kitchen-update-screen',!$('game').hidden?(gameMode==='daily'?'daily':gameMode==='relaxed'?'relaxed':'game'):!$('book').hidden?'book':!$('collection').hidden?'collection':'menu');return true;}catch{return false;}
  },reload:()=>location.reload(),show:showUpdate});
 $('update-game').onclick=()=>updateAvailable?updater.request():checkUpdates(true);
}
function prepareOffline(){
 if(preparing)return preparing;
 if(!('serviceWorker' in navigator)||!window.isSecureContext){$('offline').textContent='Для автономной установки откройте игру по HTTPS.';return Promise.resolve();}
 preparing=(async()=>{
  let port,timer;
  try{
   const registration=updateRegistration??await offlineRegistration(navigator.serviceWorker);
   watchUpdates(registration);checkUpdates();
   if(!registration.active){
    // Download progress extends the installation deadline; activation remains bounded.
    await checkForUpdate(registration);
    await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),120000);})]);clearTimeout(timer);
   }
   const channel=new MessageChannel();port=channel.port1;
   const ready=await new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),15000);port.onmessage=e=>resolve(e.data.ready);registration.active.postMessage({type:'CHECK_OFFLINE'},[channel.port2]);});
   $('offline').textContent=ready?'Готово к игре без интернета':'Ресурсы ещё загружаются. Игра продолжит загрузку при подключении.';
  }catch{$('offline').textContent='Офлайн-версия пока не готова. Проверим снова при подключении.';}
  finally{clearTimeout(timer);port?.close();preparing=null;}
 })();return preparing;
}
function resumeUpdates(){if(!document.hidden){syncOtherTab();prepareOffline();checkUpdates();}}
prepareOffline();window.addEventListener('online',resumeUpdates);window.addEventListener('pageshow',resumeUpdates);
document.addEventListener('visibilitychange',resumeUpdates);
setInterval(resumeUpdates,60000);
// Calendar refresh updates the menu only; it never replaces a running game.
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDailyMenu();});
setInterval(()=>{if(!document.hidden&&!$('menu').hidden)refreshDailyMenu();},60000);
