import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_PROFILE_BANNERS,validProfileBanners,moveProfileBanner,toggleProfileBanner} from '../src/vault/profile-banners.js';
import {createEmptyVault,upsertEntry,createBackup,restoreBackup,validateVault,deleteEntry} from '../src/vault/model.js';
import {savePreferences} from '../src/vault/workspace-actions.js';
import {readPreferences} from '../src/vault/workspace.js';
import {birthdayEntries,currentBirth} from '../src/mobile/profile-banner-model.js';
const date=new Date(2026,9,20,15,34),birth={input_year:2000,input_month:10,input_day:20,calendar_type:'solar',time_status:'unknown'};
test('old backups read original three banner types without modifying archived bytes',()=>{
 const old=savePreferences(createEmptyVault(),{sort:'name'});delete old.workspace.preferences.profileBanners;
 const before=JSON.stringify(old),p=readPreferences(old).profileBanners;
 assert.deepEqual(p,{order:['my','current','birthday'],hidden:[]});p.order.reverse();p.hidden.push('my');
 assert.deepEqual(readPreferences(old).profileBanners,DEFAULT_PROFILE_BANNERS);assert.equal(JSON.stringify(old),before);assert.ok(validateVault(old).valid);
});
test('banner reorder and visibility preserve at least one of my/current, independent of birthday',()=>{
 const value=toggleProfileBanner(DEFAULT_PROFILE_BANNERS,'my');
 assert.throws(()=>toggleProfileBanner(value,'current'),/모두 비활성화/);
 assert.deepEqual(toggleProfileBanner(value,'my'),DEFAULT_PROFILE_BANNERS);
 const both=toggleProfileBanner(value,'birthday');assert.ok(validProfileBanners(both));
 assert.deepEqual(moveProfileBanner(both,'current',-1).order,['current','my','birthday']);
 assert.deepEqual(moveProfileBanner(both,'my',-1),both);assert.equal(DEFAULT_PROFILE_BANNERS.hidden.length,0);
});
test('invalid banner settings cannot be saved, including duplicate, missing and injected names',()=>{
 for(const value of [null,{}, {order:['my','current','birthday'],hidden:['my','current']},{order:['my','my','birthday'],hidden:[]},{order:['my','current'],hidden:[]},{order:['my','current','birthday'],hidden:['other']},{order:['my','current','birthday'],hidden:['my','my']},{order:['my','current','birthday'],hidden:[],extra:true}])assert.throws(()=>savePreferences(createEmptyVault(),{profileBanners:value}));
});
test('banner preferences and individual birthday opt-out survive backup and preserve raw birth/memo',()=>{
 const old=upsertEntry(createEmptyVault(),{name:'생일 합성',memo:'원문 유지',birth});
 const s=savePreferences(upsertEntry(old,{id:old.entries[0].id,showBirthday:false}),{profileBanners:{order:['birthday','current','my'],hidden:['my']}});
 const restored=restoreBackup(createEmptyVault(),createBackup(s)).state;
 assert.deepEqual(restored.entries,s.entries);assert.deepEqual(restored.workspace,s.workspace);assert.deepEqual(restored.entries[0].birth,old.entries[0].birth);assert.deepEqual(restored.entries[0].birthRevisions,[]);assert.equal(restored.entries[0].memo,'원문 유지');
 assert.throws(()=>upsertEntry(old,{id:old.entries[0].id,showBirthday:'false'}));
 assert.equal(readPreferences(restoreBackup(s,createBackup(old)).state).profileBanners.order[0],'birthday');assert.equal(restoreBackup(s,createBackup(old)).state.entries[0].showBirthday,false);
});
test('birthday lookup requires confirmed calendar and real dates, respects opt-out and tombstones',()=>{
 let s=createEmptyVault();for(const [name,extra] of [['오늘',{}],['숨김',{showBirthday:false}],['다른 날',{birth:{...birth,input_day:21}}],['역법 미확인',{birth:{...birth,calendar_type:null}}]])s=upsertEntry(s,{name,birth,...extra});
 s=upsertEntry(s,{name:'삭제',birth});s=deleteEntry(s,s.entries.at(-1).id);
 const before=JSON.stringify(s);assert.deepEqual(birthdayEntries(s.entries,date).map(e=>e.name),['오늘']);assert.equal(JSON.stringify(s),before);assert.deepEqual(birthdayEntries([{id:'invalid',birth:{...birth,input_month:2,input_day:30}}],date),[]);
});
test('original birthday comparison uses birth-year solar month/day for lunar births and no Feb29 substitute',()=>{
 const lunar={id:'lunar',birth:{input_year:2024,input_month:1,input_day:1,calendar_type:'lunar',lunar_leap_month:false}};
 assert.equal(birthdayEntries([lunar],new Date(2026,1,10)).length,1);
 assert.equal(birthdayEntries([lunar],new Date(2026,1,17)).length,0);
 const leap={id:'leap',birth:{...birth,input_month:2,input_day:29}};
 assert.equal(birthdayEntries([leap],new Date(2025,1,28)).length,0);
 assert.equal(birthdayEntries([leap],new Date(2028,1,29)).length,1);
});
test('current chart creates a temporary query from local clock and never assigns a person or sex',()=>{
 const b=currentBirth(date);assert.deepEqual([b.input_year,b.input_month,b.input_day,b.input_hour,b.input_minute],[2026,10,20,15,34]);assert.equal(b.sex,undefined);assert.equal(b.calculation_policy.engine,'astronomical-v1');assert.throws(()=>currentBirth(new Date(2051,0,1)));assert.throws(()=>currentBirth(new Date(NaN)));
});
