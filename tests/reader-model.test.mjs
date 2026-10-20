import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import {nayinOf} from '../src/mobile/traditional-reference.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const bundle=await build({stdin:{contents:`export * from './src/mobile/reader-model.js';export { calculateEntry } from './src/mobile/engine.js';`,resolveDir:root,loader:'js'},bundle:true,write:false,format:'esm',platform:'node',logLevel:'silent',define:{'import.meta.env.VITE_APP_MODE':'"mobile"','import.meta.env.VITE_GEMINI_API_KEY':'""'}});
const m=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
// Test-only exports; production App.jsx and its engine are never edited.
const src=await fs.readFile(root+'src/App.jsx','utf8');
const baseline=await build({stdin:{contents:src+'\nexport { calcHumidity, calcSinsal };',resolveDir:root+'src',loader:'jsx'},bundle:true,write:false,format:'esm',platform:'node',logLevel:'silent',define:{'import.meta.env.VITE_APP_MODE':'"mobile"','import.meta.env.VITE_GEMINI_API_KEY':'""'}});
const old=await import(`data:text/javascript;base64,${Buffer.from(baseline.outputFiles[0].text).toString('base64')}`);
const fixture=(day=29)=>({name:'Synthetic QA',birth:{input_year:2000,input_month:2,input_day:day,calendar_type:'solar',lunar_leap_month:false,time_status:'known',input_hour:13,input_minute:45,sex:'male'}});
const e=fixture(), r=m.calculateEntry(e),v=m.luckView(r,2027), c=m.sixColumns(e,r,v);

