import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyVault,upsertEntry,toggleFavorite,deleteEntry} from '../src/vault/model.js';
import {manualBirth} from '../src/vault/pillar-input.js';
import {entryEditConflict,assertEntryEditCurrent} from '../src/vault/edit-conflicts.js';
for (const mode of ['date','manual']) test(`${mode} edit rejects changed or deleted record without altering either draft or stored data`,()=>{
 const birth=mode==='date'?{input_year:2000,input_month:1,input_day:1,calendar_type:'solar',time_status:'unknown',sex:'male'}:manualBirth({version:1,pillars:{year:{stem:'甲',branch:'子'},month:{stem:'丙',branch:'寅'},day:{stem:'戊',branch:'辰'},hour:null}},'male');
 let state=upsertEntry(createEmptyVault(),{name:'Synthetic',birth});const original=state.entries[0];
 assert.equal(entryEditConflict(original,original),false);assert.doesNotThrow(()=>assertEntryEditCurrent(state,original));
 const favorite=toggleFavorite(state,original.id);assert.doesNotThrow(()=>assertEntryEditCurrent(favorite,original));
 state=upsertEntry(state,{id:original.id,birth:{sex:'female'}});const before=JSON.stringify(state);
 assert.equal(entryEditConflict(original,state.entries[0]),true);assert.throws(()=>assertEntryEditCurrent(state,original),{code:'ENTRY_EDIT_CONFLICT'});assert.equal(JSON.stringify(state),before);assert.equal(original.birth.sex,'male');
 const deleted=deleteEntry(state,original.id);assert.throws(()=>assertEntryEditCurrent(deleted,original),{code:'ENTRY_EDIT_CONFLICT'});
 assert.throws(()=>assertEntryEditCurrent(createEmptyVault(),original),{code:'ENTRY_EDIT_CONFLICT'});
 assert.doesNotThrow(()=>assertEntryEditCurrent(state,undefined));
});
test('name and memo concurrent changes also block stale form retries',()=>{
 const state=upsertEntry(createEmptyVault(),{name:'Synthetic',memo:'Original'}),original=state.entries[0];
 for(const patch of [{name:'Other tab'},{memo:'Other tab memo'}])assert.throws(()=>assertEntryEditCurrent(upsertEntry(state,{id:original.id,...patch}),original),{code:'ENTRY_EDIT_CONFLICT'});
});

test('group and note snapshots reject concurrent edits even with unchanged timestamps',async()=>{
 const {groupEditConflict,assertGroupEditCurrent,noteEditConflict,assertNoteEditCurrent,assertMemoEditCurrent}=await import('../src/vault/edit-conflicts.js');
 const {saveGroup}=await import('../src/vault/workspace-actions.js');const {saveNote}=await import('../src/vault/integrated-actions.js');
 let state=upsertEntry(createEmptyVault(),{name:'Synthetic',memo:'Original'});state=saveGroup(state,{name:'Group',entryIds:[state.entries[0].id]});state=saveNote(state,state.entries[0].id,{title:'Note',date:'2026-10-23',text:'Original',category:'Original',images:[],drawing:null,selection:null});
 const group=state.workspace.groups[0],note=state.workspace.integrated.notes[0];const changed=JSON.parse(JSON.stringify(state));changed.workspace.groups[0].name='Remote group';changed.workspace.integrated.notes[0].text='Remote note';changed.entries[0].memo='Remote memo';const before=JSON.stringify(changed);
 assert.equal(groupEditConflict(group,changed.workspace.groups[0]),true);assert.throws(()=>assertGroupEditCurrent(changed,group),{code:'GROUP_EDIT_CONFLICT'});assert.equal(noteEditConflict(note,changed.workspace.integrated.notes[0]),true);assert.throws(()=>assertNoteEditCurrent(changed,note),{code:'NOTE_EDIT_CONFLICT'});assert.throws(()=>assertMemoEditCurrent(changed,state.entries[0].id,'Original'),{code:'MEMO_EDIT_CONFLICT'});
 assert.doesNotThrow(()=>assertGroupEditCurrent(state,group));assert.doesNotThrow(()=>assertNoteEditCurrent(state,note));assert.doesNotThrow(()=>assertMemoEditCurrent(state,state.entries[0].id,'Original'));assert.equal(JSON.stringify(changed),before);
 for(const key of ['groups','notes']){const removed=JSON.parse(JSON.stringify(state));if(key==='groups')removed.workspace.groups[0].deletedAt='2026-10-23T00:00:00.000Z';else removed.workspace.integrated.notes[0].deletedAt='2026-10-23T00:00:00.000Z';assert.throws(()=>key==='groups'?assertGroupEditCurrent(removed,group):assertNoteEditCurrent(removed,note));}
});
