import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyVault,upsertEntry,createBackup,deleteEntry,toggleFavorite} from '../src/vault/model.js';
import {saveGroup,savePresentation} from '../src/vault/workspace-actions.js';
import {saveNote,setNoteDeleted} from '../src/vault/integrated-actions.js';
import {compareUpgradeBackups} from '../scripts/verify-upgrade-backups.mjs';
const copy=x=>JSON.parse(JSON.stringify(x));
function fixture(){
 let s=upsertEntry(createEmptyVault(),{name:'합성 개인 명식',memo:'기존 메모 🌙'});
 const id=s.entries[0].id;
 s=toggleFavorite(s,id);s=saveGroup(s,{name:'합성 그룹',entryIds:[id]});
 s=saveNote(s,id,{title:'사진과 그림',date:'2026-10-21',text:'합성 기록',images:['data:image/png;base64,aGVsbG8='],drawing:'data:image/png;base64,aGVsbG8='});
 const note=s.workspace.integrated.notes[0];
 s=saveNote(s,id,{...note,text:'합성 기록 수정'});
 s=setNoteDeleted(s,note.id,true);
 s=upsertEntry(s,{name:'합성 휴지통'});s=deleteEntry(s,s.entries[1].id);
 return s;
}
test('upgrade audit accepts unchanged original records with new optional settings and a new root revision',()=>{
 const before=fixture(),after=savePresentation(before,{palette:'contrast'});
 assert.equal(compareUpgradeBackups(createBackup(before),createBackup(after)).preserved,true);
});
for(const [name,mutate] of [
 ['record ID',s=>{s.entries.splice(0,1);s.workspace.groups[0].entryIds=[];s.workspace.integrated.notes=[];}],
 ['favorite',s=>{s.entries[0].favorite=false;}],
 ['memo',s=>{s.entries[0].memo='changed';}],
 ['group',s=>{s.workspace.groups=[];}],
 ['photo',s=>{s.workspace.integrated.notes[0].images=[];}],
 ['drawing',s=>{s.workspace.integrated.notes[0].drawing=null;}],
 ['note history',s=>{s.workspace.integrated.notes[0].history=[];}],
 ['deleted record',s=>{s.entries[1].deletedAt=null;}],
 ['deleted note',s=>{s.workspace.integrated.notes[0].deletedAt=null;}],
])test('upgrade audit detects loss or change of '+name,()=>{
 const original=fixture(),changed=copy(original);mutate(changed);
 const result=compareUpgradeBackups(createBackup(original),createBackup(changed));
 assert.equal(result.preserved,false);assert.ok(result.differences.length);
 assert.ok(!JSON.stringify(result).includes('합성'));
});
test('upgrade audit rejects arbitrary states and malformed full backups',()=>{
 for(const p of [{},fixture(),{...createBackup(fixture()),version:2},{...createBackup(fixture()),state:{}}])assert.throws(()=>compareUpgradeBackups(p,p));
});
