// Explicit identities, rather than comparing food types, keep equal-looking pieces moving correctly.
export function gravityMap(removed){
 const gone=new Set(removed), result=[];
 for(let c=0;c<7;c++){
  const survivors=Array.from({length:8},(_,r)=>r*7+c).filter(i=>!gone.has(i));
  const missing=8-survivors.length;
  for(let r=0;r<8;r++)result.push({from:r<missing?(r-missing)*7+c:survivors[r-missing],to:r*7+c});
 }
 return result.sort((a,b)=>a.to-b.to);
}
export const TIMING={swap:220,highlight:260,fade:360,fall:480,settle:220};
export async function animate(elements,keyframes,options,track=()=>{}){
 const animations=elements.map(el=>el.animate(keyframes,options));
 animations.forEach(track);
 await Promise.all(animations.map(a=>a.finished.catch(()=>{})));
 return ()=>animations.forEach(a=>a.cancel());
}
