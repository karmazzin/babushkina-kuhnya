// Escape invokes the same safe return as its visible button, never a third route.
export function createDialogControls(dialog){
 let cancel=null,generation=0;
 function close(){generation++;cancel=null;dialog.close();}
 dialog.addEventListener('cancel',event=>{event.preventDefault();cancel?.();});
 return {close,actions(items){
  if(items.filter(a=>a.cancel).length!==1)throw Error('A dialog needs exactly one explicit return action');
  const current=++generation;
  const bound=items.map(a=>({...a,run(){if(current!==generation||!dialog.open)return;close();a.action();}}));
  cancel=bound.find(a=>a.cancel).run;
  return bound;
 }};
}
