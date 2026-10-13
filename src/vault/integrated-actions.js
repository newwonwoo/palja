import {setWorkspace,createBackup,createEmptyVault,validateVault} from './model.js';
import {emptyWorkspace} from './workspace.js';
import {emptyIntegrated,weightErrors,noteContentErrors} from './integrated-schema.js';
const clone=x=>JSON.parse(JSON.stringify(x));
export const integrated=state=>state.workspace?.integrated||emptyIntegrated();
export function updateIntegrated(state,fn){const w=clone(state.workspace||emptyWorkspace());w.integrated=fn(w.integrated||emptyIntegrated());return setWorkspace(state,w);}
export function setWeights(state,weights){const errors=weightErrors(weights);if(errors.length)throw new Error(errors.join(' · '));return updateIntegrated(state,x=>({...x,weights:clone(weights)}));}
export function rememberSelection(state,selection){return updateIntegrated(state,x=>({...x,selection:clone(selection)}));}
/** A named local date/time bookmark. It never changes an entry's birth time. */
export function saveSelectionPreset(state,entryId,name,selection){
 if(!state.entries.some(e=>e.id===entryId&&!e.deletedAt))throw new Error('명식을 찾을 수 없습니다.');
 if(typeof name!=='string'||!name.trim()||name.trim().length>60)throw new Error('즐겨찾기 이름은 1~60자로 입력하세요.');
 return updateIntegrated(state,x=>{
  const presets=x.presets||[];
  if(presets.length>=30)throw new Error('운 즐겨찾기는 30개까지 보관됩니다.');
  const normalized=name.trim().normalize('NFKC').toLocaleLowerCase('ko');
  if(presets.some(p=>p.entryId===entryId&&p.name.normalize('NFKC').toLocaleLowerCase('ko')===normalized))throw new Error('같은 이름의 운 즐겨찾기가 있습니다.');
  return {...x,presets:[...presets,{id:'preset-'+crypto.randomUUID(),entryId,name:name.trim(),selection:{date:selection.date,hour:selection.hour,minute:selection.minute},createdAt:new Date().toISOString()}]};
 });
}
export function removeSelectionPreset(state,id){return updateIntegrated(state,x=>({...x,presets:(x.presets||[]).filter(p=>p.id!==id)}));}

const snapshot=n=>({at:n.updatedAt,title:n.title,date:n.date,category:n.category,text:n.text,images:[...n.images],drawing:n.drawing,selection:n.selection});
export function saveNote(state,entryId,draft){
 if(!state.entries.some(e=>e.id===entryId&&!e.deletedAt))throw new Error('활성 명식을 찾을 수 없습니다.');
 const at=new Date().toISOString();return updateIntegrated(state,x=>{
  const old=draft.id?x.notes.find(n=>n.id===draft.id&&n.entryId===entryId):null;
  if(draft.id&&(!old||old.deletedAt))throw new Error('수정할 메모가 없거나 삭제되었습니다.');
  const content={title:String(draft.title||'').trim(),date:draft.date,category:draft.category||'',text:draft.text||'',images:draft.images||[],drawing:draft.drawing||null,selection:draft.selection||null};
  const errors=noteContentErrors(content);if(errors.length)throw new Error(errors.join(' · '));
  const n={...content,id:old?.id||'note-'+crypto.randomUUID(),entryId,createdAt:old?.createdAt||at,updatedAt:at,deletedAt:null,history:old?[...old.history,snapshot(old)].slice(-10):[]};
  return {...x,notes:old?x.notes.map(v=>v.id===n.id?n:v):[...x.notes,n]};
 });
}
export function setNoteDeleted(state,id,deleted){return updateIntegrated(state,x=>{if(!x.notes.some(n=>n.id===id))throw new Error('메모 없음');return {...x,notes:x.notes.map(n=>n.id===id?{...n,deletedAt:deleted?new Date().toISOString():null,updatedAt:new Date().toISOString()}:n)};});}
export function restoreNoteVersion(state,id,index){const n=integrated(state).notes.find(n=>n.id===id);if(!n||!n.history[index])throw new Error('이력 없음');return saveNote(state,n.entryId,{...n.history[index],id});}
/** Export only selected records. Strip embedded original screenshot packages to avoid leaking other people. */
export function selectedBackup(state,ids,{withMemo=false}={}) {
 const selected=new Set(ids),out=createEmptyVault(),copy=clone(state);out.entries=copy.entries.filter(e=>selected.has(e.id)&&!e.deletedAt).map(e=>({...e,source:null,birthRevisions:withMemo?e.birthRevisions:[],memo:withMemo?e.memo:'',referenceDisplay:e.referenceDisplay}));
 out.selfId=selected.has(state.selfId)?state.selfId:null;
 out.workspace=copy.workspace||emptyWorkspace();out.workspace.groups=out.workspace.groups.map(g=>({...g,entryIds:g.entryIds.filter(id=>selected.has(id))})).filter(g=>g.entryIds.length);
 if(out.workspace.integrated){out.workspace.integrated.notes=withMemo?out.workspace.integrated.notes.filter(n=>selected.has(n.entryId)):[];out.workspace.integrated.selection=null;out.workspace.integrated.presets=(out.workspace.integrated.presets||[]).filter(p=>selected.has(p.entryId));}
 if(!out.entries.length)throw new Error('내보낼 명식을 선택하세요.');
 const checked=validateVault(out);if(!checked.valid)throw new Error(checked.errors.join(' '));return createBackup(out);
}
