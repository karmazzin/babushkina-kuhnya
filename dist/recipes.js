export const CHAPTERS=[
 {title:'Завтрак',dish:'Бабушкины блины',types:[1,4],ingredients:'Молоко · яйца · мука · щепотка соли',steps:['Размешайте яйца с молоком, добавьте муку и соль. Тесто должно легко стекать с ложки.','Выпекайте тонкие блины на разогретой сковороде с небольшим количеством масла.','Сложите стопкой и подайте со сметаной или вареньем.']},
 {title:'Воскресный обед',dish:'Домашние пельмени',types:[2,3],ingredients:'Мука · вода · яйцо · фарш · лук · соль',steps:['Замесите мягкое тесто из муки, воды, яйца и соли. Дайте ему отдохнуть.','Смешайте фарш с мелко нарезанным луком. Раскатайте тесто, вырежьте кружочки и защипните начинку.','Варите пельмени в кипящей подсоленной воде до полной готовности начинки. Подайте со сметаной.']},
 {title:'Гости к чаю',dish:'Сырники к чаю',types:[4,0],ingredients:'Творог · яйцо · мука · сахар · масло',steps:['Разомните творог с яйцом и небольшим количеством сахара, добавьте немного муки.','Сформируйте небольшие сырники, слегка обваляйте в муке.','Обжарьте на умеренном огне до золотистого цвета и готовности внутри. Подайте с вареньем.']}
];
const food=(type,amount)=>({kind:'food',type,amount});
const plates=cells=>({kind:'plates',amount:cells.length});
const center=[23,24,30,31],tea=[16,17,18,23,24,25],table=[16,17,18,23,25,30,31,32],guests=[15,16,17,18,19,29,30,31,32,33],feast=[15,16,17,18,19,22,26,29,30,31,32,33];
// Each early level has its own composition. Plates stay under their original cells.
export const FIRST_LEVELS=[
 {title:'Первые блинчики',goals:[food(1,10)]},
 {title:'Сырники к завтраку',goals:[food(4,12)]},
 {title:'Завтрак на двоих',goals:[food(1,8),food(4,8)]},
 {title:'Четыре тарелочки',goals:[plates(center)],plates:center},
 {title:'Ещё по блинчику',goals:[food(1,16)]},
 {title:'Семейный завтрак',goals:[plates(tea),food(4,10)],plates:tea},
 {title:'Горячие пирожки',goals:[food(0,12)]},
 {title:'Обед готов',goals:[food(2,12),food(3,10)]},
 {title:'Накрываем стол',goals:[plates(table)],plates:table},
 {title:'Любимый борщ',goals:[food(3,14)]},
 {title:'Ждём гостей',goals:[plates(guests),food(0,12)],plates:guests},
 {title:'Воскресное угощение',goals:[plates(feast),food(2,14)],plates:feast}
];
export function levelRecipe(level){
 const chapterIndex=Math.floor((level-1)/6)%3,step=(level-1)%6,chapter=CHAPTERS[chapterIndex],round=Math.floor((level-1)/18),extra=Math.min(round*2,8);
 const early=FIRST_LEVELS[level-1];
 if(early)return {...early,goals:early.goals.map(g=>({...g})),plates:[...(early.plates??[])],chapter:chapter.title,chapterIndex,step};
 const dish=(type,amount)=>food(type,amount+extra);
 const goals=[[{kind:'score'}],[dish(chapter.types[0],12)],[dish(chapter.types[0],10),dish(chapter.types[1],10)],[{kind:'score'}],[dish(chapter.types[1],20)],[{kind:'score'},dish(chapter.types[0],14)]][step];
 return {chapter:chapter.title,chapterIndex,step,title:['Первое угощение','Любимое блюдо','На двоих','Полный стол','Добавка','Семейный рецепт'][step],goals,plates:[]};
}
