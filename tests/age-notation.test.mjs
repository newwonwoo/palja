import test from 'node:test';
import assert from 'node:assert/strict';
import {AGE_NOTATIONS, DEFAULT_AGE_NOTATION, solarAge} from '../src/vault/age-notation.js';
import {ageBadge, filterAndSortEntries} from '../src/mobile/list-utils.js';
import {createEmptyVault, upsertEntry, createBackup, restoreBackup, validateVault} from '../src/vault/model.js';
import {savePreferences} from '../src/vault/workspace-actions.js';
import {readPreferences} from '../src/vault/workspace.js';

const birth = (year, month, day) => ({input_year:year, input_month:month, input_day:day, calendar_type:'solar'});
const entry = (id, name, month, day) => ({id, name, birth:birth(2000,month,day), memo:'', deletedAt:null});

test('original age settings have two choices and default to Korean age', () => {
  assert.deepEqual(Object.keys(AGE_NOTATIONS), ['korean','international']);
  assert.equal(DEFAULT_AGE_NOTATION,'korean');
  assert.equal(solarAge(birth(2000,12,31),new Date(2026,0,1),'korean'),27);
  assert.equal(solarAge(birth(2000,12,31),new Date(2026,0,1),'international'),25);
  assert.equal(solarAge(birth(2000,12,31),new Date(2026,11,31),'international'),26);
});
test('original year-1000 birthday comparison preserves the observed leap-day boundary', () => {
  assert.equal(solarAge(birth(2000,2,29),new Date(2025,1,28),'international'),24);
  assert.equal(solarAge(birth(2000,2,29),new Date(2025,2,1),'international'),25);
  assert.equal(solarAge(birth(2000,3,1),new Date(2024,1,29),'international'),24);
});
test('invalid dates and unsupported future births cannot manufacture an age', () => {
  for (const b of [birth(2001,2,29),birth(2000,4,31),birth(2027,1,1)]) {
    assert.equal(solarAge(b,new Date(2026,5,1),'korean'),null);
  }
  const lunar={...entry('lunar','합성',1,1),birth:{...birth(2000,1,1),calendar_type:'lunar'},referenceDisplay:{badge_text:'41'}};
  assert.deepEqual(ageBadge(lunar,new Date(2026,5,1),'korean'),{text:'41',captured:true});
});
test('the selected notation drives both age search and age sort without changing entries', () => {
  const entries=[entry('late','나',12,31),entry('early','가',1,1)], before=JSON.stringify(entries),now=new Date(2026,5,1);
  assert.deepEqual(filterAndSortEntries(entries,{now,sort:'age-asc',ageNotation:'international'}).map(e=>e.id),['late','early']);
  assert.deepEqual(filterAndSortEntries(entries,{now,sort:'age-asc',ageNotation:'korean'}).map(e=>e.id),['early','late']);
  assert.equal(filterAndSortEntries(entries,{now,query:'27세',ageNotation:'korean'}).length,2);
  assert.equal(filterAndSortEntries(entries,{now,query:'27세',ageNotation:'international'}).length,0);
  assert.equal(JSON.stringify(entries),before);
});
test('old backups read the original default without migration; edits survive restore', () => {
  let old=upsertEntry(createEmptyVault(),{name:'합성 나이 검사',birth:birth(2000,12,31)});
  old=savePreferences(old,{sort:'name'});delete old.workspace.preferences.ageNotation;
  const before=JSON.stringify(old);
  assert.equal(validateVault(old).valid,true);
  assert.equal(readPreferences(old).ageNotation,'korean');
  assert.equal(JSON.stringify(old),before);
  const edited=savePreferences(old,{ageNotation:'international'});
  assert.deepEqual(edited.entries,old.entries);
  const restored=restoreBackup(createEmptyVault(),createBackup(edited)).state;
  assert.equal(readPreferences(restored).ageNotation,'international');
  assert.deepEqual(restored.entries,old.entries);
  assert.equal(readPreferences(restoreBackup(edited,createBackup(old)).state).ageNotation,'international');
});
test('unrecognized age preferences are rejected before persistence', () => {
  for (const ageNotation of ['year','ENG_AGE','__proto__',null,{},[]]) {
    assert.throws(()=>savePreferences(createEmptyVault(),{ageNotation}));
  }
});
