import {foodPool,FOODS} from './foods.js';
export const CHAPTERS=[
 {title:'Завтрак'},
 {title:'Воскресный обед'},
 {title:'Гости к чаю'},
 {title:'Большой семейный стол'}
];
export const PLATE_LAYOUTS={
 pairs:[15,16,39,40],
 tea:[8,9,25,26,36,37],
 table:[8,40,12,36,24,10,38,22,26,43,47,45,17,31],
 corners:[9,39,11,37,15,33,19,29,23,25,43,47,17,31],
 garden:[8,47,12,43,22,33,26,29,10,45,17,38,24,31],
 ribbon:[9,40,15,47,11,36,19,43,23,33,25,29,17,38]
};
const food=(type,amount)=>({kind:'food',type,amount});
const one=(title,type,amount,moves=24)=>({title,goals:[food(type,amount)],plates:[],moves});
const two=(title,a,na,b,nb,moves=24)=>({title,goals:[food(a,na),food(b,nb)],plates:[],moves});
const table=(title,layout,count,type,amount,moves=24)=>({title,plates:PLATE_LAYOUTS[layout].slice(0,count),goals:[{kind:'plates',amount:count},...(type===undefined?[]:[food(type,amount)])],moves});
const tea=(title,count,extra=[],plates=[])=>({title,tea:count===1?[10]:[8,12],goals:[{kind:'tea',amount:count},...extra],plates,moves:24});
export const FIRST_LEVELS=[
 one('Первые блинчики',1,10),
 one('Сырники к завтраку',4,12),
 two('Завтрак на двоих',1,8,4,8),
 table('Четыре тарелочки','pairs',4),
 one('Ещё по блинчику',1,18),
 table('Семейный завтрак','tea',6,4,16),
 one('Пирожки к обеду',0,20),
 two('Суп и пельмени',2,16,3,16),
 table('Накрываем стол','table',8),
 tea('Чай к столу',1),
 table('Пирожки для гостей','corners',8,0,18),
 two('Чай после обеда',1,18,4,18),
 one('Тёплая передышка',4,18),
 table('Цветы на скатерти','garden',10),
 two('Сытное угощение',2,20,0,18),
 tea('Чай на двоих',2),
 table('Угощаем соседей','ribbon',10,2,22,23),
 table('Воскресный обед готов','table',12,2,24,23),
 one('Запеканка из печи',0,18),
 two('Обед и десерт',0,16,3,18),
 table('Кружевная скатерть','corners',8),
 tea('Чай с блинами',1,[food(1,16)]),
 table('Сырники на подносе','garden',8,4,18),
 two('Сладкая встреча',0,18,1,18),
 one('Блинчики с вареньем',1,18),
 table('Чашки в саду','ribbon',10),
 two('Домашний обед',2,20,3,18),
 tea('Сырники к чаю',2,[food(4,16)]),
 table('Запеканка к чаю','corners',10,0,22,23),
 table('Чаепитие в беседке','garden',12,4,24,23),
 one('Пышные оладьи',1,18),
 two('Завтрак выходного дня',0,18,1,18),
 table('Стол у окна','ribbon',8),
 tea('Накрываем к чаю',2,[{kind:'plates',amount:6}],PLATE_LAYOUTS.corners.slice(0,6)),
 table('Пельмени для семьи','table',8,2,20),
 two('Обед с десертом',3,20,4,20),
 one('Вкусная пауза',2,18),
 table('Праздничные салфетки','corners',10),
 two('Сладости к столу',0,22,4,18),
 tea('Оладьи к чаепитию',2,[food(1,18)]),
 table('Встречаем родных','garden',12,3,22,23),
 table('Большой семейный праздник','ribbon',14,0,24,23)
];
export function levelRecipe(level){
 const pool=foodPool(level),block=level<=6?0:Math.floor((level-7)/12)+1,step=level<=6?level-1:(level-7)%12;
 const authored=FIRST_LEVELS[level-1],template=authored??FIRST_LEVELS[30+step];
 const extra=authored?0:Math.min(8,Math.floor((level-43)/24)*2+2);
 const goals=template.goals.map(g=>g.kind==='food'?{...g,type:pool[g.type],amount:Math.min(34,g.amount+extra)}:{...g});
 const plate=goals.some(g=>g.kind==='plates'),foodGoal=goals.find(g=>g.kind==='food');
 const title=authored?template.title:template.tea?'Семейное чаепитие':plate?'Новый стол для гостей':foodGoal?`${FOODS[foodGoal.type].plural} к столу`:'Домашнее угощение';
 const chapterIndex=block===0?0:1+(block-1)%3,chapter=CHAPTERS[chapterIndex];
 return {title,goals,plates:[...template.plates],tea:[...(template.tea??[])],moves:template.moves,pool,chapter:chapter.title,chapterIndex,block,step};
}
