import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('displayed build identifies the shipped page and its integrity hash includes the stamp',async()=>{
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 const sw=await readFile(new URL('../dist/sw.js',import.meta.url),'utf8');
 const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
 const id=sw.match(/const CACHE='babushkina-kuhnya-([a-f0-9]+)'/)[1];
 assert.match(pkg.version,/^\d+\.\d+\.\d+$/);
 assert.equal(html.match(/name="kitchen-version" content="([^"]+)"/)?.[1],pkg.version);
 assert.equal(html.match(/name="kitchen-build" content="([^"]+)"/)?.[1],id.slice(0,8));
 const hashes=JSON.parse(sw.match(/const HASHES=([\s\S]*?);\n\/\/ END RELEASE/)[1]);
 assert.equal(hashes['index.html'],createHash('sha256').update(html).digest('hex'));
});
