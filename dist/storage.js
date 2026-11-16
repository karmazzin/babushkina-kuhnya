import {defaultProgress,normalizeProgress,mergeAchievements,achievementSnapshot} from './progress-data.js';
export {defaultProgress} from './progress-data.js';
export const KEY='babushkina-kuhnya:progress';
export const BACKUP_KEY=KEY+':backup',CHECKPOINT_KEY=KEY+':achievements';
const RECOVERED_KEY=KEY+':recovery-complete';
const recoveryKeys=['babushkina-kuhnya:v3','babushkina-kuhnya:v2','babushkina-kuhnya:v1'];
const decode=raw=>normalizeProgress(JSON.parse(raw));
const tryDecode=raw=>{try{return raw===null?null:decode(raw);}catch{return null;}};
const recoveredMessage='Сохранение восстановлено. Пройденные уровни и коллекции сохранены; повреждённую партию можно начать заново.';
export function loadProgress(storage){
 try{
  const raw=storage.getItem(KEY),primary=tryDecode(raw),backup=tryDecode(storage.getItem(BACKUP_KEY)),checkpoint=tryDecode(storage.getItem(CHECKPOINT_KEY));
  const usableBackup=backup&&(!checkpoint||backup.data.resetToken===checkpoint.data.resetToken)?backup:null;
  let data=primary?.data??usableBackup?.data??checkpoint?.data??defaultProgress(),repaired=primary?.repaired??raw!==null;
  if(!primary&&(backup||checkpoint))repaired=true;
  if(checkpoint&&checkpoint.data.resetToken===data.resetToken){
   if(checkpoint.data.unlocked>data.unlocked)repaired=true;
   const garden=!primary||!primary.gardenValid||checkpoint.data.unlocked>data.unlocked?checkpoint.data.garden:data.garden;
   data={...mergeAchievements(data,checkpoint.data),garden};
  }
  // Read abandoned keys once. Recover achievements, never revive obsolete game rules.
  if(storage.getItem(RECOVERED_KEY)!=='done')for(const key of recoveryKeys){
   const prior=tryDecode(storage.getItem(key));if(!prior)continue;
   if(prior.data.unlocked>data.unlocked)data={...data,game:prior.data.game,garden:prior.gardenValid?prior.data.garden:data.garden};
   data=mergeAchievements(data,prior.data);repaired=true;
  }
  return {data,warning:repaired?recoveredMessage:null};
 }catch{return {data:defaultProgress(),warning:'Хранилище недоступно. Не закрывайте игру: прогресс сейчас не сохраняется.'};}
}
export function saveProgress(storage,data){
 try{
  const raw=JSON.stringify(data),clean=normalizeProgress(data).data,previous=storage.getItem(KEY),old=tryDecode(previous),backup=tryDecode(storage.getItem(BACKUP_KEY));
  if(clean.resetToken!==(old?.data.resetToken??backup?.data.resetToken??'initial'))storage.setItem(BACKUP_KEY,raw);
  else if(old&&!old.repaired&&(!backup||old.data.resetToken!==backup.data.resetToken||old.data.unlocked>=backup.data.unlocked))storage.setItem(BACKUP_KEY,previous);
  const checkpoint=tryDecode(storage.getItem(CHECKPOINT_KEY));
  const achievements=checkpoint?.data.resetToken===clean.resetToken?mergeAchievements(clean,checkpoint.data):clean;
  if(checkpoint?.data.resetToken===clean.resetToken&&checkpoint.data.unlocked>clean.unlocked)achievements.garden=checkpoint.data.garden;
  storage.setItem(CHECKPOINT_KEY,JSON.stringify(achievementSnapshot(achievements)));
  storage.setItem(RECOVERED_KEY,'done');
  // The primary is written last. A failure before this point leaves it intact.
  storage.setItem(KEY,raw);return true;
 }catch{return false;}
}
// An explicit device reset starts a new generation of local backups.
export function resetProgress(storage,progress=defaultProgress()){
 const data={...progress,resetToken:globalThis.crypto.randomUUID()};
 const ok=saveProgress(storage,data);return {ok,data};
}
export function saveBeforeUpdate(storage,data,baseline,dirty=false){
 try{
  const current=storage.getItem(KEY);
  if(current!==baseline){
   if(dirty)return {ok:false,data};
   const latest=loadProgress(storage);if(latest.warning)return {ok:false,data};
   data=latest.data;
  }
  if(!saveProgress(storage,data))return {ok:false,data};
  return {ok:true,data,raw:storage.getItem(KEY)};
 }catch{return {ok:false,data};}
}
