import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
test('Android packaging contains local gameplay assets, native entry and consistent version',async()=>{
 execFileSync(process.execPath,['scripts/build-android.mjs'],{cwd:root,stdio:'pipe'});
 const read=path=>readFile(new URL(path,root),'utf8');
 const html=await read('build/android-web/index.html');
 assert.match(html,/src="\.\/android-entry.js"/);assert.doesNotMatch(html,/src="\.\/app.js"/);
 await assert.rejects(access(new URL('build/android-web/sw.js',root)));
 for(const path of ['assets/postcards/card-24.jpg','assets/audio/porch-swing.m4a','assets/foods.webp'])await access(new URL('build/android-web/'+path,root));
 const version=JSON.parse(await read('package.json')).version;
 assert.match(await read('android/app/version.properties'),new RegExp(`versionName=${version.replaceAll('.','\\.')}\\n`));
 const config=JSON.parse(await read('capacitor.config.json'));assert.equal(config.server?.url,undefined);
});
