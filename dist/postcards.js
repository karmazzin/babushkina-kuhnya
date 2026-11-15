import {displayDay} from './daily.js';
const MOTIFS=[
 ['Тёплое утро','Пусть день начнётся с чего-нибудь хорошего.',1,'sage'],
 ['Заходите на чай','Для доброй беседы всегда найдётся время.',0,'rose'],
 ['Домашний уют','Маленькие радости делают дом теплее.',4,'honey'],
 ['Обед с любовью','Самое вкусное — разделить угощение.',3,'sage'],
 ['Воскресный стол','Пусть за столом будет место для улыбки.',2,'blue'],
 ['Сладкая минутка','Можно никуда не спешить.',4,'rose'],
 ['Румяные пирожки','Хорошее настроение начинается с малого.',0,'honey'],
 ['Блинчики для вас','Сегодня есть повод себя порадовать.',1,'blue'],
 ['Семейный рецепт','Тёплые воспоминания всегда с нами.',2,'sage'],
 ['Запах домашнего обеда','Пусть дома будет спокойно и хорошо.',3,'honey'],
 ['Гости на пороге','Радость становится больше, когда ею делятся.',0,'rose'],
 ['Спасибо за компанию','Каждое угощение — маленькая добрая история.',4,'blue']
];
export function postcardInfo(index){const [title,message,food,tone]=MOTIFS[index%MOTIFS.length];return {title,message,food,tone,edition:Math.floor(index/MOTIFS.length)+1};}
export function postcardMarkup(day,index,compact=false){
 const c=postcardInfo(index);
 return `<article class="postcard tone-${c.tone} ${compact?'postcard-small':''}"><div class="postcard-trim" aria-hidden="true">❦ · ❦</div><span class="postcard-number">Открытка № ${index+1}</span><div class="postcard-picture"><span class="food f${c.food}" aria-hidden="true"></span><span class="postcard-sprig" aria-hidden="true">❧</span></div><h3>${c.title}</h3>${compact?'':`<p>${c.message}</p>`}<time datetime="${day}">${displayDay(day)}</time><span class="postcard-stamp" aria-hidden="true">С любовью</span></article>`;
}
export function renderCollection(root,cards,page,onOpen,onNav,onDaily){
 const total=Math.max(1,Math.ceil(cards.length/4)),current=Math.max(0,Math.min(page,total-1));
 const indices=Array.from({length:cards.length},(_,i)=>cards.length-1-i).slice(current*4,current*4+4);
 root.innerHTML=cards.length?`<p class="collection-note">Каждая открытка — за одно угощение.<br>Здесь всё, что вы собрали.</p><div class="postcard-grid">${indices.map(i=>`<button class="postcard-open" data-card="${i}" aria-label="Открытка ${i+1}: ${postcardInfo(i).title}, ${displayDay(cards[i])}">${postcardMarkup(cards[i],i,true)}</button>`).join('')}</div><div class="book-pager"><button id="cards-prev" class="round-button" aria-label="Предыдущие открытки" ${current===0?'disabled':''}>‹</button><span>${current+1} / ${total} · всего ${cards.length}</span><button id="cards-next" class="round-button" aria-label="Следующие открытки" ${current===total-1?'disabled':''}>›</button></div>`:`<div class="collection-empty"><span class="empty-postcard" aria-hidden="true">❦</span><h2>Здесь будут ваши открытки</h2><p>Пройдите «Угощение дня»,<br>и первая открытка останется здесь.</p><p>Играйте, когда хочется.<br>Пропуски ничего не отнимают.</p><button id="cards-play" class="button primary">Попробовать угощение</button></div>`;
 root.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>onOpen(Number(b.dataset.card)));
 if(cards.length){root.querySelector('#cards-prev').onclick=()=>onNav(current-1);root.querySelector('#cards-next').onclick=()=>onNav(current+1);}else root.querySelector('#cards-play').onclick=onDaily;
}
