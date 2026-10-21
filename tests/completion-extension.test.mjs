import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {createEmptyVault,upsertEntry,createBackup,restoreBackup,validateVault,deleteEntry} from '../src/vault/model.js';
import {savePresentation} from '../src/vault/workspace-actions.js';
import {readPresentation,DISPLAY_DEFAULTS,presentationStyle} from '../src/vault/presentation.js';
import {rememberSelection,selectionForEntry,selectedBackup,setAnalysisRules} from '../src/vault/integrated-actions.js';
import {readRules,DEFAULT_RULES} from '../src/vault/analysis-rules.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=await build({stdin:{contents:`
 export * from './src/calendar/precise.js';
 export {locationPolicy,LOCATIONS} from './src/calendar/locations.js';
 export {calculateEntry} from './src/mobile/engine.js';
 export {luckyChoice,ELEMENT_CHOICES} from './src/mobile/lucky-choice.js';
 export {classicalExteriorCandidates,EXTERIOR_RULEBOOK} from './src/mobile/classical-patterns.js';
 export {researchAnalysis,patternCandidates,monthCommand,combineContributions} from './src/mobile/research-analysis.js';
 export {compatibilityComposition} from './src/mobile/compatibility-model.js';
 export {weightedAnalysis} from './src/mobile/weighted-analysis.js';
 export {elementMonthTimeline} from './src/mobile/fortune-model.js';
 export {extraShinsal,voidBranches,SHINSAL_CATALOG} from './src/mobile/shinsal-catalog.js';
 export {nowSelection,selectionForDecade} from './src/mobile/LuckExplorer.jsx';
 export {ageBadge,filterAndSortEntries} from './src/mobile/list-utils.js';
 export {PUBLIC_PEOPLE,addPublicPerson} from './src/mobile/public-people.js';
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
 import ResearchPanel from './src/mobile/ResearchPanel.jsx';import LuckExplorer from './src/mobile/LuckExplorer.jsx';import DisplaySettings from './src/mobile/DisplaySettings.jsx';
 import CompatibilityDetails from './src/mobile/CompatibilityDetails.jsx';import ReferenceReader from './src/mobile/ReferenceReader.jsx';
 import {luckView} from './src/mobile/reader-model.js';
 import {SixPillars,LuckRails} from './src/mobile/ReaderTiles.jsx';import ReferenceVault from './src/mobile/ReferenceVault.jsx';
 export function renderExtension(name,props){return renderToStaticMarkup(React.createElement({ResearchPanel,LuckExplorer,DisplaySettings,CompatibilityDetails,ReferenceReader,RelationSection,ShinsalGrid,SixPillars,LuckRails,ReferenceVault}[name],props));}
 export {luckView};
 export {preciseLuckView} from './src/mobile/selection-model.js';
 export {relations,shinsalView,sixColumns,multiLayerClimate} from './src/mobile/reader-model.js';
 import {RelationSection,ShinsalGrid} from './src/mobile/ReaderAnalysis.jsx';
 `,resolveDir:root},bundle:true,write:false,platform:'node',format:'esm',banner:{js:`import {createRequire} from 'node:module';const require=createRequire(${JSON.stringify(root+'package.json')});`},loader:{'.css':'empty'},define:{'import.meta.env.VITE_APP_MODE':'"mobile"','import.meta.env.VITE_GEMINI_API_KEY':'""'},logLevel:'silent'});
const c=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
const B={input_year:2000,input_month:2,input_day:29,input_hour:13,input_minute:45,time_status:'known',sex:'male',calendar_type:'solar',lunar_leap_month:false,calculation_policy:{...c.DEFAULT_POLICY}};
const state=()=>upsertEntry(createEmptyVault(),{name:'합성 A',birth:B});
const copy=x=>JSON.parse(JSON.stringify(x));
test('optional presentation preserves existing v1 data and birth identity',()=>{const s=state(),before=copy(s.entries);assert.deepEqual(readPresentation(s),DISPLAY_DEFAULTS);const n=savePresentation(s,{palette:'muted',ageMode:'year',tabOrder:['compare','luck','relations','overview']});assert.deepEqual(n.entries,before);assert.equal(validateVault(n).valid,true);assert.equal(readPresentation(restoreBackup(createEmptyVault(),createBackup(n)).state).palette,'muted');});
test('display validation rejects malformed order and invalid option values atomically',()=>{const s=state();for(const patch of [{tabOrder:['overview','overview','luck','compare']},{bannerOrder:['friends']},{fontScale:100},{palette:'invalid'},{tenGods:1},{surprise:true}])assert.throws(()=>savePresentation(s,patch));assert.equal(s.workspace,undefined);});
test('local display preferences win import conflict; missing optional namespace is recovered',()=>{let a=savePresentation(state(),{palette:'contrast'});const backup=createBackup(a);a=savePresentation(a,{palette:'muted'});const restored=restoreBackup(a,backup);assert.equal(readPresentation(restored.state).palette,'muted');assert.ok(restored.stats.conflicts.some(x=>x.kind==='presentation'));let b=state();const id=b.entries[0].id;const incoming=savePresentation(b,{fontScale:1.3});assert.equal(readPresentation(restoreBackup(b,createBackup(incoming)).state).fontScale,1.3);});
test('analysis rules persist and local research convention survives older backup',()=>{let s=setAnalysisRules(state(),{combinationMode:'seasonal',matchWeights:{same:2,combine:1,clash:0,other:1}});const older=createBackup(s);s=setAnalysisRules(s,{patternMode:'revealed'});assert.equal(readRules(restoreBackup(s,older).state).patternMode,'revealed');assert.equal(readRules(restoreBackup(createEmptyVault(),createBackup(s)).state).matchWeights.same,2);for(const patch of [{combinationWeight:2},{matchWeights:{same:1}},{patternMode:'automatic'},{version:2}])assert.throws(()=>setAnalysisRules(s,patch));});
test('each record retains its own selected date across switching, full and selected backup',()=>{let s=state();s=upsertEntry(s,{name:'합성 B',birth:B});const [a,b]=s.entries;const one={entryId:a.id,date:'2024-02-29',hour:23,minute:15},two={entryId:b.id,date:'2025-03-01',hour:8,minute:30};s=rememberSelection(s,one);s=rememberSelection(s,two);assert.deepEqual(selectionForEntry(s,a.id),one);const restored=restoreBackup(createEmptyVault(),createBackup(s)).state;assert.deepEqual(selectionForEntry(restored,a.id),one);assert.deepEqual(selectionForEntry(restored,b.id),two);const selected=selectedBackup(s,[a.id]);assert.deepEqual(selected.state.workspace.integrated.selections,[one]);assert.equal(JSON.stringify(selected).includes(b.id),false);assert.equal(validateVault(selected.state).valid,true);});
test('older selection field migrates without erasing the other person selection',()=>{let s=state();s=rememberSelection(s,{entryId:s.entries[0].id,date:'2026-01-01',hour:1,minute:0});delete s.workspace.integrated.selections;s=upsertEntry(s,{name:'다른 명식',birth:B});s=rememberSelection(s,{entryId:s.entries[1].id,date:'2026-02-01',hour:2,minute:0});assert.equal(s.workspace.integrated.selections.length,2);assert.equal(selectionForEntry(s,s.entries[0].id).date,'2026-01-01');});
test('selected date validation rejects duplicate/foreign/invalid saved selections',()=>{let s=state();const selected={entryId:s.entries[0].id,date:'2026-01-01',hour:0,minute:0};s=rememberSelection(s,selected);const duplicate=copy(s);duplicate.workspace.integrated.selections.push(selected);assert.equal(validateVault(duplicate).valid,false);assert.throws(()=>rememberSelection(s,{...selected,entryId:'foreign'}));assert.throws(()=>rememberSelection(s,{...selected,date:'2026-02-30'}));});
test('city choice updates zone and longitude without resetting calculation options',()=>{const p=c.locationPolicy({...c.DEFAULT_POLICY,clock:'apparent-solar',dayBoundary:'zi23'},'newyork');assert.equal(p.zone,'America/New_York');assert.equal(p.longitude,-74.006);assert.equal(p.dayBoundary,'zi23');assert.equal(p.clock,'apparent-solar');assert.throws(()=>c.locationPolicy(p,'unknown'));});
test('New York DST gap/fold and actual UTC offsets',()=>{const p=c.locationPolicy(c.DEFAULT_POLICY,'newyork');assert.throws(()=>c.localToUtc({year:2024,month:3,day:10,hour:2,minute:30},p),/존재하지/);const d={year:2024,month:11,day:3,hour:1,minute:30};assert.throws(()=>c.localToUtc(d,p),/두 번/);assert.equal(c.localToUtc(d,{...p,fold:'later'}).instant-c.localToUtc(d,{...p,fold:'earlier'}).instant,3600000);assert.equal(c.zoneAt(Date.parse('2024-07-01T12:00:00Z'),p).offsetSeconds,-4*3600);assert.equal(c.zoneAt(Date.parse('2024-01-01T12:00:00Z'),p).offsetSeconds,-5*3600);});
test('Sydney southern hemisphere summer/winter and historical London',()=>{const p=c.locationPolicy(c.DEFAULT_POLICY,'sydney');assert.equal(c.zoneAt(Date.parse('2024-01-15T12:00:00Z'),p).dstSeconds,3600);assert.equal(c.zoneAt(Date.parse('2024-07-15T12:00:00Z'),p).dstSeconds,0);const london=c.locationPolicy(c.DEFAULT_POLICY,'london');assert.equal(c.localToUtc({year:1912,month:6,day:23,hour:12,minute:0},london).instant,Date.parse('1912-06-23T12:00Z'));});
test('split late Zi keeps day pillar and uses next day hour stem',()=>{const s={year:2000,month:2,day:29,hour:23,minute:15},mid=c.precisePillars(s,c.DEFAULT_POLICY),split=c.precisePillars(s,{...c.DEFAULT_POLICY,dayBoundary:'zi-split'}),next=c.precisePillars(s,{...c.DEFAULT_POLICY,dayBoundary:'zi23'});assert.deepEqual(split.pillars[1],mid.pillars[1]);assert.deepEqual(split.pillars[0],next.pillars[0]);assert.notEqual(mid.pillars[0].stem,split.pillars[0].stem);});
test('calendar-based decade addition clamps leap day and returns ten chronological starts',()=>{const d=Date.parse('2000-02-29T00:00Z');assert.equal(new Date(c.calendarDaeunStart(d,1)).toISOString(),'2001-02-28T00:00:00.000Z');const result=c.calculateEntry({name:'기산',birth:{...B,sex:null,calculation_policy:{...c.DEFAULT_POLICY,daeunDirection:'forward',daeunMethod:'calendar'}}});assert.equal(result.daeun.length,10);assert.ok(result.daeun.every((d,i)=>!i||d.startInstant>result.daeun[i-1].startInstant));assert.match(result.daeun[0].basis,/UTC 달력/);assert.ok(result.daeun[0].gapDays>0);});
test('now selection uses chosen location or fixed UTC offset',()=>{const now=new Date('2026-10-20T20:15Z');assert.deepEqual(c.nowSelection(c.DEFAULT_POLICY,now),{date:'2026-10-21',hour:5,minute:15});assert.deepEqual(c.nowSelection({...c.DEFAULT_POLICY,zone:'fixed',offsetMinutes:-300},now),{date:'2026-10-20',hour:15,minute:15});assert.equal(c.nowSelection(c.locationPolicy(c.DEFAULT_POLICY,'newyork'),now).hour,16);});
test('age conventions use known birthdays and lunar conversion; unknown time never invented',()=>{const entry={birth:B},date=new Date(2026,0,1);assert.equal(c.ageBadge(entry,date,'full').text,'25');assert.equal(c.ageBadge(entry,date,'year').text,'26');assert.equal(c.ageBadge(entry,date,'counting').text,'27');const lunar={birth:{...B,input_year:2023,input_month:2,input_day:1,calendar_type:'lunar',lunar_leap_month:true}};assert.equal(c.ageBadge(lunar,new Date(2024,2,21),'full').text,'0');assert.equal(c.ageBadge(lunar,new Date(2024,2,22),'full').text,'1');});
test('compound filters respect sex unknown, age range and favorites',()=>{let s=state();s=upsertEntry(s,{name:'합성 B',birth:{...B,sex:null}});s=upsertEntry(s,{name:'합성 C',birth:{...B,sex:'female'},favorite:true});assert.deepEqual(c.filterAndSortEntries(s.entries,{sex:'female',favoriteOnly:true,minAge:20,maxAge:30}).map(e=>e.name),['합성 C']);assert.deepEqual(c.filterAndSortEntries(s.entries,{sex:'unknown'}).map(e=>e.name),['합성 B']);});
test('declared month-main and revealed pattern rules choose different hidden stems',()=>{const p=[c.pillar(0,0),c.pillar(0,2),c.pillar(2,2),c.pillar(4,4)],result={saju:{pillars:p}};assert.equal(c.patternCandidates(result).inner.stem,'甲');assert.equal(c.patternCandidates(result,{...DEFAULT_RULES,patternMode:'revealed'}).inner.stem,'丙');assert.equal(c.monthCommand(result).current,null);});
test('month command uses elapsed days and holds final allocation after 30 days',()=>{const p=[c.pillar(0,0),c.pillar(0,2),c.pillar(2,2),c.pillar(4,4)];const f=days=>c.monthCommand({saju:{pillars:p,clock:{instant:days*86400000},lastJie:{instant:0}}}).current;assert.equal(f(0),'戊');assert.equal(f(7),'丙');assert.equal(f(14),'甲');assert.equal(f(31),'甲');});
test('seasonal stem combination conserves total weight, excludes competition and nonadjacency',()=>{const p=[c.pillar(4,4),c.pillar(9,1),c.pillar(0,2),c.pillar(6,8)],w=c.weightedAnalysis(p);const active=c.combineContributions(p,w,{...DEFAULT_RULES,combinationMode:'seasonal'});assert.ok(active.combinations.some(x=>x.active));assert.ok(Math.abs(Object.values(active.scores).reduce((a,b)=>a+b,0)-w.total)<1e-10);const crowded=[...p,c.pillar(4,6)];assert.equal(c.combineContributions(crowded,c.weightedAnalysis(crowded),{...DEFAULT_RULES,combinationMode:'seasonal'}).combinations.some(x=>x.active),false);});
test('research analysis partial and zero-weight states are explicit',()=>{const r=c.calculateEntry({name:'분석',birth:B}),a=c.researchAnalysis(r);assert.equal(a.status,'ready');assert.equal(a.methods.length,5);assert.equal(a.roles.length,5);const zero={enabled:true,stems:[0,0,0,0],branches:[0,0,0,0],hidden:[0,0,0],luck:[0,0,0,0,0]};assert.equal(c.researchAnalysis(r,[],zero).status,'unavailable');const partial=c.calculateEntry({name:'부분',birth:{...B,time_status:'unknown',input_hour:null,input_minute:null}});assert.equal(c.researchAnalysis(partial).partial,true);});
test('monthly element series contains real normalised changing distributions',()=>{const r=c.calculateEntry({name:'시계열',birth:B}),series=c.elementMonthTimeline(r,2026,B.calculation_policy);assert.equal(series.length,12);assert.ok(series.every(x=>Math.abs(Object.values(x.ratios).reduce((a,b)=>a+b,0)-1)<1e-10));assert.notDeepEqual(series[0].ratios,series[6].ratios);assert.deepEqual(c.elementMonthTimeline(r,2051),[]);});
test('compatibility similarity has meaningful 100/0 endpoints and no implicit birth hour',()=>{const a={saju:{pillars:[c.pillar(0,0),c.pillar(2,2),c.pillar(4,4),c.pillar(6,6)]}},b={saju:{pillars:[c.pillar(1,1),c.pillar(3,3),c.pillar(5,5),c.pillar(7,7)]}};assert.equal(c.compatibilityComposition(a,a).structuralSimilarity,100);assert.equal(c.compatibilityComposition(a,b).structuralSimilarity,0);const p=copy(a);p.saju.pillars[0]={unknown:true};assert.equal(c.compatibilityComposition(a,p).glyphs,6);const z=c.compatibilityComposition(a,b,{same:0,combine:0,clash:0,other:0});assert.ok(Object.values(z.composition).every(x=>x===null));assert.equal(c.compatibilityComposition({},a).status,'unavailable');});
test('published Wenchang table all ten stems and classic Hongyan variants',()=>{const stems=[...'甲乙丙丁戊己庚辛壬癸'],targets=[...'巳午申酉申酉亥子寅卯'];stems.forEach((s,i)=>assert.ok(c.extraShinsal({stem:'甲',branch:targets[i]},{dayStem:s,basis:'day'}).some(x=>x.name==='문창귀인')));assert.ok(c.extraShinsal({stem:'甲',branch:'子'},{dayStem:'戊',basis:'day'}).some(x=>x.name==='홍염(삼명통회)'));});
test('public bios have provenance and keep unverified hour/sex unknown across backup',()=>{let s=createEmptyVault();for(const person of c.PUBLIC_PEOPLE)s=c.addPublicPerson(s,person.id);assert.equal(s.entries.length,3);const e=s.entries[0],same=c.addPublicPerson(s,c.PUBLIC_PEOPLE[0].id);assert.equal(same,s);assert.ok(s.entries.every(e=>e.birth.time_status==='unknown'&&e.birth.input_hour===null&&e.birth.sex===null&&e.birth.public_profile.url.startsWith('https:')));assert.equal(validateVault(restoreBackup(createEmptyVault(),createBackup(s)).state).valid,true);assert.throws(()=>c.addPublicPerson(deleteEntry(s,e.id),e.birth.public_profile.id),/휴지통/);});
test('real React extension surfaces render nonblank escaped content without runtime exceptions',()=>{const vault=state(),entry=vault.entries[0],result=c.calculateEntry(entry),weights={enabled:false,stems:[.6,.6,1.2,.6],branches:[.6,1.2,3,.6],hidden:[1,1,1],luck:[1,1,1,1,1]},selection={entryId:entry.id,date:'2026-10-20',hour:12,minute:0},view=c.luckView(result,2026),change=()=>{},navigate=()=>{};for(const [name,props,expected] of [['DisplaySettings',{vault,change},'명식 표시와 디자인'],['ResearchPanel',{vault,result,luck:[],weights,change},'용신 5개 방법'],['LuckExplorer',{vault,result,selection,view,weights,onSelect:()=>{}},'운세 트리'],['CompatibilityDetails',{left:result,right:result,vault,change},'100.0'],['ReferenceReader',{vault,entry,change,navigate},'현재 운 바로가기']]){const html=c.renderExtension(name,props);assert.ok(html.includes(expected),name);assert.ok(html.length>500);}});

test('historical London all-year DST is not mistaken for standard time',()=>{const policy=c.locationPolicy(c.DEFAULT_POLICY,'london');const winter=c.zoneAt(Date.parse('1941-01-15T12:00:00Z'),policy),summer=c.zoneAt(Date.parse('1941-07-15T12:00:00Z'),policy);assert.equal(winter.dstSeconds,3600);assert.equal(summer.dstSeconds,7200);const clock=c.correctedClock({year:1941,month:7,day:15,hour:12,minute:0},policy);assert.equal(clock.hour,10);assert.equal(clock.audit.tzdb,'2026b');});
test('nine-column relations and shinsal retain separate natal/luck indices',()=>{const s=state(),entry=s.entries[0],r=c.calculateEntry(entry),v=c.luckView(r,2026),cols=[...c.sixColumns(entry,r,v),...['selectedMonth','selectedDay','selectedHour'].map((key,i)=>({key,label:['월운','일운','시운'][i],index:6+i,pillar:c.pillar(i*2,i*2),kind:'calculated'}))];assert.equal(c.shinsalView(cols).length,9);assert.ok(c.relations(cols,'branch').every(x=>x.indices.every(i=>i>=0&&i<9)));for(const name of ['RelationSection','ShinsalGrid'])assert.ok(c.renderExtension(name,{columns:cols,part:'branch',dayStem:r.saju.dayStem,onInfo:()=>{}}).includes('시운'));});
test('custom colors, font and optional older presentations are validated and backed up',()=>{let s=savePresentation(state(),{palette:'custom',fontFamily:'serif',elementColors:{wood:'#000000',fire:'#FFFFFF',earth:'#abcdef',metal:'#123456',water:'#555555'}});assert.equal(readPresentation(restoreBackup(createEmptyVault(),createBackup(s)).state).fontFamily,'serif');assert.throws(()=>savePresentation(s,{elementColors:{wood:'url(x)'}}));assert.throws(()=>savePresentation(s,{fontFamily:'unsafe'}));const older=copy(s);delete older.workspace.presentation.fontFamily;delete older.workspace.presentation.elementColors;assert.equal(validateVault(older).valid,true);assert.equal(readPresentation(older).fontFamily,'system');});

test('every optional chart row can be hidden without removing the two glyph rows',()=>{const s=state(),e=s.entries[0],r=c.calculateEntry(e),v=c.luckView(r,2026),cols=c.sixColumns(e,r,v),props={columns:cols,dayStem:r.saju.dayStem};const shown=c.renderExtension('SixPillars',props),off=c.renderExtension('SixPillars',{...props,display:{...DISPLAY_DEFAULTS,tenGods:false,hidden:false,growth:false,nayin:false}});for(const token of ['rr-gods','rr-hidden','rr-growth','rr-nayin']){assert.ok(shown.includes(token));assert.ok(!off.includes(token));}assert.ok(off.includes('rr-rune'));});
test('tab-independent banner permutation changes the actual rendered section order',()=>{let s=state();s=upsertEntry(s,{name:'즐겨찾기 합성',birth:B,favorite:true});s.selfId=s.entries[0].id;s=savePresentation(s,{bannerOrder:['friends','favorites','me']});const html=c.renderExtension('ReferenceVault',{vault:s,change:()=>{},navigate:()=>{},open:()=>{},favorite:()=>{},onExit:()=>{}});assert.ok(html.indexOf('section-friends')<html.indexOf('section-favorites'));assert.ok(html.indexOf('section-favorites')<html.indexOf('section-me'));});
test('custom tone foregrounds follow measured relative luminance endpoints',()=>{const p={...DISPLAY_DEFAULTS,elementColors:{wood:'#000000',fire:'#ffffff',earth:'#ffff00',metal:'#101010',water:'#eeeeee'}},style=presentationStyle(p);assert.equal(style['--custom-wood-text'],'#ffffff');assert.equal(style['--custom-fire-text'],'#111111');assert.equal(style['--custom-earth-text'],'#111111');assert.equal(style['--custom-metal-text'],'#ffffff');});

test('decade choice selects a real start in local time and rounds forward to the next minute',()=>{const policy=c.locationPolicy(c.DEFAULT_POLICY,'newyork'),instant=Date.parse('2024-06-01T03:59:45Z');assert.deepEqual(c.selectionForDecade({startInstant:instant},policy),{date:'2024-06-01',hour:0,minute:0});assert.deepEqual(c.selectionForDecade({startYear:2020},policy),{date:'2020-07-01',hour:12,minute:0});assert.throws(()=>c.selectionForDecade({startYear:null},policy));});
test('calendar-based decade boundaries use next actual start without an approximate gap',()=>{const a={startInstant:Date.parse('2020-01-01T00:00Z')},b={startInstant:Date.parse('2029-12-31T00:00Z')},base={decades:[b,a],years:[],months:[],year:2029},result={origin:'astronomical'};assert.equal(c.preciseLuckView(base,result,{instant:b.startInstant-1},c.DEFAULT_POLICY).decade,a);assert.equal(c.preciseLuckView(base,result,{instant:b.startInstant},c.DEFAULT_POLICY).decade,b);});

const classicalFixture=values=>values.map(([s,b])=>c.pillar([...'甲乙丙丁戊己庚辛壬癸'].indexOf(s),[...'子丑寅卯辰巳午未申酉戌亥'].indexOf(b)));
for(const [name,values] of [
 ['곡직격 후보',[['癸','亥'],['甲','寅'],['乙','卯'],['乙','未']]],
 ['염상격 후보',[['乙','亥'],['丙','午'],['甲','寅'],['丙','戌']]],
 ['종혁격 후보',[['癸','巳'],['辛','酉'],['己','丑'],['辛','亥']]],
 ['윤하격 후보',[['庚','申'],['壬','子'],['壬','辰'],['癸','亥']]],
 ['가색격 후보',[['己','丑'],['戊','辰'],['己','未'],['甲','戌']]],
])test('classical source core conditions: '+name,()=>{const p=classicalFixture(values);assert.ok(c.classicalExteriorCandidates(p).some(x=>x.name===name&&x.source.includes('卷六')));assert.deepEqual(c.classicalExteriorCandidates([{unknown:true},...p.slice(1)]),[]);});
test('classical candidate exclusions are applied without percentage-score substitutes',()=>{const wood=classicalFixture([['辛','亥'],['甲','寅'],['乙','卯'],['乙','未']]);assert.equal(c.classicalExteriorCandidates(wood).some(x=>x.name==='곡직격 후보'),false);const fire=classicalFixture([['乙','亥'],['丙','午'],['甲','寅'],['戊','戌']]);assert.equal(c.classicalExteriorCandidates(fire).some(x=>x.name==='염상격 후보'),false);const metal=classicalFixture([['丁','巳'],['辛','酉'],['己','丑'],['丁','亥']]);assert.equal(c.classicalExteriorCandidates(metal).some(x=>x.name==='종혁격 후보'),false);const water=classicalFixture([['庚','申'],['壬','子'],['壬','辰'],['戊','戌']]);assert.equal(c.classicalExteriorCandidates(water).some(x=>x.name==='윤하격 후보'),false);const earth=classicalFixture([['己','丑'],['戊','辰'],['己','未'],['丙','戌']]);assert.equal(c.classicalExteriorCandidates(earth).some(x=>x.name==='가색격 후보'),false);});

test('five-layer climate preserves natal baseline, exact individual original slots and user weight',()=>{const r=c.calculateEntry({name:'기후',birth:B}),p=c.pillar(2,6),base=c.multiLayerClimate(r,[]),d=c.multiLayerClimate(r,[p]),year=c.multiLayerClimate(r,[null,p]),all=c.multiLayerClimate(r,[p,p,p,p,p]);assert.equal(base.temperature,base.temperatureBase);assert.equal(base.humidity,base.humidityBase);assert.equal(all.rows.length,5);assert.ok(Math.abs(all.temperature-(base.temperature+d.rows[0].temperature+year.rows[1].temperature*4))<.011);const weight={luck:[0,0,0,0,0]};assert.equal(c.multiLayerClimate(r,[p,p,p,p,p],weight).temperature,base.temperature);assert.equal(c.multiLayerClimate({...r,status:'partial'},[p]),null);assert.throws(()=>c.multiLayerClimate(r,[p],{luck:[NaN]}));});

test('choice lookup uses published fixed Hetu pairs for all elements and an explicit method',()=>{for(const [element,numbers] of [['水',[1,6]],['火',[2,7]],['木',[3,8]],['金',[4,9]],['土',[5,10]]]){const a={status:'ready',methods:[{name:'用',element},{name:'억부',element,reason:'고정 합성 근거'}]},r=c.luckyChoice(a,'억부');assert.deepEqual(r.numbers,numbers);assert.equal(r.element,element);assert.equal(r.reason,'고정 합성 근거');assert.ok(r.source.includes('卷09'));}assert.equal(c.luckyChoice({status:'ready',methods:[{name:'억부',element:null}]}).status,'unavailable');assert.throws(()=>c.luckyChoice({},'random'));});
test('lucky method choice is validated and survives backup without requiring older rules to contain it',()=>{let s=setAnalysisRules(state(),{luckyMethod:'용격'});assert.equal(readRules(restoreBackup(createEmptyVault(),createBackup(s)).state).luckyMethod,'용격');assert.throws(()=>setAnalysisRules(s,{luckyMethod:'random'}));const old=copy(s);delete old.workspace.integrated.rules.luckyMethod;assert.equal(validateVault(old).valid,true);assert.equal(readRules(old).luckyMethod,'억부');});

test('body/use/month command and five independent methods expose explicit calculated fields',()=>{const r=c.calculateEntry({name:'체용',birth:B}),a=c.researchAnalysis(r);assert.equal(a.status,'ready');assert.equal(a.cheYong.body,r.saju.dayStem);assert.equal(a.cheYong.monthCommand,a.pattern.command.main);assert.ok(a.cheYong.current);assert.ok(Object.hasOwn(a.cheYong,'use'));assert.ok(Array.isArray(a.cheYong.trueStems)&&Array.isArray(a.cheYong.falseStems));assert.deepEqual(a.methods.map(m=>m.name),['억부','조후','통관','병약','용격']);assert.ok(a.methods.every(m=>m.reason.length>5));assert.ok(a.roles.every(x=>['용','희','기','구','한','판정 보류'].includes(x.role)));const selected=c.researchAnalysis(r,[c.pillar(0,2),c.pillar(0,2),c.pillar(0,2),c.pillar(0,2),c.pillar(0,2)]);assert.notDeepEqual(selected.scores,a.scores);assert.ok(selected.methods.find(m=>m.name==='통관').reason.includes('5계층')||selected.methods.find(m=>m.name==='통관').reason.includes('20%'));});


test('30-minute hour boundaries cover Zi, Chou, Wu and Hai without shifting midnight day',()=>{
 const policy={...c.DEFAULT_POLICY,zone:'fixed',offsetMinutes:0,hourBoundaryOffset:30};
 for(const [hour,minute,branch] of [[23,29,'亥'],[23,30,'子'],[0,0,'子'],[0,30,'子'],[1,29,'子'],[1,30,'丑'],[11,29,'巳'],[11,30,'午'],[21,29,'戌'],[21,30,'亥']])assert.equal(c.precisePillars({year:2000,month:2,day:29,hour,minute},policy).pillars[0].branch,branch);
 const before={year:2000,month:2,day:29,hour:23,minute:29},after={...before,minute:30};
 for(const mode of ['midnight','zi23','zi-split']){
  const p={...policy,dayBoundary:mode},a=c.precisePillars(before,p),b=c.precisePillars(after,p);
  assert.equal(b.pillars[1].stem===a.pillars[1].stem,mode!=='zi23');
  if(mode==='zi-split')assert.equal(b.pillars[0].stem,c.precisePillars(after,{...p,dayBoundary:'zi23'}).pillars[0].stem);
 }
});
test('hour offset is applied after solar and DST correction and survives full backup',()=>{
 const b={...B,calculation_policy:{...c.DEFAULT_POLICY,hourBoundaryOffset:30,dayBoundary:'zi-split'}};
 let s=upsertEntry(createEmptyVault(),{name:'경계',birth:b});
 assert.deepEqual(restoreBackup(createEmptyVault(),createBackup(s)).state.entries[0].birth.calculation_policy,b.calculation_policy);
 for(const value of [-30,15,60,'30',null])assert.throws(()=>upsertEntry(s,{id:s.entries[0].id,birth:{...b,calculation_policy:{...b.calculation_policy,hourBoundaryOffset:value}}}));
 const base={year:2000,month:2,day:29,hour:23,minute:40};
 const p={...c.DEFAULT_POLICY,zone:'fixed',offsetMinutes:540,clock:'mean-solar',longitude:127.5,hourBoundaryOffset:30};
 const r=c.precisePillars(base,p);assert.equal(r.clock.hour,23);assert.equal(r.clock.minute,10);assert.equal(r.pillars[0].branch,'亥');
 const summer=c.precisePillars({year:1988,month:7,day:1,hour:0,minute:40},{...c.DEFAULT_POLICY,hourBoundaryOffset:30});assert.equal(summer.clock.hour,23);assert.equal(summer.pillars[0].branch,'子');
});
for(const [name,values] of [
 ['일귀 구조',[['壬','寅'],['丁','酉'],['庚','申'],['甲','子']]],
 ['일덕 구조',[['壬','子'],['甲','寅'],['庚','申'],['丙','午']]],
 ['괴강 중첩 구조',[['壬','辰'],['庚','辰'],['庚','申'],['甲','子']]],
 ['녹원호환 구조',[['乙','卯'],['戊','申'],['庚','申'],['甲','子']]],
 ['자오쌍포 구조',[['壬','午'],['戊','子'],['庚','午'],['甲','子']]],
])test('additional classical structure positive and day/hour mutation: '+name,()=>{
 const p=classicalFixture(values);assert.ok(c.classicalExteriorCandidates(p).some(x=>x.name===name));
 const mutated=classicalFixture([['乙','丑'],['乙','丑'],['乙','丑'],['乙','丑']]);assert.ok(!c.classicalExteriorCandidates(mutated).some(x=>x.name===name));
});
test('pattern overlap preserves month priority and does not erase either structural candidate',()=>{
 const p=classicalFixture([['壬','辰'],['庚','辰'],['甲','寅'],['甲','子']]),r=c.patternCandidates({saju:{pillars:p}});
 assert.equal(r.inner.god,'편재');assert.ok(r.external.some(x=>x.name==='일덕 구조'));assert.ok(r.external.some(x=>x.name==='괴강 중첩 구조'));
 assert.equal(c.EXTERIOR_RULEBOOK.names.length,10);assert.ok(r.rulebook.priority.includes('덮어쓰지'));
});
test('six decades of void branches agree with published JiaZi reference and reject invalid parity',()=>{
 for(const [pair,expected] of [['甲子','戌亥'],['甲戌','申酉'],['甲申','午未'],['甲午','辰巳'],['甲辰','寅卯'],['甲寅','子丑']]){
  const start=[...'子丑寅卯辰巳午未申酉戌亥'].indexOf(pair[1]);
  for(let i=0;i<10;i++)assert.equal(c.voidBranches(c.pillar(i,start+i)).join(''),expected);
 }
 assert.deepEqual(c.voidBranches({stem:'甲',branch:'丑'}),[]);
});
test('new star catalogue has 38 unique names and all ten stems have published Lu targets',()=>{
 assert.equal(c.SHINSAL_CATALOG.names.length,38);assert.equal(new Set(c.SHINSAL_CATALOG.names).size,38);
 for(const [i,target] of [...'寅卯巳午巳午申酉亥子'].entries()){
  const stars=c.extraShinsal({stem:'甲',branch:target},{dayStem:[...'甲乙丙丁戊己庚辛壬癸'][i],basis:'day'});
  assert.ok(stars.some(x=>x.name==='건록'&&x.basis==='日'));
 }
});
test('monthly virtue combinations, pair-only nets and day-only defeat expose fixed bases',()=>{
 const get=(stem,branch,context)=>c.extraShinsal({stem,branch},context).map(x=>x.name);
 assert.ok(get('壬','子',{monthBranch:'寅'}).includes('천덕합'));
 assert.ok(get('辛','子',{monthBranch:'寅'}).includes('월덕합'));
 assert.ok(get('甲','戌',{natalBranches:['亥']}).includes('천라(지지쌍)'));
 assert.ok(get('乙','巳',{natalBranches:['辰']}).includes('지망(지지쌍)'));
 for(const pair of ['甲辰','乙巳','丙申','丁亥','戊戌','己丑','庚辰','辛巳','壬申','癸亥']){
  assert.ok(get(...pair,{isNatalDay:true}).includes('십악대패(일주)'));
  assert.ok(!get(...pair,{isNatalDay:false}).includes('십악대패(일주)'));
 }
 assert.deepEqual(c.extraShinsal({stem:'甲',branch:'辰'},{isNatalDay:true,basis:'none'}),[]);
});
test('disabling sinsal removes legacy fixed stars as well as basis-dependent stars',()=>{
 const p=classicalFixture([['甲','辰'],['庚','辰'],['戊','戌'],['壬','辰']]);
 const columns=p.map((pillar,index)=>({key:['hour','day','month','birthYear'][index],index,pillar,kind:'calculated'}));
 assert.ok(c.shinsalView(columns).some(r=>r.caution.length));
 assert.ok(c.shinsalView(columns,[]).every(r=>!r.movement.length&&!r.good.length&&!r.caution.length));
});

test('declared stem star reference tables check both hits and misses for every stem and branch',()=>{
 const reference=[['문창귀인','巳 午 申 酉 申 酉 亥 子 寅 卯'],['금여','辰 巳 未 申 未 申 戌 亥 丑 寅'],['국인귀인','戌 亥 丑 寅 丑 寅 辰 巳 未 申'],['태극귀인','子午 子午 卯酉 卯酉 辰戌丑未 辰戌丑未 寅亥 寅亥 巳申 巳申'],['홍염(삼명통회)','午 午 寅 未 子 辰 戌 酉 巳 申'],['유하','酉 戌 未 申 巳 午 辰 卯 亥 寅']];
 for(const [name,row] of reference)for(const [i,targets] of row.split(' ').entries())for(const branch of [...'子丑寅卯辰巳午未申酉戌亥']){
  const context={dayStem:[...'甲乙丙丁戊己庚辛壬癸'][i],basis:'day'},found=c.extraShinsal({stem:'甲',branch},context).some(x=>x.name===name);
  assert.equal(found,targets.includes(branch),name+' stem '+i+' branch '+branch);
  assert.equal(c.extraShinsal({stem:'甲',branch},{...context,basis:'year'}).some(x=>x.name===name),false);
 }
});
test('month and year fixed reference stars cover all twelve branches',()=>{
 const branches=[...'子丑寅卯辰巳午未申酉戌亥'];
 const virtues=[...'巳庚丁申壬辛亥甲癸寅丙乙'],lonely=[...'寅寅巳巳巳申申申亥亥亥寅'],widow=[...'戌戌丑丑丑辰辰辰未未未戌'];
 for(let i=0;i<12;i++){
  const target=virtues[i],p={stem:[...'甲乙丙丁戊己庚辛壬癸'].includes(target)?target:'甲',branch:branches.includes(target)?target:'子'};
  assert.ok(c.extraShinsal(p,{monthBranch:branches[i]}).some(x=>x.name==='천덕귀인'));
  assert.ok(c.extraShinsal({stem:'甲',branch:lonely[i]},{yearBranch:branches[i]}).some(x=>x.name==='고신'));
  assert.ok(c.extraShinsal({stem:'甲',branch:widow[i]},{yearBranch:branches[i]}).some(x=>x.name==='과숙'));
 }
});
