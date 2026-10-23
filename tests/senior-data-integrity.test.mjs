import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyVault,upsertEntry,deleteEntry,validateVault} from '../src/vault/model.js';
import {saveGroup} from '../src/vault/workspace-actions.js';
import {selectedBackup,saveNote,saveSelectionPreset,rememberSelection} from '../src/vault/integrated-actions.js';
import {mergeWorkspaces,validateWorkspace} from '../src/vault/workspace.js';
const selection={date:'2026-10-23',hour:12,minute:0};
const note={title:'Synthetic note',date:'2026-10-23',text:'Synthetic text',images:[],drawing:null,selection};
function fixture(){
 let state=upsertEntry(upsertEntry(createEmptyVault(),{name:'Synthetic A'}),{name:'Synthetic B'});
 for(const entry of state.entries){state=saveNote(state,entry.id,note);state=saveSelectionPreset(state,entry.id,'Synthetic bookmark',selection);state=rememberSelection(state,{entryId:entry.id,...selection});}
 state=saveGroup(state,{name:'Synthetic group',entryIds:state.entries.map(e=>e.id)});
 return state;
}
test('selected group export keeps only active record references, with or without notes',()=>{
 let state=fixture();const [active,removed]=state.entries;state=deleteEntry(state,removed.id);const before=JSON.stringify(state);
 for(const withMemo of [false,true]){
  const out=selectedBackup(state,state.workspace.groups[0].entryIds,{withMemo}).state;
  assert.equal(validateVault(out).valid,true);assert.deepEqual(out.entries.map(e=>e.id),[active.id]);assert.deepEqual(out.workspace.groups[0].entryIds,[active.id]);
  const x=out.workspace.integrated;assert.equal(x.notes.length,withMemo?1:0);
  for(const list of [x.notes,x.selections,x.presets])assert.ok(list.every(item=>item.entryId===active.id));
  assert.equal(JSON.stringify(state),before);
 }
});
test('merging first workspace filters unavailable integrated references and retains accepted references',()=>{
 const incoming=fixture(),[accepted,blocked]=incoming.entries;
 const conflicts=[];const merged=mergeWorkspaces(createEmptyVault(),incoming,new Set([accepted.id]),conflicts);
 assert.deepEqual(merged.groups[0].entryIds,[accepted.id]);const x=merged.integrated;
 assert.equal(x.selection,null);assert.deepEqual(x.notes.map(n=>n.entryId),[accepted.id]);assert.deepEqual(x.selections.map(n=>n.entryId),[accepted.id]);assert.deepEqual(x.presets.map(n=>n.entryId),[accepted.id]);
 assert.deepEqual(validateWorkspace(merged,new Set([accepted.id])),[]);
 assert.ok(!JSON.stringify(merged).includes(blocked.id));
});
