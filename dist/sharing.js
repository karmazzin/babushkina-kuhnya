import {platform} from './platform.js';
// The file is prepared before the click, preserving mobile user activation.
export async function sharePostcard(api,file){
 try{if(!api.share||!api.canShare?.({files:[file]}))return 'unsupported';await api.share({files:[file]});return 'shared';}
 catch(error){return error.name==='AbortError'?'cancelled':'failed';}
}
export function bindPostcardSharing(root){
 const button=root.querySelector('[data-share-card]'),status=root.querySelector('.share-status');if(!button)return;
 const path=button.dataset.shareCard;let file;
 if(platform.native){
  const download=root.querySelector('[download]');if(download)download.hidden=true;
  const ready=fetch(path).then(r=>{if(!r.ok)throw Error('image');return r.blob();}).then(blob=>platform.sharing.prepare(new File([blob],path.split('/').pop(),{type:'image/jpeg'}))).then(uri=>{file=uri;if(root.contains(button)){button.disabled=false;status.textContent='Выберите, кому отправить открытку.';}}).catch(()=>{if(root.contains(button))status.textContent='Не удалось подготовить открытку. Откройте её ещё раз.';});
  button.onclick=async()=>{if(!file)return;button.disabled=true;const result=await platform.sharing.share(file);if(!root.contains(button))return;button.disabled=false;status.textContent=result==='failed'?'Не удалось отправить открытку. Попробуйте ещё раз.':'Выберите, кому отправить открытку.';};
  return ready;
 }
 const ready=fetch(path).then(r=>{if(!r.ok)throw Error('image');return r.blob();}).then(blob=>{file=new File([blob],path.split('/').pop(),{type:'image/jpeg'});if(root.contains(button)){button.disabled=false;status.textContent='Выберите мессенджер или сохраните картинку.';}}).catch(()=>{if(root.contains(button))status.textContent='Не удалось подготовить отправку. Попробуйте сохранить картинку.';});
 button.onclick=()=>{if(!file)return;button.disabled=true;sharePostcard(navigator,file).then(result=>{if(!root.contains(button))return;button.disabled=false;if(result==='unsupported'||result==='failed')status.textContent='Нажмите «Сохранить картинку», затем прикрепите её в вашем мессенджере.';});};
 return ready;
}
