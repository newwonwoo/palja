/** Display adapter for the existing calculator. No writes to the vault and no new calendar engine.
 * Relation/hidden-stem rules below are the existing App.jsx lookup rules, not recovered 8ja rules.
 * Unsupported original controls are not substituted with fabricated scores.
 */
import { getYP, getMP, calcTCPA, HS, EB, HS_EL, EBH, getSS, getUnsung } from '../App.jsx';
import { STEM_KO, BRANCH_KO } from './engine.js';
import { chartSlots } from './detail-view-model.js';
import { branchPairTypes } from './traditional-reference.js';

export const TONES = Object.freeze({ 木:'wood', 火:'fire', 土:'earth', 金:'metal', 水:'water' });
export const ELEMENT_NAMES = Object.freeze({ 木:'목', 火:'화', 土:'토', 金:'금', 水:'수' });
export const validPillar = p => Boolean(p && !p.unknown && Number.isInteger(p.stemIdx) && Number.isInteger(p.branchIdx)
  && HS[p.stemIdx] === p.stem && EB[p.branchIdx] === p.branch);
const mod = (n,m) => ((n % m) + m) % m;
export function safeYear(year, fallback = new Date().getFullYear()) {
  const n = Number(year);
  return Number.isInteger(n) && n >= 1900 && n <= 2200 ? n : Math.min(2200,Math.max(1900,fallback));
}
export function luckView(result, selectedYear) {
  const year = safeYear(selectedYear);
  const ready = result?.saju && validPillar(result.saju.pillars?.[1]);
  const decades = (result?.daeun || []).filter(d => validPillar(d) && (Number.isInteger(d.startYear)||d.manualBasis===true));
  const decade = decades.find(d => Number.isInteger(d.startYear) && year >= d.startYear && year < d.startYear+10) || null;
  const start = decade?.startYear ?? Math.floor(year/10)*10;
  const years = Array.from({length:10},(_,i) => start+9-i).filter(y=>y>=1900&&y<=2200)
    .map(y => ({...getYP(y,7,1), year:y}));
  // A representative mid-month date, NOT an exact solar-term entry time.
  const months = Array.from({length:12},(_,i) => { const month=i===0?1:13-i, y=month===1?year+1:year;
    return { ...getMP(y,month,15), year:y, month, representativeDay:15, key:`${y}-${month}` }; });
  return { year, years, months:ready?months:[], decades:[...decades].reverse(), decade,
    annual:ready?{...getYP(year,7,1), year}:null, birthYear: result?.saju?.solar?.year ?? null };
}
export function sixColumns(entry, result, view, includeLuck = true) {
  const natal = chartSlots(entry,result).map(slot => ({...slot,label:`${slot.label==='년'?'연':slot.label}주`,index:slot.index+2,
    key:['hour','day','month','birthYear'][slot.index]}));
  const make = (label,key,index,pillar) => ({label,key,index,pillar,kind:includeLuck&&validPillar(pillar)?'calculated':'unknown'});
  return [make('세운','annual',0,view.annual),make('대운','decade',1,view.decade),...natal];
}
export function glyphInfo(column, part) {
  if (column.kind==='calculated' && validPillar(column.pillar)) {
    const p=column.pillar;
    return {hanja:part==='stem'?p.stem:p.branch,ko:part==='stem'?STEM_KO[p.stemIdx]:BRANCH_KO[p.branchIdx],known:true};
  }
  if (column.kind==='reference') return {hanja:null,ko:column[part]||'—',known:false,reference:true};
  return {hanja:null,ko:'—',known:false};
}
export function pillarLabels(column, dayStem) {
  const p=column.pillar;
  if(column.kind!=='calculated'||!validPillar(p))return{stem:'—',branch:'—',growth:'—',hidden:[]};
  const hasDay=HS.includes(dayStem);
  return {stem:hasDay?(column.key==='day'?'본원':getSS(dayStem,p.stem)):'—',
    branchSelf:getSS(p.stem,EBH[p.branch]?.bon?.[0]),growthSelf:getUnsung(p.stem,p.branch),
    branch:hasDay?getSS(dayStem,EBH[p.branch]?.bon?.[0]):'—',growth:hasDay?getUnsung(dayStem,p.branch):'—',
    hidden:['yo','jung','bon'].map(k=>EBH[p.branch]?.[k]?.[0]).filter(Boolean).map(h=>({hanja:h,ko:STEM_KO[HS.indexOf(h)],tone:TONES[HS_EL[HS.indexOf(h)]],god:hasDay?getSS(dayStem,h):'—'}))};
}
const HAP_STEM={甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊'};
const CHUNG_STEM={甲:'庚',庚:'甲',乙:'辛',辛:'乙',丙:'壬',壬:'丙',丁:'癸',癸:'丁'};
const HAP_BRANCH={子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};
const CHUNG_BRANCH={子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
const GROUPS=[['삼합','寅午戌'],['삼합','申子辰'],['삼합','巳酉丑'],['삼합','亥卯未'],
  ['방합','寅卯辰'],['방합','巳午未'],['방합','申酉戌'],['방합','亥子丑'],['삼형','寅巳申'],['삼형','丑戌未']];
export function relations(columns, part, filter='all') {
  const known=columns.filter(c=>c.kind==='calculated'&&validPillar(c.pillar));
  const out=[];
  const add=(type,nodes,hanja)=>{
    if(filter==='hap' && !['합','육합','삼합','방합','반합'].includes(type))return;
    if(filter==='clash' && !['충','삼형','형','자형','파','해','원진'].includes(type))return;
    const ordered=nodes.length===2?[...hanja].sort((a,b)=>(part==='stem'?HS:EB).indexOf(a)-(part==='stem'?HS:EB).indexOf(b)).join(''):hanja;
    const chars=[...ordered].map(h=>part==='stem'?STEM_KO[HS.indexOf(h)]:BRANCH_KO[EB.indexOf(h)]).join('');
    out.push({id:`${part}-${type}-${nodes.map(n=>n.index).join('-')}`,type,indices:nodes.map(n=>n.index),
      label:chars+(type==='육합'?'합':type),
      detail:`${nodes.map(n=>`${n.label} ${n.pillar[part]}`).join(' · ')}: 기존 관계표의 ${type} 조합입니다. 위치·월령에 따른 성립 강도나 사건을 확정하지 않습니다.`});
  };
  for(let i=0;i<known.length;i++)for(let j=i+1;j<known.length;j++){
    const a=known[i].pillar[part],b=known[j].pillar[part];
    if((part==='stem'?HAP_STEM:HAP_BRANCH)[a]===b)add(part==='stem'?'합':'육합',[known[i],known[j]],a+b);
    if((part==='stem'?CHUNG_STEM:CHUNG_BRANCH)[a]===b)add('충',[known[i],known[j]],a+b);
    if(part==='branch')for(const type of branchPairTypes(a,b))add(type,[known[i],known[j]],a+b);
  }
  if(part==='branch')for(const b of ['辰','午','酉','亥']){
    const repeated=known.filter(n=>n.pillar.branch===b);
    if(repeated.length>=2)add('자형',repeated,b+b);
  }
  if(part==='branch')for(const [type,chars] of GROUPS){
    const present=[...chars].filter(b=>known.some(n=>n.pillar.branch===b));
    if(present.length===3 || (type!=='삼형'&&present.length===2&&present.some(b=>'子午卯酉'.includes(b)))) {
      add(present.length===3?type:'반합',known.filter(n=>present.includes(n.pillar.branch)),present.join(''));
    }
  }
  // Same relation to repeated natal characters is one line with multiple endpoints.
  const merged=new Map();
  for(const item of out){const key=item.type+':'+item.label;const previous=merged.get(key);
    if(!previous)merged.set(key,{...item});
    else {previous.indices=[...new Set([...previous.indices,...item.indices])].sort((a,b)=>a-b);
      previous.id=`${part}-${item.type}-${previous.indices.join('-')}`;
      previous.detail=`${previous.indices.map(i=>`${columns[i].label} ${columns[i].pillar[part]}`).join(' · ')}: 기존 관계표의 ${item.type} 조합입니다. 위치·월령에 따른 성립 강도나 사건을 확정하지 않습니다.`;}
  }
  return [...merged.values()];
}
// Exact arithmetic from App.jsx calcHumidity, copied only to expose an unexported readout.
export function legacyHumidity(pillars) {
  const VS={甲:1,乙:1,丙:-3,丁:-2.5,戊:-2,己:1,庚:-1,辛:-1,壬:3,癸:3};
  const VB={子:3,亥:3,寅:1,卯:1,辰:1,丑:1,未:-2,戌:-2,申:-1,酉:-1,巳:-3,午:-3};
  const SW=[.6,0,1.2,.6],BW=[.6,1.2,3,.6],base=pillars.slice(0,4),extra=pillars.slice(4);
  const stems=base.map(p=>p.stem),branches=base.map(p=>p.branch);let hum=0;
  stems.forEach((s,i)=>{if(i===1)return;const el=HS_EL[HS.indexOf(s)];const rooted=branches.some(b=>Object.values(EBH[b]||{}).some(h=>h&&HS_EL[HS.indexOf(h[0])]===el));hum+=(VS[s]||0)*(SW[i]||0)*(rooted?1.3:1)});
  branches.forEach((b,i)=>{hum+=(VB[b]||0)*(BW[i]||0)*(EBH[b]?.bon?.[0]&&stems.includes(EBH[b].bon[0])?1.2:1)});
  extra.forEach(p=>{hum+=(VB[p.branch]||0)*.5});return Math.round(hum*100)/100;
}
export function climateView(result, view, includeLuck) {
  const p=result?.saju?.pillars;
  if(result?.status!=='ready'||!p?.every(validPillar))return null;
  const d=includeLuck?view.decade:null,y=includeLuck?view.annual:null;
  const current=calcTCPA(p,d?.stem,d?.branch,y?.stem,y?.branch);
  return {temperatureBase:result.tcpa.sTotal,temperature:current.sTotal,humidityBase:legacyHumidity(p),
    humidity:legacyHumidity([...p,...[d,y].filter(Boolean)])};
}
// Legacy seven-shinsal subset. 'No hit' is distinct from unsupported rules.
// Independent, declared twelve-shinsal convention; not copied/recovered 8ja AOT code.
// Primary implementation reference: https://jumchindang.com/wiki/십이신살 (checked 2026-10-12).
const TWELVE_NAMES=Object.freeze(['겁살','재살','천살','지살','년살','월살','망신','장성','반안','역마','육해','화개']);
const TWELVE_START=Object.freeze({申:5,子:5,辰:5,寅:11,午:11,戌:11,巳:2,酉:2,丑:2,亥:8,卯:8,未:8});
export function twelveShinsal(basis,target) {
  if(!Object.hasOwn(TWELVE_START,basis)||!EB.includes(target))return null;
  return TWELVE_NAMES[mod(EB.indexOf(target)-TWELVE_START[basis],12)];
}
/** Original chart labels differ from the independent reference panel's aliases. */
export function chartTwelveShinsal(basis,target) {
  const name=twelveShinsal(basis,target);
  return name==='년살'?'도화':name==='육해'?'육액':name;
}
const CHEONUL={甲:['丑','未'],戊:['丑','未'],庚:['丑','未'],乙:['子','申'],己:['子','申'],丙:['亥','酉'],丁:['亥','酉'],辛:['寅','午'],壬:['卯','巳'],癸:['卯','巳']};
const YANGIN={甲:'卯',丙:'午',戊:'午',庚:'酉',壬:'子'};
const BAEKHO=['甲辰','乙未','丙戌','丁丑','戊辰','壬戌','癸丑'];
const GOEGANG=['庚辰','庚戌','壬辰','壬戌','戊辰','戊戌'];
const WONJIN=['子未','丑午','寅酉','卯申','辰亥','巳戌'];
export function shinsalView(columns,bases=['day','birthYear']) {
  const records=columns.map(c=>({column:c,movement:[],good:[],caution:[]}));
  const known=columns.filter(c=>c.kind==='calculated'&&validPillar(c.pillar));
  const day=known.find(c=>c.key==='day');
  for(const basis of bases){const source=known.find(c=>c.key===basis);if(!source)continue;
    for(const c of known){const name=twelveShinsal(source.pillar.branch,c.pillar.branch);
      if(name)records[c.index].movement.push({name,basis:basis==='day'?'日':'年'});
    }
  }
  for(const c of known){const p=c.pillar,r=records[c.index];
    if(day&&bases.includes('day')&&(CHEONUL[day.pillar.stem]||[]).includes(p.branch))r.good.push({name:'천을귀인',basis:'日'});
    if(day&&bases.includes('day')&&YANGIN[day.pillar.stem]===p.branch)r.caution.push({name:'양인',basis:'日'});
    if(BAEKHO.includes(p.stem+p.branch))r.caution.push({name:'백호',basis:'柱'});
    if(GOEGANG.includes(p.stem+p.branch))r.caution.push({name:'괴강',basis:'柱'});
  }
  // Preserve the original distance rule on natal pillars only. Do not reinterpret it on a reordered 6-column table.
  const natal=known.filter(c=>c.index>=2);
  for(const pair of WONJIN)for(const a of natal.filter(c=>c.pillar.branch===pair[0]))for(const b of natal.filter(c=>c.pillar.branch===pair[1])){
    if(Math.abs(a.index-b.index)<=2){for(const c of [a,b])if(!records[c.index].caution.some(v=>v.name==='원진'))records[c.index].caution.push({name:'원진',basis:'柱'});}
  }
  return records;
}
