// Share a prepared local JPEG, without a network URL or broad storage permissions.
export function createNativeSharing(filesystem,share){
 return {
  async prepare(file){
   if(!/^card-\d{2}\.jpg$/.test(file.name)||file.type!=='image/jpeg')throw Error('Invalid postcard file');
   const bytes=new Uint8Array(await file.arrayBuffer());
   let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
   const {uri}=await filesystem.writeFile({path:`postcards/${file.name}`,data:btoa(binary),directory:'CACHE',recursive:true});
   return uri;
  },
  async share(uri){
   try{await share.share({files:[uri],dialogTitle:'Поделиться открыткой'});return 'shared';}
   catch(error){return /cancel|abort/i.test(`${error?.name} ${error?.message}`)?'cancelled':'failed';}
  },
 };
}
