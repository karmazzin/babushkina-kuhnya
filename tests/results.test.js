import test from 'node:test';
import assert from 'node:assert/strict';
import {resultGoalText} from '../dist/book.js';
import {createDialogControls} from '../dist/dialog.js';
class Dialog extends EventTarget{open=true;close(){this.open=false;}}
for(const status of ['won','lost'])for(const exit of ['cross','escape'])test(`${status}: ${exit} leaves a completed board via menu`,()=>{
 const dialog=new Dialog(),cross=new EventTarget();let menu=0;
 const controls=createDialogControls(dialog,cross);controls.onDismiss(()=>menu++);
 if(exit==='cross')cross.dispatchEvent(new Event('click'));else{const e=new Event('cancel',{cancelable:true});dialog.dispatchEvent(e);assert.equal(e.defaultPrevented,true);}
 assert.equal(dialog.open,false);assert.equal(menu,1);
});
test('next level action closes without also navigating to menu',()=>{const dialog=new Dialog(),cross=new EventTarget();let menu=0;const c=createDialogControls(dialog,cross);c.onDismiss(()=>menu++);c.close();cross.dispatchEvent(new Event('click'));assert.equal(menu,0);});
test('closing ordinary help does not leave the current game',()=>{const dialog=new Dialog(),cross=new EventTarget();let menu=0;const c=createDialogControls(dialog,cross);c.onDismiss(()=>menu++);c.onDismiss(null);cross.dispatchEvent(new Event('click'));assert.equal(menu,0);});
test('loss shows actual food count, not just target',()=>{assert.equal(resultGoalText({goals:[{kind:'food',type:4,amount:20}],collected:[0,0,0,0,16]}),'Сырники: собрано 16 из 20');});
test('result reports score and plates as actual / target',()=>{assert.equal(resultGoalText({score:930,target:1000}),'Очки: 930 из 1000');assert.equal(resultGoalText({goals:[{kind:'plates',amount:12}],plates:[0,1,2]}),'Тарелки: убрано 9 из 12');});
