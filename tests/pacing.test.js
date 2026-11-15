import test from 'node:test';
import assert from 'node:assert/strict';
import {createPacing,hintMove} from '../dist/pacing.js';
import {freshBoard,legalMoves} from '../dist/engine.js';
test('hint is legal and leaves the board unchanged',()=>{
 const b=freshBoard(),copy=b.slice();assert.deepEqual(hintMove(b),legalMoves(b)[0]);assert.deepEqual(b,copy);
});
test('speed up affects running and future animations and releases a pause',async()=>{
 let callback,delay;const clock={setTimeout:(f,ms)=>{callback=f;delay=ms;return 1;},clearTimeout:()=>{}};
 const pace=createPacing(clock),a={playbackRate:1};pace.track(a);const wait=pace.wait(260);
 pace.fast();await wait;assert.equal(a.playbackRate,4);
 const b={playbackRate:1};pace.track(b);assert.equal(b.playbackRate,4);
 const next=pace.wait(480);assert.equal(delay,120);callback();await next;
});
