import test from 'node:test';
import assert from 'node:assert/strict';
import * as daily from '../dist/daily.js';
import {newGame,play,legalMoves,useBooster} from '../dist/engine.js';
import {defaultProgress,loadProgress} from '../dist/storage.js';

test('daily date uses the device calendar and rejects invalid dates',()=>{
 assert.equal(typeof daily.localDay,'function');
 assert.equal(daily.localDay(new Date(2026,10,15,23,59)),'2026-11-15');
 assert.equal(daily.localDay(new Date(2026,10,16,0,1)),'2026-11-16');
 for(const s of ['2026-02-30','2026-13-01','<script>','2026-1-1'])assert.equal(daily.validDay(s),false);
 assert.equal(daily.validDay('2028-02-29'),true);
});
test('daily retries repeat the same board, and saved RNG repeats subsequent turns',()=>{
 assert.equal(typeof daily.newDailyGame,'function');
 const a=daily.newDailyGame('2026-11-15'),b=daily.newDailyGame('2026-11-15');
 assert.deepEqual(a,b);assert.notDeepEqual(a.board,daily.newDailyGame('2026-11-16').board);
 assert.equal(a.moves,16);assert.equal(a.dailyDate,'2026-11-15');
 const move=legalMoves(a.board)[0],r=play(a,...move);
 assert.deepEqual(r,play(JSON.parse(JSON.stringify(b)),...move));
 assert.notEqual(r.game.rng,a.rng);
 assert.deepEqual(useBooster(a,'kettle',24),useBooster(b,'kettle',24));
});
test('winning awards one card per played date and gaps never reset collection',()=>{
 assert.equal(typeof daily.recordDailyWin,'function');
 const state={game:{...daily.newDailyGame('2026-11-15'),status:'won'},cards:['2026-10-01']};
 const copy=structuredClone(state),won=daily.recordDailyWin(state);
 assert.deepEqual(state,copy);assert.deepEqual(won.cards,['2026-10-01','2026-11-15']);
 assert.deepEqual(daily.recordDailyWin(won),won);
 assert.deepEqual(daily.recordDailyWin({...won,game:daily.newDailyGame('2026-11-16')}).cards,won.cards);
 assert.deepEqual(daily.recordDailyWin({...won,game:{...daily.newDailyGame('2026-12-01'),status:'won'}}).cards,['2026-10-01','2026-11-15','2026-12-01']);
});
test('unfinished previous day and completed today have explicit non-destructive offers',()=>{
 assert.equal(typeof daily.dailyOffer,'function');
 const state={cards:[],game:daily.newDailyGame('2026-11-15')},copy=structuredClone(state);
 assert.equal(daily.dailyOffer(state,'2026-11-16'),'previous');assert.deepEqual(state,copy);
 assert.equal(daily.dailyOffer(state,'2026-11-15'),'resume');
 assert.equal(daily.dailyOffer({game:null,cards:['2026-11-16']},'2026-11-16'),'completed');
});
test('daily save migrates independently and never modifies a campaign slot',()=>{
 assert.equal(typeof daily.newDailyGame,'function');
 const old={...defaultProgress(),game:newGame(5)};delete old.daily;
 const read=p=>loadProgress({getItem:()=>JSON.stringify(p)});
 const migrated=read(old);assert.equal(migrated.warning,null);assert.deepEqual(migrated.data.game,old.game);assert.deepEqual(migrated.data.daily,{game:null,cards:[]});
 const full={...migrated.data,daily:{game:daily.newDailyGame('2026-11-15'),cards:['2026-11-01']}};
 assert.deepEqual(read(full).data,full);
 for(const change of [{cards:['2026-02-30']},{cards:['2026-11-01','2026-11-01']},{game:{...full.daily.game,rng:-1}},{game:{...full.daily.game,dailyDate:'2026-02-30'}},{game:{...full.daily.game,dailyDate:undefined}}])assert.ok(read({...full,daily:{...full.daily,...change}}).warning);
});
