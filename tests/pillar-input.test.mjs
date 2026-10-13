import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyVault, upsertEntry, validateVault, createBackup, restoreBackup, deleteEntry, restoreEntry } from '../src/vault/model.js';
import { saveGroup } from '../src/vault/workspace-actions.js';
import { SIXTY_PILLARS, validInputPillar, pillarInputErrors, manualBirth, manualBirthLabel, duplicateCandidates } from '../src/vault/pillar-input.js';
const input = () => ({ version: 1, pillars: { year: { stem:'庚',branch:'辰' }, month:{stem:'戊',branch:'寅'}, day:{stem:'丁',branch:'巳'}, hour:{stem:'丙',branch:'午'} } });
const draft = () => ({ name:'합성 연구', memo:'원문', birth:manualBirth(input()) });
const state = () => upsertEntry(createEmptyVault(), draft());
const copy = x => JSON.parse(JSON.stringify(x));
test('manual: exactly sixty distinct valid pairs and no silent parity repair', () => {
  assert.equal(new Set(SIXTY_PILLARS.map(p => p.stem+p.branch)).size,60);
  for(const pair of SIXTY_PILLARS) assert.equal(validInputPillar(pair),true);
  for(const pair of [{stem:'甲',branch:'丑'}, {stem:0,branch:0}, {stem:'甲',branch:'子',extra:true}])assert.equal(validInputPillar(pair),false);
});
test('manual: required pillars are explicit; only hour can be unknown', () => {
  for(const key of ['year','month','day']){const p=input();p.pillars[key]=null;assert.ok(pillarInputErrors(p).length);}
  const p=input();p.pillars.hour=null;assert.deepEqual(pillarInputErrors(p),[]);
});
test('manual: unknown versions, unexpected keys and malformed values are rejected', () => {
  for(const p of [null,[],{}, {version:2,pillars:input().pillars}, {...input(),extra:1}, {version:1,pillars:{...input().pillars,extra:1}}])assert.ok(pillarInputErrors(p).length);
});
test('manual: birth stores literal pillars without inventing any date or clock time', () => {
  const s=state(),b=s.entries[0].birth;
  for(const key of ['input_year','input_month','input_day','input_hour','input_minute','calendar_type'])assert.equal(b[key],null);
  assert.equal(b.time_status,'unknown');assert.equal(validateVault(s).valid,true);
  assert.match(manualBirthLabel(b),/直接|직접/);
});
test('manual: mixed calendar fields cannot be stored or imported', () => {
  for(const patch of [{input_year:2000},{calendar_type:'solar'},{time_status:'known',input_hour:0,input_minute:0},{date_raw:'2000/02/29'},{correction_raw:'-30'},{timezone:'Asia/Seoul'}]){
    const s=state();assert.throws(()=>upsertEntry(s,{id:s.entries[0].id,birth:patch}));
    const bad=copy(createBackup(s));Object.assign(bad.state.entries[0].birth,patch);assert.throws(()=>restoreBackup(createEmptyVault(),bad));
  }
});
test('manual: own input and saved birth do not share mutable nested objects', () => {
  const p=input(),b=manualBirth(p);p.pillars.day.stem='甲';assert.equal(b.pillar_input.pillars.day.stem,'丁');
  const s=upsertEntry(createEmptyVault(),{name:'합성',birth:b});b.pillar_input.pillars.day.branch='未';assert.equal(s.entries[0].birth.pillar_input.pillars.day.branch,'巳');
});
test('manual: no-op edits preserve revision while actual edits retain exact previous input', () => {
  const s=state(),e=s.entries[0];assert.equal(upsertEntry(s,{id:e.id,birth:manualBirth(input())}),s);
  const p=input();p.pillars.hour=null;const n=upsertEntry(s,{id:e.id,birth:manualBirth(p)});
  assert.equal(n.entries[0].birth.version,e.birth.version+1);assert.deepEqual(n.entries[0].birthRevisions[0].birth,e.birth);
  assert.deepEqual(s.entries[0],e);
});
test('manual: backup round trip retains groups, literals, revisions and tombstones', () => {
  let s=state();s=saveGroup(s,{name:'연구',entryIds:[s.entries[0].id]});
  const id=s.entries[0].id,p=input();p.pillars.hour=null;s=upsertEntry(s,{id,birth:manualBirth(p)});s=deleteEntry(s,id);
  const r=restoreBackup(createEmptyVault(),createBackup(s)).state;
  assert.deepEqual(r.entries,s.entries);assert.deepEqual(r.workspace,s.workspace);assert.equal(validateVault(r).valid,true);
  assert.equal(restoreEntry(r,id).entries[0].birth.pillar_input.pillars.hour,null);
});
test('manual: older backup cannot overwrite a changed manual record', () => {
  const s=state(),p=input();p.pillars.hour=null;const n=upsertEntry(s,{id:s.entries[0].id,birth:manualBirth(p)});
  const r=restoreBackup(n,createBackup(s));assert.equal(r.state,n);assert.ok(r.stats.conflicts.length>0);
});
test('ordinary records remain unchanged when no manual input was requested', () => {
  const s=upsertEntry(createEmptyVault(),{name:'보통',birth:{calendar_type:'solar',input_year:2000,input_month:1,input_day:1,time_status:'unknown'}});
  assert.equal(s.entries[0].birth.pillar_input,undefined);assert.deepEqual(restoreBackup(createEmptyVault(),createBackup(s)).state.entries,s.entries);
});
test('manual: invalid stored pillar cannot pass validation through historical snapshots', () => {
  const s=state(),p=input();p.pillars.hour=null;const n=upsertEntry(s,{id:s.entries[0].id,birth:manualBirth(p)});
  n.entries[0].birthRevisions[0].birth.pillar_input.pillars.day={stem:'甲',branch:'丑'};assert.equal(validateVault(n).valid,false);
});
test('duplicate: matching names warn but never merge, including whitespace/fullwidth variants', () => {
  const s=upsertEntry(createEmptyVault(),{name:'ABC  기록'});assert.equal(duplicateCandidates(s,{name:' ＡＢＣ 기록 '}).length,1);
  const n=upsertEntry(s,{name:'ABC 기록'});assert.equal(n.entries.length,2);
});
test('duplicate: matching exact known birth inputs warn across different names', () => {
  const birth={calendar_type:'solar',input_year:2000,input_month:2,input_day:29,time_status:'known',input_hour:0,input_minute:0};
  const s=upsertEntry(createEmptyVault(),{name:'첫 기록',birth});
  assert.equal(duplicateCandidates(s,{name:'다른 기록',birth}).length,1);
  assert.equal(duplicateCandidates(s,{name:'다른 기록',birth:{...birth,input_minute:1}}).length,0);
});
test('duplicate: midnight, missing time, lunar leap and correction are not conflated', () => {
  const birth={calendar_type:'lunar',lunar_leap_month:false,input_year:2000,input_month:2,input_day:1,time_status:'known',input_hour:0,input_minute:0};
  const s=upsertEntry(createEmptyVault(),{name:'첫 기록',birth});
  for(const patch of [{time_status:'unknown',input_hour:null,input_minute:null},{lunar_leap_month:true},{calendar_type:'solar'},{longitude:127},{correction_raw:'-10'}])assert.equal(duplicateCandidates(s,{name:'다름',birth:{...birth,...patch}}).length,0);
});
test('duplicate: self, deleted entries and all-empty births are excluded', () => {
  const s=state(),e=s.entries[0];assert.equal(duplicateCandidates(s,e).length,0);
  assert.equal(duplicateCandidates(deleteEntry(s,e.id),draft()).length,0);
  const empty=upsertEntry(createEmptyVault(),{name:'가'});assert.equal(duplicateCandidates(empty,{name:'나'}).length,0);
});
test('duplicate: full manual tuple warns; unknown hour is not asserted equal', () => {
  const s=state();assert.equal(duplicateCandidates(s,{...draft(),name:'다른 이름'}).length,1);
  const p=input();p.pillars.hour=null;assert.equal(duplicateCandidates(s,{name:'다른 이름',birth:manualBirth(p)}).length,0);
});

test('duplicate: memo-only changes do not re-prompt for an intentionally separate record', () => {
  const a=state(),s=upsertEntry(a,{...draft(),name:'합성 별개'}),e=s.entries[1];
  assert.equal(duplicateCandidates(s,{id:e.id,name:e.name,memo:'수정',birth:manualBirth(input())}).length,0);
  assert.equal(duplicateCandidates(s,{id:e.id,name:a.entries[0].name,birth:manualBirth(input())}).length,1);
});
