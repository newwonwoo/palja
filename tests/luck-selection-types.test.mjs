import test from 'node:test';
import assert from 'node:assert/strict';
import {selectionForType,selectionType,shiftSelection,selectedLuckItems,preciseLuckView} from '../src/mobile/selection-model.js';
import {createEmptyVault,upsertEntry,createBackup,restoreBackup} from '../src/vault/model.js';
import {rememberSelection,saveSelectionPreset,saveNote,integrated} from '../src/vault/integrated-actions.js';
const base={entryId:'sample',date:'2024-02-29',hour:23,minute:57};
test('original day/month/year transitions retain date and clock without mutating old bookmarks',()=>{
 const old=JSON.stringify(base);assert.equal(selectionType(base),'day');
 for(const type of ['day','month','year'])assert.deepEqual(selectionForType(base,type),{...base,type});
 assert.equal(JSON.stringify(base),old);assert.throws(()=>selectionForType(base,'decade'));
 assert.throws(()=>selectionForType({...base,date:'2025-02-29'},'day'));
});
test('period navigation crosses midnight, civil month ends, leap years and year boundaries',()=>{
 for(const [s,offset,date] of [
  [{...base,type:'day'},1,'2024-03-01'],[{...base,type:'day'},-1,'2024-02-28'],
  [{...base,type:'year'},1,'2025-02-28'],[{...base,type:'year'},-1,'2023-02-28'],
  [{...base,date:'2024-01-31',type:'month'},1,'2024-02-29'],
  [{...base,date:'2025-03-31',type:'month'},-1,'2025-02-28'],
  [{...base,date:'2025-12-31',type:'month'},1,'2026-01-31'],
  [{...base,date:'2026-01-01',type:'day'},-1,'2025-12-31'],
 ]){const old=JSON.stringify(s),next=shiftSelection(s,offset);assert.equal(next.date,date);assert.equal(next.hour,23);assert.equal(next.minute,57);assert.equal(JSON.stringify(s),old);}
});
test('range limits block before saving and never clamp an unsupported year to another year',()=>{
 for(const type of ['day','month','year']){
  assert.throws(()=>shiftSelection({...base,date:'1900-01-01',type},-1),/1900~2050/);
  assert.throws(()=>shiftSelection({...base,date:'2050-12-31',type},1),/1900~2050/);
 }
 assert.throws(()=>shiftSelection(base,2));
});
test('displayed selected luck and custom weighting scope follow query type',()=>{
 const selected={year:1,month:2,day:3,hour:4};
 assert.deepEqual(selectedLuckItems({...base,type:'year'},selected).map(x=>x.pillar),[1]);
 assert.deepEqual(selectedLuckItems({...base,type:'month'},selected).map(x=>x.pillar),[1,2]);
 assert.deepEqual(selectedLuckItems(base,selected).map(x=>x.pillar),[1,2,3,4]);
});
test('query type survives presets, note versions and backup while old untyped records remain valid',()=>{
 let old=upsertEntry(createEmptyVault(),{name:'조회 유형 합성',memo:'보존'}),id=old.entries[0].id;
 const chosen={...base,entryId:id,type:'month'};
 let s=rememberSelection(old,chosen);s=saveSelectionPreset(s,id,'월 조회',chosen);
 const note={title:'운 조회',text:'보존',category:'',date:'2024-02-29',images:[],drawing:null,selection:{date:chosen.date,hour:23,minute:57,type:'month'}};
 s=saveNote(s,id,note);s=saveNote(s,id,{...note,id:integrated(s).notes[0].id,title:'수정'});
 const back=restoreBackup(createEmptyVault(),createBackup(s)).state;
 assert.equal(integrated(back).selection.type,'month');assert.equal(integrated(back).presets[0].selection.type,'month');assert.equal(integrated(back).notes[0].history[0].selection.type,'month');assert.deepEqual(back.entries,old.entries);
 assert.throws(()=>rememberSelection(s,{...chosen,type:'anything'}));
 assert.throws(()=>saveSelectionPreset(s,id,'잘못된 유형',{...chosen,type:null}));
 assert.throws(()=>saveNote(s,id,{...note,selection:{...note.selection,type:'hour'}}));
 assert.equal(selectionType(integrated(rememberSelection(old,{...chosen,type:undefined})).selection),'day');
});
test('main chart uses next returned decade boundary instead of a fixed tropical-year duration',()=>{
 const start=Date.UTC(2020,5,1),next=Date.UTC(2030,5,2),a={stem:'甲',branch:'子',stemIdx:0,branchIdx:0,startYear:2020,startInstant:start},b={stem:'乙',branch:'丑',stemIdx:1,branchIdx:1,startYear:2030,startInstant:next};
 const view={year:2030,decades:[a,b],years:[],months:[]},selected={instant:next-1,year:{stem:'庚',branch:'戌'}};
 assert.equal(preciseLuckView(view,{origin:'astronomical'},selected).decade,a);
 assert.equal(preciseLuckView(view,{origin:'astronomical'},{...selected,instant:next}).decade,b);
 assert.equal(preciseLuckView(view,{origin:'astronomical'},{...selected,instant:start-1}).decade,null);
 assert.equal(preciseLuckView(view,{origin:'manual'},selected),view);
});
test('decade navigation selects at or after the crossing rather than keeping an earlier day in its year',async()=>{
 const {selectionForDecade,selectedPillars}=await import('../src/mobile/selection-model.js');
 const {DEFAULT_POLICY}=await import('../src/calendar/precise.js');
 for(const [date,policy] of [[Date.UTC(2030,5,12,6,7,30),DEFAULT_POLICY],[Date.UTC(1900,5,12,6,7,30),DEFAULT_POLICY],[Date.UTC(2030,5,12,6,7,30),{...DEFAULT_POLICY,zone:'fixed',offsetMinutes:-240}]]){
  const next=selectionForDecade({...base,date:'2020-01-01'},{startInstant:date,startYear:2030},policy);
  const actual=selectedPillars(next,policy).instant;
  assert.ok(actual>=date&&actual-date<60000);assert.equal(next.type,'year');
 }
 assert.equal(selectionForDecade(base,{startYear:2025}).date,'2025-02-28');
 assert.throws(()=>selectionForDecade(base,{startYear:null}));
 assert.throws(()=>selectionForDecade(base,{startInstant:Date.UTC(2051,0,1)}),/1900~2050/);
});
test('independent ten-decade ranges are contiguous and final range has an explicit end',async()=>{
 const {precisePillars,preciseDaeun,DEFAULT_POLICY}=await import('../src/calendar/precise.js');
 const {treeDecade}=await import('../src/mobile/decade-selection.js');
 const saju=precisePillars({year:2000,month:1,day:1,hour:12,minute:0},DEFAULT_POLICY);
 for(const sex of ['male','female']){
  const rows=preciseDaeun(saju,sex);assert.equal(rows.length,10);
  for(let i=0;i<rows.length;i++){
   assert.ok(rows[i].endInstant>rows[i].startInstant);
   if(i<9)assert.equal(rows[i].endInstant,rows[i+1].startInstant);
   assert.equal(treeDecade(rows,{instant:rows[i].startInstant},rows[i].startYear).pillar,rows[i]);
  }
  const last=rows.at(-1);assert.equal(treeDecade(rows,{instant:last.endInstant-1},last.startYear+10).pillar,last);
  assert.equal(treeDecade(rows,{instant:last.endInstant},last.startYear+10).pillar,null);
 }
});
