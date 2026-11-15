export const CHAPTERS=[
 {title:'Завтрак',dish:'Бабушкины блины',types:[1,4],ingredients:'Молоко · яйца · мука · щепотка соли',steps:['Размешайте яйца с молоком, добавьте муку и соль. Тесто должно легко стекать с ложки.','Выпекайте тонкие блины на разогретой сковороде с небольшим количеством масла.','Сложите стопкой и подайте со сметаной или вареньем.']},
 {title:'Воскресный обед',dish:'Домашние пельмени',types:[2,3],ingredients:'Мука · вода · яйцо · фарш · лук · соль',steps:['Замесите мягкое тесто из муки, воды, яйца и соли. Дайте ему отдохнуть.','Смешайте фарш с мелко нарезанным луком. Раскатайте тесто, вырежьте кружочки и защипните начинку.','Варите пельмени в кипящей подсоленной воде до полной готовности начинки. Подайте со сметаной.']},
 {title:'Гости к чаю',dish:'Сырники к чаю',types:[4,0],ingredients:'Творог · яйцо · мука · сахар · масло',steps:['Разомните творог с яйцом и небольшим количеством сахара, добавьте немного муки.','Сформируйте небольшие сырники, слегка обваляйте в муке.','Обжарьте на умеренном огне до золотистого цвета и готовности внутри. Подайте с вареньем.']}
];
const food=(type,amount)=>({kind:'food',type,amount});
const plates=cells=>({kind:'plates',amount:cells.length});
const center=[15,16,39,40],tea=[15,17,19,29,31,33],table=[8,10,12,22,24,26,36,38,40,43,45,47],guests=[8,10,12,15,19,22,24,26,29,33,36,38,40,45],feast=[8,10,12,15,19,22,24,26,29,33,36,38,40,43,45,47];
// Each early level has its own composition. Plates stay under their original cells.
export const FIRST_LEVELS=[
 {title:'Первые блинчики',goals:[food(1,10)]},
 {title:'Сырники к завтраку',goals:[food(4,12)]},
 {title:'Завтрак на двоих',goals:[food(1,8),food(4,8)]},
 {title:'Четыре тарелочки',goals:[plates(center)],plates:center},
 {title:'Ещё по блинчику',goals:[food(1,24)]},
 {title:'Семейный завтрак',goals:[plates(tea),food(4,20)],plates:tea,moves:23},
 {title:'Горячие пирожки',goals:[food(0,24)]},
 {title:'Обед готов',goals:[food(2,20),food(3,18)]},
 {title:'Накрываем стол',goals:[plates(table)],plates:table,moves:23},
 {title:'Любимый борщ',goals:[food(3,26)]},
 {title:'Ждём гостей',goals:[plates(guests),food(0,24)],plates:guests,moves:23},
 {title:'Воскресное угощение',goals:[plates(feast),food(2,26)],plates:feast,moves:22}
];
export function levelRecipe(level){
 const chapterIndex=Math.floor((level-1)/6)%3,step=(level-1)%6,chapter=CHAPTERS[chapterIndex],round=Math.floor((level-1)/18),extra=Math.min(round*2,8);
 const early=FIRST_LEVELS[level-1];
 if(early)return {...early,goals:early.goals.map(g=>({...g})),plates:[...(early.plates??[])],chapter:chapter.title,chapterIndex,step};
 // Subsequent chapters reuse the established spatial puzzles, with bounded growth.
 const template=FIRST_LEVELS[6+step];
 const goals=template.goals.map((g,i)=>g.kind==='food'?{...g,type:chapter.types[i%2],amount:Math.min(40,g.amount+extra)}:{...g});
 return {chapter:chapter.title,chapterIndex,step,title:template.title,goals,plates:[...(template.plates??[])],moves:template.moves??24};
}
