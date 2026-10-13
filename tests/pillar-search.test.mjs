import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const bundled=await build({stdin:{contents:"export * from './src/mobile/pillar-search.js';export * from './src/mobile/engine.js';export {calcSaju,calcStrengthDetail,calcTCPA,calcYongsin} from './src/App.jsx';export {manualBirth} from './src/vault/pillar-input.js';",resolveDir:root,loader:'js'},bundle:true,write:false,format:'esm',platform:'node',logLevel:'silent',define:{'import.meta.env.VITE_APP_MODE':'"mobile"','import.meta.env.VITE_GEMINI_API_KEY':'""'}});
const m=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const tuple=s=>s.pillars.map(p=>p.stem+p.branch).join('|');
const inputFrom=s=>({version:1,pillars:Object.fromEntries(['hour','day','month','year'].map((k,i)=>[k,{stem:s.pillars[i].stem,branch:s.pillars[i].branch}]))});
const fixture=()=>m.calcSaju(2000,2,29,12,0);
const birth=()=>({input_year:2000,input_month:2,input_day:29,calendar_type:'solar',lunar_leap_month:false,input_hour:null,input_minute:null,time_status:'unknown',sex:null});
test('search: hour windows partition all 1,440 minutes exactly once', () => {
  const minutes=[];assert.equal(m.LEGACY_HOUR_WINDOWS.length,13);
  for(const w of m.LEGACY_HOUR_WINDOWS)for(let i=w.startMinute;i<=w.endMinute;i++)minutes.push(i);
  assert.deepEqual(minutes,Array.from({length:1440},(_,i)=>i));
  assert.equal(m.LEGACY_HOUR_WINDOWS.at(-1).start,'23:30');assert.equal(m.LEGACY_HOUR_WINDOWS[0].end,'01:29');
});
test('search: every minute matches the representative tuple, including both 子 intervals', () => {
  const candidates=m.dateCandidates('2000-02-29');
  for(let minute=0;minute<1440;minute++){
    const c=candidates.find(w=>minute>=w.startMinute&&minute<=w.endMinute);
    assert.equal(tuple(m.calcSaju(2000,2,29,Math.floor(minute/60),minute%60)),tuple(c.saju),'minute '+minute);
  }
});
test('search: lower/upper/leap/term/year boundaries follow the baseline without off-by-one minutes', () => {
  for(const date of ['1900-01-01','2000-02-29','2024-02-04','2025-12-31','2026-01-01','2030-12-31']){
    const [y,mo,d]=date.split('-').map(Number);
    for(const c of m.dateCandidates(date))for(const minute of [c.startMinute,c.endMinute])assert.equal(tuple(c.saju),tuple(m.calcSaju(y,mo,d,Math.floor(minute/60),minute%60)));
  }
});
test('search: exact four-pillar reverse lookup returns the real fixture date and time window', async () => {
  const query=inputFrom(fixture()),before=JSON.stringify(query);
  const found=await m.findFourPillars({input:query,start:'2000-02-01',end:'2000-03-31'});
  assert.equal(found.results.length,1);assert.equal(found.results[0].date,'2000-02-29');assert.equal(found.truncated,false);assert.equal(found.checked,60);
  const hit=found.results[0].windows[0];assert.equal(hit.start,'11:30');assert.equal(hit.end,'13:29');assert.equal(tuple(hit.saju),tuple(fixture()));
  assert.equal(JSON.stringify(query),before);
});
test('search: both early and late 子 are included, not silently merged across dates', async () => {
  const input=inputFrom(m.calcSaju(2000,2,29,0,0));
  const found=await m.findFourPillars({input,start:'2000-02-29',end:'2000-02-29'});
  assert.deepEqual(found.results[0].windows.map(w=>[w.start,w.end]),[['00:00','01:29'],['23:30','23:59']]);
});
test('search: omitting hour searches three pillars and reports the whole date', async () => {
  const input=inputFrom(fixture());input.pillars.hour=null;
  const found=await m.findFourPillars({input,start:'2000-02-29',end:'2000-02-29'});
  assert.equal(found.results.length,1);assert.equal(found.results[0].windows.length,13);
});
test('search: a wrong month or year does not pass a day-only filter', async () => {
  for(const key of ['month','year']){
    const input=inputFrom(fixture());input.pillars[key]={stem:'甲',branch:'子'};
    const found=await m.findFourPillars({input,start:'2000-02-29',end:'2000-02-29'});assert.equal(found.results.length,0);
  }
});
test('search: invalid dates, parity, versions, missing pillars and result limits reject', async () => {
  const input=inputFrom(fixture());
  for(const opt of [{start:'1900-02-29'},{end:'2031-01-01'},{start:'2001-01-01',end:'2000-01-01'},{limit:0},{limit:1001},{input:{...input,version:3}},{input:{version:1,pillars:{...input.pillars,day:{stem:'甲',branch:'丑'}}}}])await assert.rejects(m.findFourPillars({input,start:'2000-01-01',end:'2000-12-31',...opt}));
});
test('search: cancellation before or during the scan never publishes a completed result', async () => {
  const input=inputFrom(fixture()),a=new AbortController();a.abort();await assert.rejects(m.findFourPillars({input,start:'1900-01-01',end:'2030-12-31',signal:a.signal}),{name:'AbortError'});
  const b=new AbortController();await assert.rejects(m.findFourPillars({input,start:'1900-01-01',end:'2030-12-31',signal:b.signal,onProgress:()=>b.abort()}),{name:'AbortError'});
});
test('search: caller edits cannot mutate an in-flight query snapshot', async () => {
  const input=inputFrom(fixture());const work=m.findFourPillars({input,start:'2000-02-29',end:'2000-02-29'});input.pillars.day={stem:'甲',branch:'子'};
  assert.equal((await work).results.length,1);
});
test('search: exact limit is complete; a genuinely additional hit is reported as truncated', async () => {
  const input=inputFrom(m.calcSaju(2000,2,5,12,0));
  const exact=await m.findFourPillars({input,start:'2000-02-05',end:'2000-02-05',limit:1});assert.equal(exact.truncated,false);
  const all=await m.findFourPillars({input,start:'1900-01-01',end:'2030-12-31'});
  assert.ok(all.results.length>1);
  const limited=await m.findFourPillars({input,start:'1900-01-01',end:'2030-12-31',limit:1});assert.equal(limited.truncated,true);assert.equal(limited.results.length,1);
});
test('candidates: read-only generation preserves unknown birth state', () => {
  const b=birth(),before=JSON.stringify(b);const c=m.unknownTimeCandidates(b);assert.equal(c.length,13);assert.equal(JSON.stringify(b),before);
  assert.ok(c.every(w=>w.certainty==='candidate'));
});
test('candidates: unconfirmed calendar, lunar leap and correction settings block comparison', () => {
  for(const patch of [{calendar_type:null},{calendar_type:'lunar',lunar_leap_month:null},{correction_raw:'-30'},{input_year:null}])assert.throws(()=>m.unknownTimeCandidates({...birth(),...patch}));
  assert.throws(()=>m.unknownTimeCandidates(m.manualBirth(inputFrom(fixture()))));
});
test('candidates: date handoff never marks the representative minute as a birth time', () => {
  const seed=m.candidateDateSeed(m.dateCandidates('2000-02-29')[0]);
  assert.equal(seed.input_year,2000);assert.equal(seed.input_day,29);assert.equal(seed.time_status,'unknown');assert.equal(seed.input_hour,null);assert.equal(seed.input_minute,null);
});
test('manual engine: supplied pillars produce existing four-pillar analysis without a fake date or daeun', () => {
  const input=inputFrom(fixture()),result=m.calculateEntry({name:'합성',birth:m.manualBirth(input)});
  assert.equal(result.status,'ready');assert.equal(result.origin,'manual');assert.equal(tuple(result.saju),tuple(fixture()));
  assert.equal(result.saju.solar,null);assert.equal(result.saju.lunar,null);assert.deepEqual(result.daeun,[]);assert.equal(result.legacyForm,null);
  assert.deepEqual(result.strength,m.calcStrengthDetail(fixture().pillars));
  assert.deepEqual(result.tcpa,m.calcTCPA(fixture().pillars));
});
test('manual engine: unknown hour remains partial; invalid literals cannot reach analysis', () => {
  const input=inputFrom(fixture());input.pillars.hour=null;
  const result=m.calculateEntry({name:'합성',birth:m.manualBirth(input)});assert.equal(result.status,'partial');assert.equal(result.strength,null);assert.equal(result.saju.pillars[0].unknown,true);
  const invalid=m.manualBirth(input);invalid.pillar_input.pillars.day={stem:'甲',branch:'丑'};
  assert.equal(m.calculateEntry({name:'합성',birth:invalid}).status,'needs_confirmation');
});
