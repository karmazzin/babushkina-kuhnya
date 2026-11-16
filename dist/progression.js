export function recordCampaignWin(data){
 const g=data.game;if(!g||g.status!=='won'||g.dailyDate||g.mode==='relaxed')return data;
 const fresh=!data.completed.includes(g.level);
 const completed=fresh?[...data.completed,g.level].sort((a,b)=>a-b):data.completed;
 return {...data,completed,unlocked:Math.max(data.unlocked,g.level+1),best:Math.max(data.best,g.score),game:{...g,starReward:g.starReward??fresh}};
}
