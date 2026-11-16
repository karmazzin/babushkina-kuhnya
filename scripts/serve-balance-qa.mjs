// Local-only fixtures; nothing from this file is shipped in dist.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {defaultProgress,KEY} from '../dist/storage.js';
import {newGame} from '../dist/engine.js';
import {newDailyGame,localDay} from '../dist/daily.js';
import {newRelaxedGame} from '../dist/relaxed.js';
import {recordCampaignWin} from '../dist/progression.js';
import {RECIPE_CARDS,recipeMilestone} from '../dist/recipe-cards.js';
import {TEA} from '../dist/tea.js';
const root=fileURLToPath(new URL('../dist',import.meta.url)),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.m4a':'audio/mp4','.mp3':'audio/mpeg','.txt':'text/plain'};
function fixture(scene){
 let p=defaultProgress(),screen='game';p.settings={sound:false,music:false,reduced:true,soundVolume:.35};p.seenHelpers=['rolling','kettle'];
 p.game=newGame(4,{seed:123});p.unlocked=4;
 if(scene==='helpers'||scene==='helper-win'){p.game.moves=0;p.game.status='helpers';if(scene==='helper-win')p.game.plates=[24];}
 if(scene==='loss'){p.game.moves=0;p.game.boosters={rolling:0,kettle:0};p.game.status='lost';}
 if(scene==='recipe'){p.completed=[1,2,3,4,5];p.game=newGame(6,{seed:111});p.game.plates=[];p.game.goals.filter(g=>g.kind==='food').forEach(g=>p.game.collected[g.type]=g.amount);p.game.status='won';p=recordCampaignWin(p);}
 if(scene==='foods'){p.unlocked=67;p.completed=Array.from({length:66},(_,i)=>i+1);p.game=newGame(67,{seed:239});p.recipes={unlocked:RECIPE_CARDS.slice(0,6).map(r=>r.id),milestones:Array.from({length:6},(_,i)=>recipeMilestone(i))};}
 if(scene==='relaxed'){p.relaxed.game=newRelaxedGame(4,{seed:209});screen='relaxed';}
 if(scene?.startsWith('tea')){
  const level=scene==='tea-double'?16:scene==='tea-plates'?34:scene==='tea-food'?22:10;
  p.unlocked=level;p.completed=Array.from({length:level-1},(_,i)=>i+1);p.game=newGame(level,{seed:2});p.seenTea=scene!=='tea-intro';p.settings.reduced=false;
  const rewards=RECIPE_CARDS.filter((_,i)=>recipeMilestone(i)<level);p.recipes={unlocked:rewards.map(r=>r.id),milestones:rewards.map((_,i)=>recipeMilestone(i))};
  if(['tea-finish','tea-swap','tea-helpers','tea-food'].includes(scene)){
   const b=Array.from({length:56},(_,i)=>p.game.pool[(Math.floor(i/7)*2+i%7)%5]);b[42]=TEA;
   if(scene==='tea-swap'){b[49]=b[28]=b[35]=1;b[21]=3;}
   else{b[49]=b[50]=b[44]=1;b[51]=2;}
   p.game.board=b;
  }
  if(scene==='tea-helpers'){p.game.moves=0;p.game.status='helpers';}
 }
 if(scene==='postcard'){
  p.daily.cards=Array.from({length:13},(_,i)=>`2026-10-${String(i+1).padStart(2,'0')}`);p.daily.art=Array.from({length:13},(_,i)=>i);
  p.daily.game=newDailyGame(localDay());p.daily.game.plates=[];p.daily.game.goals.filter(g=>g.kind==='food').forEach(g=>p.daily.game.collected[g.type]=g.amount);p.daily.game.status='won';screen='daily';
 }
 return {p,screen};
}
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/_qa'){
  const scene=url.searchParams.get('scene');
  if(!scene){res.writeHead(200,{'Content-Type':mime['.html']}).end('<h1>Local balance QA</h1>'+['tea-intro','tea','tea-double','tea-plates','tea-finish','tea-swap','tea-helpers','tea-food','helpers','helper-win','loss','recipe','foods','relaxed','postcard'].map(s=>`<p><a href="/_qa?scene=${s}">${s}</a></p>`).join(''));return;}
  const {p,screen}=fixture(scene),json=JSON.stringify(JSON.stringify(p)).replaceAll('<','\\u003c');
  res.writeHead(200,{'Content-Type':mime['.html'],'Cache-Control':'no-store'}).end(`<script>localStorage.setItem(${JSON.stringify(KEY)},${json});sessionStorage.setItem('kitchen-update-screen',${JSON.stringify(screen)});location.replace('/game/');</script>`);return;
 }
 try{let path=decodeURIComponent(url.pathname);if(!path.startsWith('/game/'))throw Error();path=path.slice(5);if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root+sep))throw Error();res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'}).end(await readFile(file));}catch{res.writeHead(404).end('Not found');}
}).listen(Number(process.env.PORT??4318),'127.0.0.1',()=>console.log(`QA: http://127.0.0.1:${process.env.PORT??4318}/_qa`));
