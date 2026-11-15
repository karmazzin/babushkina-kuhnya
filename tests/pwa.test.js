import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const root=new URL('../dist/',import.meta.url);
test('manifest keeps all launch URLs inside the GitHub Pages project',async()=>{
 const m=JSON.parse(await fs.readFile(new URL('manifest.webmanifest',root),'utf8'));
 const base='https://karmazzin.github.io/babushkina-kuhnya/';
 for(const key of ['id','start_url','scope'])assert.ok(new URL(m[key],base).href.startsWith(base));
 assert.equal(m.display,'standalone');
 for(const purpose of ['any','maskable'])for(const n of [192,512]){
  const icon=m.icons.find(i=>i.purpose===purpose&&i.sizes===`${n}x${n}`);assert.ok(icon,`${purpose} ${n}`);
  const png=await fs.readFile(new URL(icon.src,root));assert.equal(png.readUInt32BE(16),n);assert.equal(png.readUInt32BE(20),n);
 }
});
test('favicon, Apple icon and social preview exist with correct formats and metadata',async()=>{
 const ico=await fs.readFile(new URL('favicon.ico',root));assert.equal(ico.readUInt16LE(2),1);assert.ok(ico.readUInt16LE(4)>=3);
 const apple=await fs.readFile(new URL('assets/apple-touch-icon.png',root));assert.equal(apple.readUInt32BE(16),180);assert.equal(apple.readUInt32BE(20),180);
 const og=await fs.readFile(new URL('assets/social-preview.png',root));assert.equal(og.readUInt32BE(16),1200);assert.equal(og.readUInt32BE(20),630);
 const html=await fs.readFile(new URL('index.html',root),'utf8');
 for(const marker of ['rel="canonical"','name="application-name"','name="mobile-web-app-capable"','property="og:image"','name="twitter:card"','./favicon.ico','./assets/apple-touch-icon.png'])assert.ok(html.includes(marker),marker);
 assert.ok(!html.includes('maximum-scale'));
});
