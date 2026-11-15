// Dismissing a result is navigation; explicit action buttons own their navigation.
export function createDialogControls(dialog,closeButton){
 let onDismiss=null;
 function close(){onDismiss=null;dialog.close();}
 function dismiss(){const action=onDismiss;close();action?.();}
 closeButton.addEventListener('click',dismiss);
 dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
 return {close,onDismiss(action){onDismiss=action;}};
}
