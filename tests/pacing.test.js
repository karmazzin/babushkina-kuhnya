import test from 'node:test';
import assert from 'node:assert/strict';
import {createPacing} from '../dist/pacing.js';
test('speed up affects running and future animations and releases a pause',async()=>{
 let callback,delay;const clock={setTimeout:(f,ms)=>{callback=f;delay=ms;return 1;},clearTimeout:()=>{}};
 const pace=createPacing(clock),a={playbackRate:1};pace.track(a);const wait=pace.wait(260);
 pace.fast();await wait;assert.equal(a.playbackRate,4);
 const b={playbackRate:1};pace.track(b);assert.equal(b.playbackRate,4);
 const next=pace.wait(480);assert.equal(delay,120);callback();await next;
});
