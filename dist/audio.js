const FILES={music:'porch-swing.m4a',match:'match.mp3',win:'win.mp3'};
export function createAudio(factory=src=>new Audio(src),now=()=>Date.now()){
 const clips=Object.fromEntries(Object.entries(FILES).map(([name,file])=>[name,factory(new URL(`./assets/audio/${file}`,import.meta.url).href)]));
 const priming={};
 let unlocked=false,visible=true,lastEffect=-Infinity,settings={music:true,sound:true,soundVolume:.35};
 clips.music.loop=true;clips.music.volume=.19;clips.music.preload='auto';
 const gain=()=>.16*Math.max(0,Math.min(1,settings.soundVolume??.35));
 for(const [name,clip] of Object.entries(clips))if(name!=='music'){clip.volume=gain();clip.preload='auto';}
 const safelyPlay=clip=>Promise.resolve(clip.play()).catch(()=>{});
 function hush(){for(const [name,c] of Object.entries(clips))if(name!=='music')c.pause();}
 function sync(){
  if(unlocked&&visible&&settings.music)safelyPlay(clips.music);else clips.music.pause();
  for(const [name,c] of Object.entries(clips))if(name!=='music'&&!priming[name])c.volume=gain();
  if(!visible||!settings.sound||gain()===0)hush();
 }
 return {
  configure(next){settings={...settings,...next};sync();},
  async unlock(){if(unlocked)return;unlocked=true;
   for(const [name,c] of Object.entries(clips))if(name!=='music'){
    c.volume=0;
    priming[name]=safelyPlay(c).then(()=>{c.pause();c.currentTime=0;c.volume=gain();delete priming[name];});
   }
   sync();
  },
  visibility(value){visible=value;sync();},
  async effect(name){
   await priming[name];if(!unlocked||!visible||!settings.sound||gain()===0||!clips[name]||name==='music')return;
   const time=now();if(name!=='win'&&time-lastEffect<240)return;
   lastEffect=time;hush();const c=clips[name];c.volume=gain();c.currentTime=0;await safelyPlay(c);
  },
 };
}
