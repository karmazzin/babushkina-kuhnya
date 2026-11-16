const MUSIC=['porch-swing.m4a','easy-lemon.m4a','summer-day.m4a','carefree.m4a'];
export function createAudio(factory=src=>new Audio(src),now=()=>Date.now(),random=Math.random){
 let queue=[],current=null;const failed=new Set();
 function nextSong(){
  if(!queue.length){
   queue=MUSIC.filter(file=>!failed.has(file));
   for(let i=queue.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]];}
   if(queue.length>1&&queue[0]===current)[queue[0],queue[1]]=[queue[1],queue[0]];
  }
  current=queue.shift();return current;
 }
 const FILES={music:nextSong(),match:'match.mp3',win:'win.mp3'};
 const clips=Object.fromEntries(Object.entries(FILES).map(([name,file])=>[name,factory(new URL(`./assets/audio/${file}`,import.meta.url).href)]));
 const priming={};
 let unlocked=false,visible=true,lastEffect=-Infinity,settings={music:true,sound:true,soundVolume:.35};
 clips.music.loop=false;clips.music.volume=.19;clips.music.preload='none';
 const gain=()=>.16*Math.max(0,Math.min(1,settings.soundVolume??.35));
 for(const [name,clip] of Object.entries(clips))if(name!=='music'){clip.volume=gain();clip.preload='none';}
 const safelyPlay=clip=>Promise.resolve(clip.play()).catch(()=>{});
 function hush(){for(const [name,c] of Object.entries(clips))if(name!=='music')c.pause();}
 function sync(){
  if(unlocked&&visible&&settings.music&&failed.size<MUSIC.length)safelyPlay(clips.music);else clips.music.pause();
  for(const [name,c] of Object.entries(clips))if(name!=='music'&&!priming[name])c.volume=gain();
  if(!visible||!settings.sound||gain()===0)hush();
 }
 function advance(){
  clips.music.pause();
  const file=nextSong();if(!file)return;
  clips.music.src=new URL(`./assets/audio/${file}`,import.meta.url).href;clips.music.currentTime=0;sync();
 }
 clips.music.onended=()=>{failed.clear();advance();};
 clips.music.onerror=()=>{failed.add(current);queue=queue.filter(file=>!failed.has(file));advance();};
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
