import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const bundle=await build({stdin:{contents:`export * from './src/mobile/luck-tree-model.js';export {calculateEntry} from './src/mobile/engine.js';export {selectedPillars} from './src/mobile/selection-model.js';`,resolveDir:root,loader:'js'},bundle:true,write:false,format:'esm',platform:'node',logLevel:'silent',define:{'import.meta.env.VITE_APP_MODE':'"mobile"','import.meta.env.VITE_GEMINI_API_KEY':'""'}});
const m=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const entry={name:'트리 합성 검사',birth:{input_year:2000,input_month:1,input_day:1,input_hour:12,input_minute:0,time_status:'known',calendar_type:'solar',lunar_leap_month:false,sex:'male'}};
const result=m.calculateEntry(entry),selection={entryId:'sample',date:'2026-10-20',hour:15,minute:34},selected=m.selectedPillars(selection);
const a={stem:'甲',branch:'子',stemIdx:0,branchIdx:0,startYear:2020,startAge:1},b={stem:'乙',branch:'丑',stemIdx:1,branchIdx:1,startYear:2030,startAge:11};

test('five selected levels retain original order and four natal columns',()=>{
 const before=JSON.stringify({entry,result,selection,selected}),tree=m.luckTreeView(entry,result,selection,selected);
 assert.equal(tree.status,'ready');assert.deepEqual(tree.columns.map(c=>c.label),['시진','일진','절운','세운','대운']);
 assert.deepEqual(tree.columns.slice(0,4).map(c=>c.pillar),[selected.hour,selected.day,selected.month,selected.year]);
 assert.deepEqual(tree.natal.map(c=>c.key),['hour','day','month','birthYear']);
 assert.equal(JSON.stringify({entry,result,selection,selected}),before);
});
test('exact crossing time selects old decade until the next boundary, including within a year',()=>{
 const first=Date.UTC(2020,5,1),next=Date.UTC(2030,5,1),end=Date.UTC(2040,5,1);
 const decades=[{...b,startInstant:next,endInstant:end},{...a,startInstant:first}];
 assert.equal(m.treeDecade(decades,{instant:first-1},2020).pillar,null);
 assert.equal(m.treeDecade(decades,{instant:first},2020).pillar.stem,'甲');
 assert.equal(m.treeDecade(decades,{instant:next-1},2030).pillar.stem,'甲');
 assert.equal(m.treeDecade(decades,{instant:next},2030).pillar.stem,'乙');
 assert.equal(m.treeDecade(decades,{instant:end},2040).pillar,null);
});
test('year-only decades are marked approximate and never extended beyond ten years',()=>{
 assert.equal(m.treeDecade([a,b],{},2019).pillar,null);
 assert.deepEqual(m.treeDecade([a,b],{},2029),{pillar:a,precision:'year',reason:null});
 assert.equal(m.treeDecade([a,b],{},2030).pillar,b);
 assert.equal(m.treeDecade([a,b],{},2040).pillar,null);
 assert.equal(m.treeDecade([{...a,startYear:null}],{},2026).pillar,null);
});
test('missing natal day and invalid selected date do not produce a tree',()=>{
 assert.equal(m.luckTreeView(entry,{},selection,selected).status,'unavailable');
 assert.deepEqual(m.luckTreeView(entry,result,selection,{error:'날짜 범위 밖'}),{status:'unavailable',reason:'날짜 범위 밖'});
});
test('unknown natal hour remains unknown while selected clock hour is independently known',()=>{
 const partial=structuredClone(result);partial.saju.pillars[0]={unknown:true};
 const tree=m.luckTreeView(entry,partial,selection,selected);
 assert.equal(tree.natal[0].kind,'unknown');assert.equal(tree.columns[0].kind,'calculated');
});
test('a timed final decade without an end boundary is never labeled exact',()=>{
 const d={...a,startInstant:Date.UTC(2020,0,1)};
 assert.equal(m.treeDecade([d],{instant:Date.UTC(2026,0,1)},2026).precision,'year');
 assert.equal(m.treeDecade([d],{instant:Date.UTC(2031,0,1)},2031).pillar,null);
});
test('missing engine decade data stays unknown rather than borrowing another calculation policy',()=>{
 const empty=structuredClone(result);empty.daeun=[];
 const tree=m.luckTreeView(entry,empty,selection,selected);
 assert.equal(tree.columns.at(-1).kind,'unknown');assert.equal(tree.columns.at(-1).pillar,null);
 assert.equal(tree.decadeReason,'대운을 계산할 정보가 없습니다.');
});
