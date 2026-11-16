import test from 'node:test';
import assert from 'node:assert/strict';
import {swipeIntent} from '../dist/gestures.js';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('preview follows small movement without committing or locking an axis',()=>{
 const p=swipeIntent(8,5,1,48);
 assert.equal(p.target,null);assert.equal(p.axis,null);assert.equal(p.offset,5);assert.equal(p.previewAxis,'x');
 assert.equal(swipeIntent(8,2,1,48).offset,0);
});
test('commit threshold stays reachable on large cells and rejects diagonals and edges',()=>{
 assert.equal(swipeIntent(8,14,1,100).target,9);
 assert.equal(swipeIntent(8,12,11,48).target,null);
 assert.equal(swipeIntent(6,14,0,48).target,null);
});
// Exercise the actual application event handlers with a minimal DOM boundary.
function harness(){
 const handlers={},calls=[];const classes=()=>({add(){},remove(){}});
 const tiles=Array.from({length:56},(_,i)=>({dataset:{index:String(i)},classList:classes(),firstElementChild:{style:{}},getBoundingClientRect:()=>({width:48})}));
 let captured=false;
 const board={addEventListener:(n,f)=>handlers[n]=f,setPointerCapture(){captured=true;},hasPointerCapture:()=>captured,releasePointerCapture(){captured=false;},getBoundingClientRect:()=>({left:0,top:0,right:400,bottom:500})};
 const context={swipeIntent,tiles,$:()=>board,food:i=>tiles[i].firstElementChild,helper:null,busy:false,clearHint(){},armHint(){},activeGame:()=>({status:'playing'}),isActiveGame:()=>true,accelerate:()=>calls.push(['fast']),swap:(...args)=>calls.push(['swap',...args]),choose:i=>calls.push(['choose',i]),previewHelper(){},applyHelper:i=>calls.push(['helper',i]),document:{elementFromPoint:()=>({closest:()=>tiles[8]}),addEventListener(){}},window:{addEventListener(){}},Date,Math};
 vm.createContext(context);
 const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 vm.runInContext(source.slice(source.indexOf('let pointer=null'),source.indexOf('const dialogControls=')),context);
 const emit=(name,x=100,y=100)=>handlers[name]({pointerId:1,isPrimary:true,button:0,clientX:x,clientY:y,target:{closest:()=>tiles[8]}});
 return {emit,calls,context,tiles};
}
test('swipe commits on movement, once, and carries its visible offset into the swap',()=>{
 const h=harness();h.emit('pointerdown');h.emit('pointermove',114);
 assert.equal(h.calls.length,1);assert.equal(h.calls[0][0],'swap');assert.equal(h.calls[0][1],8);assert.equal(h.calls[0][2],9);
 assert.equal(h.calls[0][4].x,14);
 h.emit('pointermove',140);h.emit('pointerup',140);assert.equal(h.calls.length,1);
});
test('tap, ambiguous diagonal, cancel and busy input keep their distinct behavior',()=>{
 let h=harness();h.emit('pointerdown');h.emit('pointerup',102);assert.deepEqual(h.calls,[['choose',8]]);
 h=harness();h.emit('pointerdown');h.emit('pointermove',116,115);h.emit('pointerup',116,115);assert.deepEqual(h.calls,[]);
 h=harness();h.emit('pointerdown');h.emit('pointermove',105);h.emit('pointercancel');h.emit('pointerup',114);assert.deepEqual(h.calls,[]);
 h=harness();h.context.busy=true;h.emit('pointerdown');h.emit('pointerup',114);assert.deepEqual(h.calls,[['fast']]);
});
test('release-only swipe survives a synchronous outcome dialog clearing the pointer',()=>{
 const h=harness();h.context.swap=()=>vm.runInContext('resetPointer()',h.context);
 h.emit('pointerdown');assert.doesNotThrow(()=>h.emit('pointerup',114));
});
test('helper waits for release and an off-board gesture cannot commit',()=>{
 let h=harness();h.context.helper='rolling';h.emit('pointerdown');h.emit('pointermove',114);assert.deepEqual(h.calls,[]);h.emit('pointerup',114);assert.deepEqual(h.calls,[['helper',8]]);
 h=harness();h.emit('pointerdown');h.emit('pointermove',450);h.emit('pointerup',450);assert.deepEqual(h.calls,[]);
});
