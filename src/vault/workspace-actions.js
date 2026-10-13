import { setWorkspace, validateVault, deleteEntry } from './model.js';
import { emptyWorkspace, normalizedGroupName, readPreferences } from './workspace.js';
const fail = message => { throw new Error(message); };
const clone = value => JSON.parse(JSON.stringify(value));
let sequence = 0;
function workspaceFor(state) {
  const result = validateVault(state);
  if (!result.valid) fail('명식 저장소 형식을 확인해 주세요.');
  return state.workspace ? clone(state.workspace) : emptyWorkspace();
}
function groupFor(workspace, id) {
  return workspace.groups.find(group => group.id === id) || fail('그룹을 찾을 수 없습니다.');
}
export function savePreferences(state, patch) {
  const workspace = workspaceFor(state);
  workspace.preferences = {...readPreferences(state),...patch};
  return setWorkspace(state, workspace);
}
export function saveGroup(state, {id = null, name, entryIds = []}) {
  const workspace = workspaceFor(state);
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 80) fail('그룹 이름은 1~80자로 입력해 주세요.');
  name = name.trim();
  const old = id ? groupFor(workspace, id) : null;
  if (old?.deletedAt) fail('삭제된 그룹은 먼저 복원해 주세요.');
  if (workspace.groups.some(g => g.id !== id && !g.deletedAt && normalizedGroupName(g.name) === normalizedGroupName(name))) fail('이미 있는 그룹 이름입니다.');
  if (!Array.isArray(entryIds)) fail('그룹의 명식 목록을 확인해 주세요.');
  const wanted = [...new Set(entryIds)];
  // Keep existing memberships of soft-deleted records, but disallow newly adding deleted ones.
  if (wanted.some(key => !state.entries.some(e => e.id === key && (!e.deletedAt || old?.entryIds.includes(key))))) fail('선택한 명식이 없거나 삭제되었습니다.');
  if (old && old.name === name && JSON.stringify(old.entryIds) === JSON.stringify(wanted)) return state;
  const at = new Date().toISOString();
  const group = {id:old?.id || `group-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+(++sequence)+'-'+Math.random().toString(36).slice(2)}`,name,entryIds:wanted,createdAt:old?.createdAt || at,updatedAt:at,deletedAt:null};
  workspace.groups = old ? workspace.groups.map(g => g.id === id ? group : g) : [...workspace.groups,group];
  return setWorkspace(state,workspace);
}
export function deleteGroup(state, id) {
  const workspace = workspaceFor(state), group = groupFor(workspace,id);
  if (group.deletedAt) return state;
  group.deletedAt = group.updatedAt = new Date().toISOString();
  return setWorkspace(state,workspace);
}
export function restoreGroup(state, id) {
  const workspace = workspaceFor(state), group = groupFor(workspace,id);
  if (!group.deletedAt) return state;
  if (workspace.groups.some(g => g.id !== id && !g.deletedAt && normalizedGroupName(g.name) === normalizedGroupName(group.name))) fail('같은 이름의 그룹이 있습니다. 해당 그룹의 이름을 먼저 변경해 주세요.');
  group.deletedAt = null; group.updatedAt = new Date().toISOString();
  return setWorkspace(state,workspace);
}

/** Atomic user-selected bulk operations; the caller persists the final state only after success. */
export function batchGroupEntries(state,{ids,groupId,mode='add'}){
 if(!['add','remove'].includes(mode)||!Array.isArray(ids)||ids.length===0||ids.length>2000||new Set(ids).size!==ids.length)throw new Error('선택 목록을 확인해 주세요.');
 if(ids.some(id=>!state.entries.some(e=>e.id===id&&!e.deletedAt)))throw new Error('선택 항목 중 삭제되었거나 없는 명식이 있습니다.');
 const group=activeGroupsForBatch(state).find(g=>g.id===groupId);
 if(!group)throw new Error('활성 그룹을 선택하세요.');
 const set=new Set(group.entryIds);
 for(const id of ids){if(mode==='add')set.add(id);else set.delete(id);}
 return saveGroup(state,{id:group.id,name:group.name,entryIds:[...set]});
}
function activeGroupsForBatch(state){return (state.workspace?.groups||[]).filter(g=>!g.deletedAt);}
export function batchTrashEntries(state,ids){
 if(!Array.isArray(ids)||!ids.length||ids.length>2000||new Set(ids).size!==ids.length)throw new Error('선택 목록을 확인해 주세요.');
 if(ids.some(id=>!state.entries.some(e=>e.id===id&&!e.deletedAt)))throw new Error('삭제할 명식을 찾을 수 없습니다.');
 return ids.reduce((current,id)=>deleteEntry(current,id),state);
}
