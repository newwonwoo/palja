/** Do not retry a stale form over another editor's saved birth or notes. */
const editable = entry => entry && JSON.stringify([entry.name, entry.memo, entry.birth]);
export function entryEditConflict(original, current) {
  return Boolean(original && (!current || current.deletedAt || editable(original) !== editable(current)));
}
export function assertEntryEditCurrent(state, original) {
  if (entryEditConflict(original, state.entries.find(entry => entry.id === original?.id))) {
    throw Object.assign(new Error('다른 화면에서 이 명식이 변경되었습니다. 작성 중인 내용은 유지됩니다. 최신 내용을 확인한 뒤 다시 작성해 주세요.'), { code: 'ENTRY_EDIT_CONFLICT' });
  }
}

const snapshotConflict = (original, current) => Boolean(original && (!current || current.deletedAt || JSON.stringify(original) !== JSON.stringify(current)));
export const groupEditConflict = snapshotConflict;
export const noteEditConflict = snapshotConflict;
export function assertGroupEditCurrent(state, original) {
 if(groupEditConflict(original,state.workspace?.groups.find(group=>group.id===original?.id)))throw Object.assign(new Error('다른 화면에서 그룹이 변경되었습니다. 초안은 유지됩니다. 편집을 취소한 뒤 최신 그룹을 다시 열어 주세요.'),{code:'GROUP_EDIT_CONFLICT'});
}
export function assertNoteEditCurrent(state, original) {
 if(noteEditConflict(original,state.workspace?.integrated?.notes.find(note=>note.id===original?.id)))throw Object.assign(new Error('다른 화면에서 상담 기록이 변경되었습니다. 초안은 유지됩니다. 편집을 취소한 뒤 최신 기록을 다시 열어 주세요.'),{code:'NOTE_EDIT_CONFLICT'});
}
export function assertMemoEditCurrent(state, entryId, originalMemo) {
 const entry=state.entries.find(entry=>entry.id===entryId);
 if(!entry||entry.deletedAt||entry.memo!==originalMemo)throw Object.assign(new Error('다른 화면에서 메모가 변경되었습니다. 초안은 유지됩니다. 최신 메모를 확인한 뒤 다시 작성해 주세요.'),{code:'MEMO_EDIT_CONFLICT'});
}
