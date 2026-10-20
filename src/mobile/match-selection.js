/** Two distinct slots, matching the original basis/partner selection state. */
export const EMPTY_MATCH_SELECTION=Object.freeze({basisId:null,partnerId:null});
export function toggleMatchSelection(current,id){
  if(typeof id!=='string'||!id)return current;
  if(current.basisId===id)return {...current,basisId:null};
  if(!current.basisId)return {basisId:id,partnerId:current.partnerId===id?null:current.partnerId};
  return {...current,partnerId:current.partnerId===id?null:id};
}
export function matchSelectionEntries(selection,entries){
  const find=id=>entries.find(e=>e.id===id&&!e.deletedAt)||null;
  return {basis:find(selection.basisId),partner:selection.partnerId===selection.basisId?null:find(selection.partnerId)};
}
