// Prices are part of the current save format. Balance is derived, never awarded twice.
export const GARDEN_ITEMS=[
 {id:'vegetables',name:'Овощные грядки',cost:1,variants:['Морковь','Капуста'],sprite:0},
 {id:'berries',name:'Ягодные кусты',cost:2,variants:['Клубника','Малина'],sprite:2},
 {id:'tree',name:'Плодовое дерево',cost:3,variants:['Яблоня','Груша'],sprite:4},
 {id:'greenhouse',name:'Теплица',cost:4,variants:['Помидоры','Огурцы'],sprite:6},
 {id:'shed',name:'Садовый сарай',cost:3,variants:['Зелёная крыша','Черепичная крыша'],sprite:8},
 {id:'well',name:'Колодец',cost:3,variants:['Зелёная крыша','Колодец с цветами'],sprite:10},
 {id:'gazebo',name:'Беседка',cost:5,variants:['Чаепитие','Беседка с розами'],sprite:12},
 {id:'flowers',name:'Цветник',cost:1,variants:['Ромашки','Подсолнухи'],sprite:14},
];
export const EXPANSIONS=[3,5];
export const gardenItem=id=>GARDEN_ITEMS.find(x=>x.id===id);
export const defaultGarden=()=>({expansion:0,plots:[]});
export const gardenCapacity=data=>4+data.garden.expansion*4;
export function starBalance(data){return data.completed.length-EXPANSIONS.slice(0,data.garden.expansion).reduce((s,n)=>s+n,0)-data.garden.plots.reduce((s,p)=>s+gardenItem(p.item).cost,0);}
export function validGarden(data){
 const g=data.garden;
 if(!g||!Number.isInteger(g.expansion)||g.expansion<0||g.expansion>2||!Array.isArray(g.plots)||g.plots.length>gardenCapacity(data))return false;
 if(!g.plots.every(p=>p&&Number.isInteger(p.slot)&&p.slot>=0&&p.slot<gardenCapacity(data)&&gardenItem(p.item)&&Number.isInteger(p.variant)&&p.variant>=0&&p.variant<2))return false;
 return new Set(g.plots.map(p=>p.slot)).size===g.plots.length&&starBalance(data)>=0;
}
const reject=(data,error)=>({ok:false,data,error});
export function buyGardenItem(data,slot,id,variant){
 const item=gardenItem(id);
 if(!item||!Number.isInteger(slot)||slot<0||slot>=gardenCapacity(data)||!Number.isInteger(variant)||variant<0||variant>1)return reject(data,'Это место пока недоступно.');
 if(data.garden.plots.some(p=>p.slot===slot))return reject(data,'Здесь уже всё посажено или построено.');
 if(starBalance(data)<item.cost)return reject(data,'Не хватает звёзд. Пройдите новый уровень.');
 return {ok:true,data:{...data,garden:{...data.garden,plots:[...data.garden.plots,{slot,item:id,variant}]}}};
}
export function expandGarden(data){
 const cost=EXPANSIONS[data.garden.expansion];
 if(cost===undefined)return reject(data,'Весь участок уже открыт.');
 if(starBalance(data)<cost)return reject(data,'Не хватает звёзд. Пройдите новый уровень.');
 return {ok:true,data:{...data,garden:{...data.garden,expansion:data.garden.expansion+1}}};
}
export function changeGardenVariant(data,slot,variant){
 if(!Number.isInteger(variant)||variant<0||variant>1||!data.garden.plots.some(p=>p.slot===slot))return reject(data,'Выберите построенный объект.');
 return {ok:true,data:{...data,garden:{...data.garden,plots:data.garden.plots.map(p=>p.slot===slot?{...p,variant}:p)}}};
}
