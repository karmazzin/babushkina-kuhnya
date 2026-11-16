import {gardenItem,gardenCapacity,starBalance,EXPANSIONS} from './garden.js';
// Coordinates in the local 2:3 illustrated yard; each new strip adds four places.
const PLACES=[[57,22],[78,31],[29,44],[45,53],[74,55],[84,66],[26,66],[47,73],[23,83],[43,87],[63,82],[80,88]];
export function gardenSprite(index){return `<span class="garden-sprite" style="--sx:${index%4*100/3}%;--sy:${Math.floor(index/4)*100/3}%" aria-hidden="true"></span>`;}
export function renderGarden(root,data,{onBack,onPlot,onExpand,onPlay}){
 const capacity=gardenCapacity(data),cost=EXPANSIONS[data.garden.expansion];
 root.innerHTML=`<header class="garden-header"><button id="garden-back" class="round-button" aria-label="Главное меню">‹</button><h1 class="garden-title">Мой огород</h1><span class="garden-balance" aria-label="Звёзд: ${starBalance(data)}">${starBalance(data)} <span aria-hidden="true">★</span></span></header><div class="garden-stage"><div class="garden-map" role="group" aria-label="Ваш участок">${PLACES.slice(0,capacity).map(([x,y],slot)=>{
 const plot=data.garden.plots.find(p=>p.slot===slot),item=plot&&gardenItem(plot.item),label=item?item.variants[plot.variant]:'Посадить или построить';
 return `<button class="garden-plot ${plot?'planted':'empty'}" data-plot="${slot}" style="--x:${x}%;--y:${y}%;z-index:${Math.round(y)}" aria-label="Место ${slot+1}: ${label}">${plot?gardenSprite(item.sprite+plot.variant):'<span class="plot-diamond"></span><span class="plot-add" aria-hidden="true"></span>'}</button>`;
 }).join('')}${cost!==undefined?`<div class="garden-meadow" style="--edge:${data.garden.expansion===0?61:79}%"><span>Место для новых идей</span></div><button id="garden-expand" class="garden-expand" style="top:${data.garden.expansion===0?72:87}%">Расширить <b>${cost} ★</b><small>Ещё 4 места</small></button>`:''}</div></div><footer class="garden-footer"><p id="garden-message" role="status">${data.garden.plots.length?'Нажмите на посадку, чтобы выбрать оформление':'Нажмите + и выберите, что здесь вырастет'}</p><button id="garden-play" class="button primary">${data.game&&['playing','helpers'].includes(data.game.status)?'Продолжить уровень '+data.game.level:'Играть · уровень '+data.unlocked}<span>Новый уровень — звёздочка для огорода</span></button></footer>`;
 root.querySelector('#garden-back').onclick=onBack;
 root.querySelectorAll('[data-plot]').forEach(b=>b.onclick=()=>onPlot(Number(b.dataset.plot)));
 const expand=root.querySelector('#garden-expand');if(expand)expand.onclick=onExpand;
 root.querySelector('#garden-play').onclick=onPlay;
}
