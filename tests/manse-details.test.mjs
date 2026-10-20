import test from 'node:test';
import assert from 'node:assert/strict';
import {createEmptyVault,upsertEntry,validateVault,createBackup,restoreBackup} from '../src/vault/model.js';
import {savePreferences,saveGroup} from '../src/vault/workspace-actions.js';
import {readPreferences} from '../src/vault/workspace.js';
import {DEFAULT_MANSE_DETAILS,MANSE_DETAIL_PRESETS} from '../src/vault/manse-details.js';

const seed=()=>saveGroup(upsertEntry(createEmptyVault(),{name:'상세 표시 합성 검사',memo:'보존할 메모'}),{name:'보존할 그룹'});
test('old backups use original disabled defaults without rewriting saved data',()=>{
  const old=seed();delete old.workspace.preferences.manseDetails;
  const before=JSON.stringify(old);
  assert.equal(validateVault(old).valid,true);
  assert.deepEqual(readPreferences(old).manseDetails,DEFAULT_MANSE_DETAILS);
  assert.equal(JSON.stringify(old),before);
});
test('detailed display options survive backup and preserve entries, groups and legacy switches',()=>{
  const old=seed(), options={hiddenStemGods:true,nayin:true};
  const next=savePreferences(old,{manseDetails:options});
  const restored=restoreBackup(createEmptyVault(),createBackup(next)).state;
  assert.deepEqual(restored.entries,old.entries);
  assert.deepEqual(restored.workspace.groups,old.workspace.groups);
  assert.deepEqual(readPreferences(restored).appearance,readPreferences(old).appearance);
  assert.deepEqual(readPreferences(restored).manseDetails,{...DEFAULT_MANSE_DETAILS,...options});
  assert.deepEqual(readPreferences(restoreBackup(next,createBackup(old)).state).manseDetails,{...DEFAULT_MANSE_DETAILS,...options});
});
test('original five presets have the recovered eight-field combinations',()=>{
  const keys=Object.keys(DEFAULT_MANSE_DETAILS);
  assert.equal(keys.length,8);
  const enabled=id=>keys.filter(k=>MANSE_DETAIL_PRESETS[id][k]);
  assert.deepEqual(enabled('basic'),['dayStemGods','dayGrowth']);
  assert.deepEqual(enabled('japyeong'),['dayStemGods','columnStemGods','dayGrowth','columnGrowth']);
  assert.deepEqual(enabled('sammyeong'),['yearShinsal','dayShinsal','nayin']);
  assert.equal(enabled('all').length,8);assert.deepEqual(enabled('none'),[]);
  for(const preset of Object.values(MANSE_DETAIL_PRESETS)) assert.equal(validateVault(savePreferences(seed(),{manseDetails:preset})).valid,true);
});
test('malformed detail settings are rejected before persistence',()=>{
  for(const value of [null,[],{},true,{hiddenStemGods:'false',nayin:false},{hiddenStemGods:false,nayin:0},{...DEFAULT_MANSE_DETAILS,extra:true}])
    assert.throws(()=>savePreferences(seed(),{manseDetails:value}));
});
