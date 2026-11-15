import test from 'node:test';
import assert from 'node:assert/strict';
import {resultGoalText} from '../dist/book.js';
import {createDialogControls} from '../dist/dialog.js';
class Dialog extends EventTarget{open=true;close(){this.open=false;}}
for(const exit of ['button','escape'])test(`explicit return and Escape share one destination: ${exit}`,()=>{
 const dialog=new Dialog();let returned=0,next=0;
 const controls=createDialogControls(dialog);
 const actions=controls.actions([{text:'Следующий уровень',action:()=>next++},{text:'В книгу',cancel:true,action:()=>returned++}]);
 if(exit==='button')actions[1].run();else{const e=new Event('cancel',{cancelable:true});dialog.dispatchEvent(e);assert.equal(e.defaultPrevented,true);}
 assert.equal(dialog.open,false);assert.equal(returned,1);assert.equal(next,0);
});
test('explicit next action does not also cancel and cannot be repeated',()=>{
 const d=new Dialog(),c=createDialogControls(d);let next=0,cancel=0;
 const a=c.actions([{text:'Дальше',action:()=>next++},{text:'Назад',cancel:true,action:()=>cancel++}]);
 a[0].run();a[0].run();d.dispatchEvent(new Event('cancel',{cancelable:true}));assert.equal(next,1);assert.equal(cancel,0);
});
test('every window must have exactly one explicit safe return action',()=>{
 const c=createDialogControls(new Dialog());assert.throws(()=>c.actions([{action(){}}]));assert.throws(()=>c.actions([{cancel:true,action(){}},{cancel:true,action(){}}]));
});
test('nested windows replace the Escape destination without retaining a stale action',()=>{
 const d=new Dialog(),c=createDialogControls(d);let screen='reset';
 c.actions([{cancel:true,action:()=>{screen='game';}}]);
 c.actions([{cancel:true,action:()=>{screen='settings';}}]);d.dispatchEvent(new Event('cancel',{cancelable:true}));assert.equal(screen,'settings');
});
test('loss shows actual food count, not just target',()=>{assert.equal(resultGoalText({goals:[{kind:'food',type:4,amount:20}],collected:[0,0,0,0,16]}),'Сырники: собрано 16 из 20');});
test('result reports plates as actual / target',()=>{assert.equal(resultGoalText({goals:[{kind:'plates',amount:12}],plates:[0,1,2]}),'Тарелки: убрано 9 из 12');});
