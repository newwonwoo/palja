import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyVault,upsertEntry,createBackup,restoreBackup,validateVault} from '../src/vault/model.js';
import {savePreferences} from '../src/vault/workspace-actions.js';
import {readPreferences} from '../src/vault/workspace.js';
import {DEFAULT_READING_ORDER,moveReadingTab} from '../src/vault/reading-order.js';

test('old backups retain their bytes and read the original four-tab order',()=>{
 const old=savePreferences(createEmptyVault(),{sort:'name'});delete old.workspace.preferences.readingOrder;
 const before=JSON.stringify(old);assert.equal(validateVault(old).valid,true);
 assert.deepEqual(readPreferences(old).readingOrder,DEFAULT_READING_ORDER);
 const read=readPreferences(old);read.readingOrder.reverse();
 assert.deepEqual(readPreferences(old).readingOrder,DEFAULT_READING_ORDER);
 assert.equal(JSON.stringify(old),before);
});
test('tab order persists through backup without changing entries or replacing local preferences',()=>{
 const old=upsertEntry(createEmptyVault(),{name:'순서 검사',memo:'보존할 메모'}),order=['compare','overview','relations','luck'];
 const next=savePreferences(old,{readingOrder:order}),restored=restoreBackup(createEmptyVault(),createBackup(next)).state;
 assert.deepEqual(restored.entries,old.entries);assert.deepEqual(readPreferences(restored).readingOrder,order);
 assert.deepEqual(readPreferences(restoreBackup(next,createBackup(old)).state).readingOrder,order);
});
test('missing, duplicate, extra and unrecognized tab keys are rejected before persistence',()=>{
 for(const readingOrder of [null,{},[],['overview','relations','luck'],['overview','overview','luck','compare'],['overview','relations','luck','__proto__'],[...DEFAULT_READING_ORDER,'extra']])
  assert.throws(()=>savePreferences(createEmptyVault(),{readingOrder}));
});
test('moving tabs preserves the same four tabs and cannot cross either boundary',()=>{
 const moved=moveReadingTab(DEFAULT_READING_ORDER,'relations',-1);
 assert.deepEqual(moved,['relations','overview','luck','compare']);
 assert.deepEqual(moveReadingTab(DEFAULT_READING_ORDER,'overview',-1),DEFAULT_READING_ORDER);
 assert.deepEqual(moveReadingTab(DEFAULT_READING_ORDER,'compare',1),DEFAULT_READING_ORDER);
 assert.deepEqual(DEFAULT_READING_ORDER,['overview','relations','luck','compare']);
});