test('year input rejects malformed values and clamps fallback',()=>{assert.equal(m.safeYear('2027'),2027);for(const x of ['',null,'NaN',3000,-4,2.5])assert.equal(m.safeYear(x,2026),2026);});
test('six columns preserve canonical natal order and do not mutate the source',()=>{const before=JSON.stringify(r);assert.deepEqual(c.map(x=>x.key),['annual','decade','hour','day','month','birthYear']);assert.deepEqual(c.slice(2).map(x=>x.pillar),r.saju.pillars);assert.equal(JSON.stringify(r),before);});
test('selected decade is a real legacy result and has descending 10-year window',()=>{assert.ok(v.decade);assert.equal(v.years.length,10);assert.equal(v.years[0].year,v.decade.startYear+9);assert.equal(v.years.at(-1).year,v.decade.startYear);assert.equal(v.annual.year,2027);});
test('selecting another decade rebinds year, annual and lunar-free month views',()=>{const d=r.daeun[1],next=m.luckView(r,d.startYear);assert.equal(next.decade.startYear,d.startYear);assert.notDeepEqual(next.annual,v.annual);assert.equal(next.months[0].year,d.startYear+1);});
test('month selector contains 12 unique representative months with next-year January',()=>{assert.equal(v.months.length,12);assert.deepEqual(v.months.map(x=>x.month),[1,12,11,10,9,8,7,6,5,4,3,2]);assert.equal(v.months[0].year,2028);assert.equal(v.months[1].year,2027);assert.equal(new Set(v.months.map(x=>x.key)).size,12);assert.ok(v.months.every(x=>x.representativeDay===15));});
test('unknown time remains an unknown hour and climate is withheld',()=>{const entry={...e,birth:{...e.birth,time_status:'unknown',input_hour:null,input_minute:null}},res=m.calculateEntry(entry),view=m.luckView(res,2026),cols=m.sixColumns(entry,res,view);assert.equal(cols[2].kind,'unknown');assert.equal(m.climateView(res,view,true),null);assert.deepEqual(view.decades,[]);});
test('solar-default imported birth calculates four pillars and keeps original day source unmodified',()=>{const entry={...e,birth:{...e.birth,calendar_type:null},referenceDisplay:{day_stem_ko:'갑',day_branch_ko:'자'}},before=JSON.stringify(entry),res=m.calculateEntry(entry),view=m.luckView(res,2026),cols=m.sixColumns(entry,res,view);assert.equal(res.status,'ready');assert.equal(res.assumedSolar,true);assert.equal(cols[3].kind,'calculated');assert.equal(cols[2].kind,'calculated');assert.equal(m.glyphInfo(cols[3],'stem').known,true);assert.equal(view.months.length,12);assert.equal(JSON.stringify(entry),before);});
test('day god is 본원 and hidden stems are ordered from existing table',()=>{const labels=m.pillarLabels(c[3],r.saju.dayStem);assert.equal(labels.stem,'본원');assert.deepEqual(labels.hidden.map(h=>h.hanja),['戊','庚','丙']);assert.equal(labels.growth,old.getUnsung(r.saju.dayStem,c[3].pillar.branch));});
test('each hidden stem has its own day-stem relation and unknown inputs stay unknown',()=>{
  for(const column of c){const labels=m.pillarLabels(column,r.saju.dayStem);
    for(const h of labels.hidden)assert.equal(h.god,old.getSS(r.saju.dayStem,h.hanja));
    for(const h of m.pillarLabels(column,null).hidden)assert.equal(h.god,'—');
  }
  assert.deepEqual(m.pillarLabels({kind:'unknown'},r.saju.dayStem).hidden,[]);
});
test('column-based branch gods and growth use the column stem independently of the day stem',()=>{
  for(const column of c.filter(c=>c.kind==='calculated')){
    const labels=m.pillarLabels(column,null),p=column.pillar;
    assert.equal(labels.branchSelf,old.getSS(p.stem,old.EBH[p.branch].bon[0]));
    assert.equal(labels.growthSelf,old.getUnsung(p.stem,p.branch));
    assert.equal(labels.stem,'—');assert.equal(labels.growth,'—');
  }
});
test('all 144 twelve-shinsal pairs match the original AOT index arithmetic and chart labels',()=>{
  // Independently recovered 0x73d274..0x73d2f4 and object pool 0x11460.
  // Production uses a traditional group-start lookup, not this expression.
  const branches=[...'子丑寅卯辰巳午未申酉戌亥'];
  const originalNames=['겁살','재살','천살','지살','도화','월살','망신','장성','반안','역마','육액','화개'];
  branches.forEach((basis,i)=>branches.forEach((target,j)=>{
    assert.equal(m.chartTwelveShinsal(basis,target),originalNames[(j+3*(i&3)+7)%12],basis+target);
  }));
  for(const bad of [null,'','—','丙'])assert.equal(m.chartTwelveShinsal(bad,'子'),null);
});
test('all twelve hidden-stem sequences match the recovered original object-pool vectors',()=>{
  // Semantic input/output vectors from PP 0x11370; no original executable code.
  const rows={子:'壬癸',丑:'癸辛己',寅:'戊丙甲',卯:'甲乙',辰:'乙癸戊',巳:'戊庚丙',午:'丙己丁',未:'丁乙己',申:'戊壬庚',酉:'庚辛',戌:'辛丁戊',亥:'戊甲壬'};
  Object.entries(rows).forEach(([branch,expected],branchIdx)=>{
    const stemIdx=branchIdx%2,column={kind:'calculated',key:'fixture',pillar:{stemIdx,branchIdx,stem:['甲','乙'][stemIdx],branch}};
    assert.equal(m.pillarLabels(column,'甲').hidden.map(h=>h.hanja).join(''),expected,branch);
  });
});
test('all 120 growth pairs match the original AOT map literals',async()=>{
  const fixture=JSON.parse(await fs.readFile(root+'tests/fixtures/original-18.2.8-growth.json','utf8'));
  for(const [dayStem,row] of Object.entries(fixture.rows))for(const [branchIdx,expected] of row.entries()){
    const branch=[...fixture.branchOrder][branchIdx],stemIdx=branchIdx%2;
    const column={kind:'calculated',key:'fixture',pillar:{stemIdx,branchIdx,stem:['甲','乙'][stemIdx],branch}};
    assert.equal(m.pillarLabels(column,dayStem).growth,expected,dayStem+branch);
  }
});
test('all 100 heavenly-stem ten-god pairs match the original AOT branch return vectors',async()=>{
  const fixture=JSON.parse(await fs.readFile(root+'tests/fixtures/original-18.2.8-ten-gods.json','utf8'));
  for(const [dayStem,row] of Object.entries(fixture.rows))for(const [stemIdx,expected] of row.entries()){
    const branchIdx=stemIdx%2,stem=[...fixture.targetOrder][stemIdx];
    const column={kind:'calculated',key:'fixture',pillar:{stemIdx,branchIdx,stem,branch:['子','丑'][branchIdx]}};
    assert.equal(m.pillarLabels(column,dayStem).stem,expected,dayStem+stem);
  }
});
test('all 60 nayin pillars match the original enum lookup and widget strings',async()=>{
  const fixture=JSON.parse(await fs.readFile(root+'tests/fixtures/original-18.2.8-nayin.json','utf8'));
  for(let i=0;i<60;i++){
    const pillar={stem:[...'甲乙丙丁戊己庚辛壬癸'][i%10],branch:[...'子丑寅卯辰巳午未申酉戌亥'][i%12]};
    assert.equal(nayinOf(pillar).name,fixture.namesByPair[Math.floor(i/2)],pillar.stem+pillar.branch);
  }
});
test('relationship lines combine repeated stems but retain all endpoints',()=>{const p=(s,b)=>({stem:s,branch:b,stemIdx:old.HS.indexOf(s),branchIdx:old.EB.indexOf(b)});const cols=['丁','癸','癸'].map((s,i)=>({key:'x'+i,index:i,label:'명식'+i,kind:'calculated',pillar:p(s,'亥')}));const matches=m.relations(cols,'stem');assert.equal(matches.length,1);assert.deepEqual(matches[0].indices,[0,1,2]);assert.equal(matches[0].label,'정계충');assert.equal(m.relations(cols,'stem','hap').length,0);});
test('unknown display columns never join relation lines',()=>{const changed=c.map((x,i)=>i===2?{...x,kind:'reference'}:x);for(const rel of m.relations(changed,'branch'))assert.ok(!rel.indices.includes(2));});
test('selection exclusion leaves natal evidence intact',()=>{const cols=m.sixColumns(e,r,v,false);assert.equal(cols[0].kind,'unknown');assert.equal(cols[1].kind,'unknown');assert.deepEqual(cols.slice(2),c.slice(2));const climate=m.climateView(r,v,false);assert.equal(climate.temperature,climate.temperatureBase);assert.equal(climate.humidity,climate.humidityBase);});
test('humidity adapter numerically matches the legacy function',()=>{for(let d=1;d<=29;d++){const result=m.calculateEntry(fixture(d)),view=m.luckView(result,2028);const p=result.saju.pillars;for(const extra of [[],[view.annual],[view.decade,view.annual].filter(Boolean)])assert.equal(m.legacyHumidity([...p,...extra]),old.calcHumidity([...p,...extra]));}});
test('climate shows the existing selected-luck TCPA without new coefficients',()=>{const x=m.climateView(r,v,true),legacy=old.calcTCPA(r.saju.pillars,v.decade?.stem,v.decade?.branch,v.annual.stem,v.annual.branch);assert.equal(x.temperature,legacy.sTotal);assert.equal(x.temperatureBase,r.tcpa.sTotal);});
test('twelve-shinsal convention spans every branch and each trine shares a lookup',()=>{const groups=['申子辰','寅午戌','巳酉丑','亥卯未'];for(const group of groups){const expected=old.EB.map(b=>m.twelveShinsal(group[0],b));assert.equal(new Set(expected).size,12);for(const basis of group)assert.deepEqual(old.EB.map(b=>m.twelveShinsal(basis,b)),expected);}assert.equal(m.twelveShinsal('x','子'),null);assert.equal(m.twelveShinsal('子','x'),null);});
test('twelve-shinsal documented table spot checks across four trines',()=>{for(const [a,b,name] of [['亥','未','화개'],['亥','酉','재살'],['亥','亥','지살'],['亥','丑','월살'],['寅','亥','겁살'],['巳','寅','겁살'],['申','巳','겁살'],['子','子','장성']])assert.equal(m.twelveShinsal(a,b),name);});
test('year/day switches filter basis-dependent twelve/good hits, not pillar-specific predicates',()=>{const all=m.shinsalView(c),day=m.shinsalView(c,['day']),none=m.shinsalView(c,[]);assert.ok(all.some(x=>x.movement.length===2));assert.ok(day.every(x=>x.movement.every(v=>v.basis==='日')));assert.ok(none.every(x=>x.movement.length===0&&x.good.length===0));});
test('five legacy good/caution predicates remain identical for natal columns',()=>{for(let d=1;d<=29;d++){const entry=fixture(d),res=m.calculateEntry(entry),cols=m.sixColumns(entry,res,m.luckView(res,2026),false),cells=m.shinsalView(cols),legacy=old.calcSinsal(res.saju.pillars);for(const [key,name] of [['cheonUl','천을귀인'],['yangIn','양인'],['baekHo','백호'],['goeGang','괴강']])for(let i=0;i<4;i++){const expected=legacy[key].some(v=>v.idx===i);assert.equal([...cells[i+2].good,...cells[i+2].caution].some(v=>v.name===name),expected,`${d}/${key}/${i}`);}const pairs=legacy.wonJin;for(let i=0;i<4;i++)assert.equal(cells[i+2].caution.some(v=>v.name==='원진'),pairs.some(v=>v.ia===i||v.ib===i));}});
