import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const file=await build({stdin:{contents:`export * from './src/mobile/engine-crosscheck.js'; export * from './src/mobile/compatibility-model.js'; export {calculateEntry} from './src/mobile/engine.js';`,resolveDir:root,loader:'js'},bundle:true,write:false,format:'esm',platform:'node',logLevel:'silent',define:{'import.meta.env.VITE_APP_MODE':'"mobile"','import.meta.env.VITE_GEMINI_API_KEY':'""'}});
const m=await import(`data:text/javascript;base64,${Buffer.from(file.outputFiles[0].text).toString('base64')}`);
const fixture=(year=2001,month=6,day=18,time='known')=>({id:'a',name:'test',birth:{input_year:year,input_month:month,input_day:day,calendar_type:'solar',lunar_leap_month:false,time_status:time,input_hour:13,input_minute:45,sex:'male'}});
test('compares four pillars from two engines without modifying original entry',()=>{
 const e=fixture(),str=JSON.stringify(e),v=m.compareIndependentEngines(e);
 assert.equal(v.status,'comparable',JSON.stringify(v));assert.equal(v.rows.length,4);assert.equal(v.matching+v.differences.length,4);
 for(const row of v.rows){assert.equal(row.equal,row.legacy===row.astronomical);assert.equal(typeof row.name,'string');}
 assert.equal(JSON.stringify(e),str);
});
test('comparison reports unavailability rather than manufacturing birth hour or unsupported dates',()=>{
 assert.equal(m.compareIndependentEngines(fixture(2001,6,18,'unknown')).status,'unavailable');
 assert.equal(m.compareIndependentEngines(fixture(2041)).status,'unavailable');
 const assumed=fixture();assumed.birth.calendar_type=null;assert.equal(m.compareIndependentEngines(assumed).status,'comparable');
 assert.equal(m.compareIndependentEngines({birth:{pillar_input:{pillars:{}}}}).status,'unavailable');
});
test('comparison includes independently auditable day-stem/stem-hap and day-branch clash/harm',()=>{
 const p=(s,b)=>({stem:s,branch:b,stemIdx:'甲乙丙丁戊己庚辛壬癸'.indexOf(s),branchIdx:'子丑寅卯辰巳午未申酉戌亥'.indexOf(b)});
 const r=parts=>({saju:{pillars:parts}});
 const l=r([p('甲','子'),p('甲','子'),p('庚','子'),p('甲','子')]);
 const right=r([p('己','未'),p('己','未'),p('丙','午'),p('己','未')]);
 const facts=m.compareChartFacts(l,right);
 assert.equal(facts.status,'ready');
 for(const name of ['일간 합','일지 해','일지 원진','월지 충'])assert.ok(facts.facts.some(f=>f.name===name),name);
 assert.equal(facts.samePillars,0);
 assert.equal(m.compareChartFacts(l,r([{}, {}, {}, {}])).status,'unavailable');
});
test('structural similar search uses equal pillars only, never fortune score, and is stable',()=>{
 const a=fixture(),b=fixture(2001,6,18),c=fixture(2001,6,19);
 b.id='b';b.name='나나';c.id='c';c.name='가가';
 const r=m.calculateEntry(a);
 const items=m.similarChartFacts(r,[c,b],m.calculateEntry,2);
 assert.deepEqual(items.map(x=>x.entryId),['b','c']);
 assert.equal(items[0].daySame,true);assert.equal(items[0].equalPillars,4);
 assert.ok(!('fortuneScore' in items[0]));
 assert.deepEqual(m.similarChartFacts(r,[],m.calculateEntry),[]);
});

test('1949 historical Korean time offset creates explicit hour-only difference, without silently replacing either result',()=>{
 const birth=fixture(1949,6,18).birth;birth.input_hour=13;birth.input_minute=30;
 const result=m.compareIndependentEngines({name:'boundary',birth});
 assert.equal(result.status,'comparable');
 assert.deepEqual(result.differences,['시주']);
 assert.equal(result.rows[1].equal,true);assert.equal(result.rows[2].equal,true);assert.equal(result.rows[3].equal,true);
});
