import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyVault,upsertEntry,validateVault,createBackup,restoreBackup,setWorkspace} from '../src/vault/model.js';
import {savePreferences,saveGroup} from '../src/vault/workspace-actions.js';
import {DEFAULT_APPEARANCE} from '../src/vault/appearance.js';
import {readPreferences} from '../src/vault/workspace.js';

const seed = () => saveGroup(upsertEntry(createEmptyVault(), {name:'합성 명식',memo:'보존할 메모'}), {name:'가족'});
const changed = {...DEFAULT_APPEARANCE, accent:'#8357a9', font:'serif', textSize:'large', cardStyle:'outline', hiddenStems:false};
test('personal design survives backup restore without touching records, groups or calculation inputs', () => {
  const old=seed(), next=savePreferences(old,{appearance:changed});
  assert.deepEqual(next.entries,old.entries); assert.deepEqual(next.workspace.groups,old.workspace.groups);
  const restored=restoreBackup(createEmptyVault(),createBackup(next)).state;
  assert.deepEqual(restored.entries,old.entries); assert.deepEqual(readPreferences(restored).appearance,changed);
  assert.equal(validateVault(restored).valid,true);
});
test('1.1.4 workspace without appearance is valid and retains original bytes until user edits', () => {
  const old=seed(); delete old.workspace.preferences.appearance;
  const before=JSON.stringify(old); assert.equal(validateVault(old).valid,true);
  assert.deepEqual(readPreferences(old).appearance,DEFAULT_APPEARANCE); assert.equal(JSON.stringify(old),before);
  const restored=restoreBackup(createEmptyVault(),createBackup(old)).state;
  assert.equal(Object.hasOwn(restored.workspace.preferences,'appearance'),false);
  assert.deepEqual(readPreferences(restored).appearance,DEFAULT_APPEARANCE);
});
test('older backup cannot reset local personal design and reset does not erase records', () => {
  const old=seed(), local=savePreferences(old,{appearance:changed});
  assert.deepEqual(readPreferences(restoreBackup(local,createBackup(old)).state).appearance,changed);
  const reset=savePreferences(local,{appearance:{...DEFAULT_APPEARANCE}});
  assert.deepEqual(reset.entries,local.entries);assert.deepEqual(reset.workspace.groups,local.workspace.groups);
  assert.deepEqual(readPreferences(reset).appearance,DEFAULT_APPEARANCE);
});
test('corrupt appearance and CSS injection in backups are rejected before persistence', () => {
  const old=seed();
  for (const appearance of [null,[],{}, {...changed,accent:'red; background:url(https://example.com)'}, {...changed,font:'__proto__'}, {...changed,textSize:'huge'}, {...changed,cardStyle:'script'}, {...changed,hiddenStems:'false'}, {...changed,extra:true}]) {
    const workspace=structuredClone(old.workspace);workspace.preferences.appearance=appearance;
    assert.throws(()=>setWorkspace(old,workspace));
  }
  assert.deepEqual(readPreferences(old).appearance,DEFAULT_APPEARANCE);
});
