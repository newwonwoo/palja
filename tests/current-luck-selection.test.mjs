import test from 'node:test';
import assert from 'node:assert/strict';
import {selectionForNow} from '../src/mobile/selection-model.js';
import {rememberSelection,integrated} from '../src/vault/integrated-actions.js';
import {createEmptyVault,upsertEntry} from '../src/vault/model.js';

test('today selection uses local calendar and time at the moment of the action',()=>{
 const now=new Date(2026,9,20,23,59,44),before=now.getTime();
 assert.deepEqual(selectionForNow('sample',now),{entryId:'sample',date:'2026-10-20',hour:23,minute:59});
 assert.deepEqual(selectionForNow('sample',new Date(2027,0,1,0,1)),{entryId:'sample',date:'2027-01-01',hour:0,minute:1});
 assert.equal(now.getTime(),before);
});
test('invalid current dates and unsupported years are rejected rather than silently clamped',()=>{
 for(const now of [new Date(NaN),new Date(1899,11,31),new Date(2051,0,1),null])assert.throws(()=>selectionForNow('sample',now));
 assert.throws(()=>selectionForNow('',new Date(2026,0,1)));
});
test('saving current luck changes selection without rewriting the birth record or presets',()=>{
 const old=upsertEntry(createEmptyVault(),{name:'현재 운 합성 검사',memo:'보존할 메모'});
 const next=rememberSelection(old,selectionForNow(old.entries[0].id,new Date(2026,9,20,15,34)));
 assert.deepEqual(next.entries,old.entries);
 assert.deepEqual(integrated(next).presets,integrated(old).presets);
 assert.equal(integrated(next).selection.date,'2026-10-20');
});
