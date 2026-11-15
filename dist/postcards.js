import {displayDay} from './daily.js';
const MOTIFS=[
 ['Тёплого утра!','Хорошего вам дня!'],
 ['Заходите на чай!','Рада нашей встрече'],
 ['Уюта вашему дому','И тепла каждому сердцу'],
 ['С любовью к вам','Пусть на душе будет тепло'],
 ['Хорошего выходного!','Побудьте с теми, кто дорог'],
 ['Сладких мгновений','И маленьких радостей каждый день'],
 ['Домашнего тепла','Пусть рядом будут любимые'],
 ['Для вас — с любовью','Крепко обнимаю!'],
 ['Счастья вашему дому','Пусть близкие будут рядом'],
 ['Приятного аппетита!','И доброго дня'],
 ['Заходите в гости','Вместе всегда теплее'],
 ['Спасибо, что вы есть','Дарю вам немного тепла'],
 ['Пусть день порадует!','И принесёт добрые встречи'],
 ['Счастливых мгновений!','Пусть рядом будут любимые'],
 ['Доброго вечера!','Отдохните душой'],
 ['Пусть всё получится!','С теплом и верой в вас'],
 ['Радости в каждом дне!','И маленьких чудес'],
 ['Уютного чаепития!','С добрыми разговорами'],
 ['Солнечного настроения!','Пусть сердце улыбается'],
 ['Тепла и заботы!','Вам и вашим близким'],
 ['Пусть дома будет уютно!','А на душе спокойно'],
 ['Добрых вестей!','И приятных сюрпризов'],
 ['Душевного тепла!','Пусть каждый день радует'],
 ['Счастья вашему дому!','И радости за общим столом']
];
export function postcardInfo(index){const [title,message]=MOTIFS[index%MOTIFS.length];return {title,message,image:`assets/postcards/card-${String(index%MOTIFS.length+1).padStart(2,'0')}.jpg`,edition:Math.floor(index/MOTIFS.length)+1};}
export function postcardMarkup(day,index,compact=false,art=index%12){
 const c=postcardInfo(art);
 return `<article class="postcard ${compact?'postcard-small':''}"><img class="postcard-art" src="${c.image}" alt="${c.title}. ${c.message}" ${compact?'loading="lazy"':''}><div class="postcard-caption">Открытка № ${index+1} · <time datetime="${day}">${displayDay(day)}</time></div></article>${compact?'':`<div class="postcard-sharing"><button class="button primary" data-share-card="${c.image}" disabled>Поделиться открыткой</button><a class="button secondary" href="${c.image}" download="otkrytka-${index+1}.jpg">Сохранить картинку</a><p class="share-status" role="status">Готовим картинку…</p></div>`}`;
}
export function renderCollection(root,cards,page,onOpen,onNav,onDaily,art=cards.map((_,i)=>i%12)){
 const total=Math.max(1,Math.ceil(cards.length/4)),current=Math.max(0,Math.min(page,total-1));
 const indices=Array.from({length:cards.length},(_,i)=>cards.length-1-i).slice(current*4,current*4+4);
 root.innerHTML=cards.length?`<p class="collection-note">Каждая открытка — за одно угощение.<br>Здесь всё, что вы собрали.</p><div class="postcard-grid">${indices.map(i=>`<button class="postcard-open" data-card="${i}" aria-label="Открытка ${i+1}: ${postcardInfo(art[i]).title}, ${displayDay(cards[i])}">${postcardMarkup(cards[i],i,true,art[i])}</button>`).join('')}</div><div class="book-pager"><button id="cards-prev" class="round-button" aria-label="Предыдущие открытки" ${current===0?'disabled':''}>‹</button><span>${current+1} / ${total} · всего ${cards.length}</span><button id="cards-next" class="round-button" aria-label="Следующие открытки" ${current===total-1?'disabled':''}>›</button></div>`:`<div class="collection-empty"><h2>Здесь будут ваши открытки</h2><p>Пройдите «Угощение дня»,<br>и первая открытка останется здесь.</p><p>Играйте, когда хочется.<br>Пропуски ничего не отнимают.</p><button id="cards-play" class="button primary">Попробовать угощение</button></div>`;
 root.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>onOpen(Number(b.dataset.card)));
 if(cards.length){root.querySelector('#cards-prev').onclick=()=>onNav(current-1);root.querySelector('#cards-next').onclick=()=>onNav(current+1);}else root.querySelector('#cards-play').onclick=onDaily;
}
