import {legalMoves} from './engine.js';
export {hintAction} from './hints.js';
export const hintMove=board=>legalMoves(board)[0]??null;
export function createPacing(clock=globalThis){
 let rate=1;const animations=new Set(),pauses=new Set();
 return {
  track(a){a.playbackRate=rate;animations.add(a);a.finished?.catch(()=>{}).then(()=>animations.delete(a));return a;},
  wait(ms){return new Promise(resolve=>{const done=()=>{clock.clearTimeout(id);pauses.delete(done);resolve();};const id=clock.setTimeout(done,ms/rate);pauses.add(done);});},
  fast(){rate=4;animations.forEach(a=>a.playbackRate=rate);[...pauses].forEach(done=>done());},
  cancel(){animations.forEach(a=>a.cancel());animations.clear();[...pauses].forEach(done=>done());}
 };
}
