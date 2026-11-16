import {Capacitor,SystemBars,registerPlugin} from '@capacitor/core';
import {App} from '@capacitor/app';
import {Filesystem} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {platform} from '../dist/platform.js';
import {createNativeStorage} from '../dist/native-storage.js';
import {createNativeSharing} from '../dist/native-sharing.js';
import {STORAGE_KEYS,loadProgress} from '../dist/storage.js';

const appRoot=document.getElementById('app');appRoot.inert=true;
async function start(){
 if(!Capacitor.isNativePlatform())throw Error('Android runtime unavailable');
 platform.native=true;
 platform.storage=await createNativeStorage(registerPlugin('KitchenSave'),STORAGE_KEYS,state=>platform.onSaveState?.(state));
 // Do not open a default game over unreadable/corrupt native data.
 if(loadProgress(platform.storage).unrecoverable)throw Error('Save could not be read');
 platform.app=App;platform.sharing=createNativeSharing(Filesystem,Share);
 await SystemBars.setStyle({style:'LIGHT'});
 await import('../dist/app.js');appRoot.inert=false;
}
start().catch(()=>{
 const app=appRoot;app.inert=false;app.replaceChildren();
 const panel=document.createElement('section');panel.className='menu-card';
 const message=document.createElement('p');message.className='welcome';message.textContent='Не удалось открыть игру или прочитать сохранение. Данные не сброшены.';
 const retry=document.createElement('button');retry.className='button primary';retry.textContent='Попробовать ещё раз';retry.onclick=()=>location.reload();
 panel.append(message,retry);app.append(panel);
 document.getElementById('offline')?.remove();
});
