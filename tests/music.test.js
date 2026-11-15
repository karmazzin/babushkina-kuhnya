import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudio} from '../dist/audio.js';
function setup(random=()=>.42){const clips=[];const audio=createAudio(src=>{const c={src,paused:true,currentTime:0,play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;}};clips.push(c);return c;},()=>0,random);return {audio,music:clips[0],clips};}
test('music shuffles full rounds without adjacent repeats, using one media element',async()=>{
 const {audio,music,clips}=setup();await audio.unlock();const heard=[];
 for(let i=0;i<24;i++){heard.push(music.src);assert.equal(music.loop,false);music.onended();}
 for(let i=0;i<24;i+=4)assert.equal(new Set(heard.slice(i,i+4)).size,4);
 for(let i=1;i<heard.length;i++)assert.notEqual(heard[i],heard[i-1]);
 assert.equal(clips.length,3);
});
test('first song is randomized and toggles resume the same position',async()=>{
 assert.notEqual(setup(()=>0).music.src,setup(()=>.99).music.src);
 const {audio,music}=setup();await audio.unlock();music.currentTime=25;const src=music.src;
 audio.configure({music:false});assert.equal(music.paused,true);audio.configure({music:true});
 audio.visibility(false);assert.equal(music.paused,true);audio.visibility(true);
 assert.equal(music.src,src);assert.equal(music.currentTime,25);assert.equal(music.paused,false);
});
test('ending while hidden selects next track but does not play until visible',async()=>{
 const {audio,music}=setup();await audio.unlock();const first=music.src;audio.visibility(false);music.onended();
 assert.notEqual(music.src,first);assert.equal(music.paused,true);audio.visibility(true);assert.equal(music.paused,false);
});
test('unavailable music is skipped with bounded retries',async()=>{
 const {audio,music}=setup();await audio.unlock();const attempted=new Set();
 for(let i=0;i<4;i++){attempted.add(music.src);music.onerror();}
 assert.equal(attempted.size,4);assert.equal(music.paused,true);audio.visibility(true);assert.equal(music.paused,true);
});
