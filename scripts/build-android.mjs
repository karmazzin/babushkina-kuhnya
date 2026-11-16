import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),out=new URL('build/android-web/',root);
const {version}=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
const parts=version.split('.').map(Number);
if(parts.length!==3||parts.some(n=>!Number.isInteger(n)||n<0||n>999)||parts[0]>2000)throw Error('Android version requires major <= 2000 and minor/patch <= 999');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await cp(new URL('dist/',root),out,{recursive:true,filter:src=>!['sw.js','cache-install.js','manifest.webmanifest'].includes(src.split('/').pop())});
let html=await readFile(new URL('index.html',out),'utf8');
html=html.replace('src="./app.js"','src="./android-entry.js"').replace(/<link[^>]+rel="manifest"[^>]*>\n?/,'');
await writeFile(new URL('index.html',out),html);
// Capacitor supplies CSS insets on WebViews that do not implement env() correctly.
for(const file of ['style.css','gameplay.css']){
 const url=new URL(file,out),css=await readFile(url,'utf8');
 await writeFile(url,css.replace(/env\((safe-area-inset-(?:top|right|bottom|left))\)/g,'var(--$1, env($1))'));
}
await build({absWorkingDir:fileURLToPath(root),entryPoints:['native/android-entry.js'],outfile:fileURLToPath(new URL('android-entry.js',out)),bundle:true,format:'esm',target:'chrome89',minify:true,legalComments:'eof'});
await writeFile(new URL('android/app/version.properties',root),`# Generated from package.json by android:prepare\nversionName=${version}\nversionCode=${parts[0]*1000000+parts[1]*1000+parts[2]}\n`);
console.log(`Android ${version}: bundled local assets in ${fileURLToPath(out)}`);
