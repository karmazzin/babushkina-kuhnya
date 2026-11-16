export const FOODS=[
 {name:'Пирожок',plural:'Пирожки'},
 {name:'Блины',plural:'Блины'},
 {name:'Пельмени',plural:'Пельмени',image:'assets/foods/pelmeni.png'},
 {name:'Борщ',plural:'Борщ'},
 {name:'Сырники',plural:'Сырники'},
 {name:'Запеканка',plural:'Запеканка',image:'assets/foods/casserole.png'},
 {name:'Оладьи',plural:'Оладьи',image:'assets/foods/fritters.png'},
 {name:'Вареники',plural:'Вареники',image:'assets/foods/cherry-dumplings.png'},
 {name:'Драники',plural:'Драники',image:'assets/foods/potato-pancakes.png'},
 {name:'Гречка с грибами',plural:'Гречка с грибами',image:'assets/foods/buckwheat.png'}
];
export const BASE_POOL=[0,1,2,3,4];
export function foodPool(level=1){
 const pool=BASE_POOL.slice(),introductions=Math.min(5,Math.max(0,Math.floor((level-19)/12)+1));
 const slots=[0,1,2,4,3];for(let i=0;i<introductions;i++)pool[slots[i]]=5+i;
 return pool;
}
