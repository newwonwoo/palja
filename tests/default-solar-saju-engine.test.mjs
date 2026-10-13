import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({
  stdin: { contents: `export { calculateEntry, solarDate, birthSummary } from './src/mobile/engine.js';
    export { referenceBirthLabel, ageBadge } from './src/mobile/list-utils.js';
    export { displayCertainty, chartSlots } from './src/mobile/detail-view-model.js';
    export { compareIndependentEngines } from './src/mobile/engine-crosscheck.js';
    export { birthForCalculation, effectiveCalendar, isDefaultSolar } from './src/mobile/birth-defaults.js';`,
    resolveDir: root, loader: 'js' },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
  define: { 'import.meta.env.VITE_APP_MODE': '"mobile"', 'import.meta.env.VITE_GEMINI_API_KEY': '""' },
});
const m = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const birth = (overrides={}) => ({
  input_year:2001, input_month:6, input_day:18, input_hour:15, input_minute:0,
  calendar_type:null, calendar_symbol_raw:'+', lunar_leap_month:null,
  time_status:'known', sex:'male', correction_raw:null,
  ...overrides,
});
const fixture = (overrides={}) => ({ id:'synthetic-a', name:'Synthetic QA',
  birth:birth(overrides), referenceDisplay:null });

test('legacy imported birth with unconfirmed calendar is rendered as default solar without database mutation',()=>{
  const entry=fixture();
  const before=JSON.stringify(entry);
  assert.equal(m.isDefaultSolar(entry.birth),true);
  assert.equal(m.effectiveCalendar(entry.birth),'solar');
  const result=m.calculateEntry(entry);
  assert.equal(result.status,'ready',result.message);
  assert.equal(result.assumedSolar,true);
  assert.equal(result.saju.pillars.length,4);
  assert.ok(result.saju.pillars.every(p=>!p.unknown&&p.stem&&p.branch));
  assert.deepEqual(result.saju.pillars, m.calculateEntry(fixture({calendar_type:'solar',lunar_leap_month:false})).saju.pillars);
  assert.deepEqual(m.solarDate(entry.birth),{year:2001,month:6,day:18});
  assert.match(m.referenceBirthLabel(entry),/양력\(기본\)/);
  assert.match(m.birthSummary(entry.birth),/양력\(기본\)/);
  assert.equal(JSON.stringify(entry),before,'do not rewrite imported birth record or source symbol');
});

test('raw correction annotation never blocks calendar display or falsely applies unknown minute offsets',()=>{
  const entry=fixture({calendar_symbol_raw:'-', correction_raw:'(원본 시각 보정 표기)'});
  const result=m.calculateEntry(entry);
  assert.equal(result.status,'ready',result.message);
  assert.equal(result.correctionUnapplied,true);
  const exact=m.calculateEntry(fixture({calendar_type:'solar',lunar_leap_month:false,calendar_symbol_raw:'-',correction_raw:null}));
  assert.deepEqual(result.saju.pillars,exact.saju.pillars);
  const notice=m.displayCertainty(entry,result);
  assert.match(notice.body,/자동 적용하지 않습니다/);
  assert.match(m.referenceBirthLabel(entry),/양력\(기본\)/);
  assert.equal(entry.birth.calendar_type,null);
  assert.equal(entry.birth.correction_raw,'(원본 시각 보정 표기)');
});

test('explicit lunar dates and leap-month choices are preserved, not overridden by solar default',()=>{
  const entry=fixture({calendar_type:'lunar',lunar_leap_month:false});
  assert.equal(m.isDefaultSolar(entry.birth),false);
  assert.equal(m.effectiveCalendar(entry.birth),'lunar');
  assert.equal(m.birthForCalculation(entry.birth),entry.birth);
  assert.equal(m.calculateEntry(entry).assumedSolar,false);
  assert.match(m.birthSummary(entry.birth),/음력/);
});

test('partial dates cannot manufacture birth hour, but calculate safely known pillars',()=>{
  const entry=fixture({time_status:'unknown',input_hour:null,input_minute:null,sex:null});
  const result=m.calculateEntry(entry);
  assert.equal(result.status,'partial',result.message);
  assert.ok(result.saju.pillars[0].unknown);
  assert.ok(!result.saju.pillars[1].unknown && !result.saju.pillars[2].unknown && !result.saju.pillars[3].unknown);
  assert.equal(result.daeun.length,0);
});

test('unconfirmed calendar with complete input is crosschecked against both existing saju and independent engines',()=>{
  const entry=fixture();
  const check=m.compareIndependentEngines(entry);
  assert.equal(check.status,'comparable',JSON.stringify(check));
  assert.equal(check.rows.length,4);
  assert.equal(check.matching+check.differences.length,4);
  assert.match(check.explanation,/기본 양력/);
});

test('explicit old data cannot be rewritten when choosing a different calendar for readout',()=>{
  const entry=fixture({calendar_type:'lunar',lunar_leap_month:false});
  const before=JSON.stringify(entry);
  m.calculateEntry(entry);
  assert.equal(JSON.stringify(entry),before);
});


test('1984/01/30 15:00 screenshot record computes natal columns from saju engine with default solar and no inferred sex',()=>{
  const entry=fixture({input_year:1984,input_month:1,input_day:30,input_hour:15,input_minute:0,
    sex:null,calendar_type:null,calendar_symbol_raw:'+',correction_raw:"(-3' -13')"});
  const original=JSON.stringify(entry);
  const result=m.calculateEntry(entry);
  assert.equal(result.status,'ready',result.message);
  assert.equal(result.assumedSolar,true);
  assert.equal(result.correctionUnapplied,true);
  assert.equal(result.saju.pillars.length,4);
  for (const pillar of result.saju.pillars) assert.ok(!pillar.unknown && pillar.stem && pillar.branch,JSON.stringify(pillar));
  assert.deepEqual(result.daeun,[],'sex not recorded; do not fabricate decade direction');
  assert.match(m.referenceBirthLabel(entry),/양력\\(기본\\)/);
  assert.equal(JSON.stringify(entry),original,'screenshot-import raw data must remain unchanged');
});
