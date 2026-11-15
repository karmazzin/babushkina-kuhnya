import test from 'node:test';
import assert from 'node:assert/strict';
import {gravityMap} from '../dist/animation.js';
import {loadProgress,defaultProgress,KEY} from '../dist/storage.js';
import {createAudio} from '../dist/audio.js';
test('gravity tracks identity even when source and destination foods have identical type',()=>{
 const movements=gravityMap([14,28,29]);
 assert.deepEqual(movements.filter(m=>m.to%7===0).map(m=>[m.from,m.to]),[[-14,0],[-7,7],[0,14],[7,21],[21,28],[35,35],[42,42],[49,49]]);
 assert.equal(new Set(movements.map(m=>m.to)).size,56);
});
test('legacy settings retain progress and migrate music without resetting',()=>{
 const old=defaultProgress();delete old.settings.music;const r=loadProgress({getItem:()=>JSON.stringify(old)});
 assert.equal(r.warning,null);assert.equal(r.data.settings.music,true);
});
test('music and effects settings roundtrip independently',()=>{
 const p=defaultProgress();p.settings.music=false;p.settings.sound=true;
 assert.deepEqual(loadProgress({getItem:()=>JSON.stringify(p)}).data.settings,p.settings);
});
class Clip{constructor(src){this.src=src;this.paused=true;this.currentTime=0;}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}load(){} cloneNode(){return new Clip(this.src);}}
test('recorded audio starts only after gesture, respects separate toggles and page visibility',async()=>{
 const clips=[];const audio=createAudio(src=>{const c=new Clip(src);clips.push(c);return c;});
 audio.configure({music:true,sound:true});assert.ok(clips.every(c=>c.paused));
 await audio.unlock();assert.equal(clips[0].paused,false);audio.visibility(false);assert.equal(clips[0].paused,true);audio.visibility(true);assert.equal(clips[0].paused,false);
 audio.configure({music:false,sound:true});assert.equal(clips[0].paused,true);await audio.effect('match');assert.equal(clips.find(c=>c.src.includes('match')).paused,false);
 audio.configure({music:false,sound:false});assert.ok(clips.every(c=>c.paused));
});
test('legacy mute remains mute when music setting is introduced',()=>{const old={...defaultProgress(),settings:{sound:false,reduced:false}};assert.equal(loadProgress({getItem:()=>JSON.stringify(old)}).data.settings.music,false);});
test('first effect waits for gesture priming instead of being paused by it',async()=>{
 const releases=[];let match;
 class DelayedClip extends Clip{play(){this.paused=false;if(!this.primed){this.primed=true;return new Promise(r=>releases.push(r));}return Promise.resolve();}}
 const audio=createAudio(src=>{const c=new DelayedClip(src);if(src.includes('match.mp3'))match=c;return c;});
 audio.configure({music:false,sound:true});audio.unlock();const playing=audio.effect('match');releases.forEach(r=>r());await playing;await Promise.resolve();assert.equal(match.paused,false);
});
