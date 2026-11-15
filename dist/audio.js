const FILES={music:'porch-swing.m4a',select:'select.mp3',match:'match.mp3',land:'land.mp3',invalid:'invalid.mp3',win:'win.mp3'};
export function createAudio(factory=src=>new Audio(src)){
 const clips=Object.fromEntries(Object.entries(FILES).map(([name,file])=>[name,factory(new URL(`./assets/audio/${file}`,import.meta.url).href)]));
 const priming={};
 let unlocked=false,visible=true,settings={music:true,sound:true};
 clips.music.loop=true;clips.music.volume=.19;clips.music.preload='auto';
 for(const [name,clip] of Object.entries(clips))if(name!=='music'){clip.volume=name==='match'?.35:.26;clip.preload='auto';}
 const safelyPlay=clip=>Promise.resolve(clip.play()).catch(()=>{});
 function sync(){if(unlocked&&visible&&settings.music)safelyPlay(clips.music);else clips.music.pause();if(!visible||!settings.sound)for(const [name,c] of Object.entries(clips))if(name!=='music')c.pause();}
 return {
  configure(next){settings={...settings,...next};sync();},
  async unlock(){if(unlocked)return;unlocked=true;
   for(const [name,c] of Object.entries(clips))if(name!=='music'){const volume=c.volume;c.volume=0;priming[name]=Promise.resolve(c.play()).then(()=>{c.pause();c.currentTime=0;c.volume=volume;}).catch(()=>{c.volume=volume;});}
   sync();},
  visibility(value){visible=value;sync();},
  async effect(name){await priming[name];if(!unlocked||!visible||!settings.sound||!clips[name]||name==='music')return;const c=clips[name];c.currentTime=0;await safelyPlay(c);},
 };
}
