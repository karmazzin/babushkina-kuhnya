import {displayDay} from './daily.js';
const MOTIFS=[
 ['Тёплого утра!','Пусть день начнётся с хорошего'],
 ['Заходите на чай!','Рада нашей встрече'],
 ['Уюта вашему дому','И тепла каждому сердцу'],
 ['С любовью к вам','Пусть на душе будет тепло'],
 ['Хорошего выходного!','Побудьте с теми, кто дорог'],
 ['Сладких мгновений','И маленьких радостей каждый день'],
 ['Домашнего тепла','Пусть рядом будут любимые'],
 ['Для вас — с любовью','Обнимаю всем сердцем'],
 ['Счастья вашему дому','Пусть близкие будут рядом'],
 ['Приятного аппетита!','И доброго дня'],
 ['Заходите в гости','Вместе всегда теплее'],
 ['Спасибо, что вы есть','Дарю вам немного тепла']
];
export function postcardInfo(index){const [title,message]=MOTIFS[index%MOTIFS.length];return {title,message,image:`assets/postcards/card-${String(index%MOTIFS.length+1).padStart(2,'0')}.jpg`,edition:Math.floor(index/MOTIFS.length)+1};}
export function postcardMarkup(day,index,compact=false){
 const c=postcardInfo(index);
 return `<article class="postcard ${compact?'postcard-small':''}"><img class="postcard-art" src="${c.image}" alt="${c.title}. ${c.message}" ${compact?'loading="lazy"':''}><div class="postcard-caption">Открытка № ${index+1} · <time datetime="${day}">${displayDay(day)}</time></div></article>${compact?'':`<div class="postcard-sharing"><button class="button primary" data-share-card="${c.image}" disabled>Поделиться открыткой</button><a class="button secondary" href="${c.image}" download="otkrytka-${index+1}.jpg">Сохранить картинку</a><p class="share-status" role="status">Готовим картинку…</p></div>`}`;
}
export function renderCollection(root,cards,page,onOpen,onNav,onDaily){
 const total=Math.max(1,Math.ceil(cards.length/4)),current=Math.max(0,Math.min(page,total-1));
 const indices=Array.from({length:cards.length},(_,i)=>cards.length-1-i).slice(current*4,current*4+4);
 root.innerHTML=cards.length?`<p class="collection-note">Каждая открытка — за одно угощение.<br>Здесь всё, что вы собрали.</p><div class="postcard-grid">${indices.map(i=>`<button class="postcard-open" data-card="${i}" aria-label="Открытка ${i+1}: ${postcardInfo(i).title}, ${displayDay(cards[i])}">${postcardMarkup(cards[i],i,true)}</button>`).join('')}</div><div class="book-pager"><button id="cards-prev" class="round-button" aria-label="Предыдущие открытки" ${current===0?'disabled':''}>‹</button><span>${current+1} / ${total} · всего ${cards.length}</span><button id="cards-next" class="round-button" aria-label="Следующие открытки" ${current===total-1?'disabled':''}>›</button></div>`:`<div class="collection-empty"><h2>Здесь будут ваши открытки</h2><p>Пройдите «Угощение дня»,<br>и первая открытка останется здесь.</p><p>Играйте, когда хочется.<br>Пропуски ничего не отнимают.</p><button id="cards-play" class="button primary">Попробовать угощение</button></div>`;
 root.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>onOpen(Number(b.dataset.card)));
 if(cards.length){root.querySelector('#cards-prev').onclick=()=>onNav(current-1);root.querySelector('#cards-next').onclick=()=>onNav(current+1);}else root.querySelector('#cards-play').onclick=onDaily;
}
