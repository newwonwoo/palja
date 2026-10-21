/** Independent, versioned offline calendar. No original 8ja AOT rules are claimed.
 * Astronomy Engine 2.1.19 SearchSunLongitude; korean-lunar-calendar 0.4.0;
 * IANA tzdb 2025b Asia/Seoul; NOAA fractional-year EOT approximation.
 */
import { SearchSunLongitude } from 'astronomy-engine';
import KoreanLunarCalendar from 'korean-lunar-calendar';
import tz from './seoul-transitions.json' with {type:'json'};
import foreignZones from './foreign-transitions.json' with {type:'json'};
import {DEFAULT_POLICY,validatePolicy} from './policy.js';
export {DEFAULT_POLICY,validatePolicy};
const HS=[...'甲乙丙丁戊己庚辛壬癸'],EB=[...'子丑寅卯辰巳午未申酉戌亥'];
const mod=(n,m)=>((n%m)+m)%m, DAY=86400000, cache=new Map();
export const pillar=(stemIdx,branchIdx)=>({stemIdx:mod(stemIdx,10),branchIdx:mod(branchIdx,12),stem:HS[mod(stemIdx,10)],branch:EB[mod(branchIdx,12)]});
export function solarInput(b) {
 const {input_year:y,input_month:m,input_day:d}=b;
 if(![y,m,d].every(Number.isInteger)||y<1900||y>2050)throw new Error('새 역법 지원 범위는 1900~2050년입니다.');
 const c=new KoreanLunarCalendar();
 if(b.calendar_type==='solar') {if(!c.setSolarDate(y,m,d))throw new Error('존재하지 않는 양력 날짜입니다.');}
 else if(b.calendar_type==='lunar') {
  if(typeof b.lunar_leap_month!=='boolean'||!c.setLunarDate(y,m,d,b.lunar_leap_month))throw new Error('음력 날짜·윤달을 확인해 주세요.');
 } else throw new Error('양력·음력을 확인해 주세요.');
 const solar=c.getSolarCalendar();if(solar.year<1900||solar.year>2050)throw new Error('변환 날짜가 지원 범위를 벗어났습니다.');
 return {year:solar.year,month:solar.month,day:solar.day,lunar:c.getLunarCalendar()};
}
export function zoneAt(instant,p=DEFAULT_POLICY) {
 if(p.zone==='fixed')return {offsetSeconds:p.offsetMinutes*60,dstSeconds:0};
 if(p.zone!=='Asia/Seoul'){
  const rows=foreignZones.zones[p.zone];
  if(!rows||instant<rows[0][0]||instant>=Date.UTC(2153,0,1))throw new Error('해외 시간대 전환표 범위를 벗어났습니다.');
  let left=0,right=rows.length-1;
  while(left<right){const mid=Math.ceil((left+right)/2);if(rows[mid][0]<=instant)left=mid;else right=mid-1;}
  return {offsetSeconds:rows[left][1],dstSeconds:rows[left][2]};
 }
 let row=tz.transitions[0];for(const t of tz.transitions){if(t.at>instant)break;row=t;}return row;
}
const foreignOffsets=new Map(Object.entries(foreignZones.zones).map(([zone,rows])=>[zone,[...new Set(rows.map(r=>r[1]))]]));
export function localToUtc(s,p=DEFAULT_POLICY) {
 const errors=validatePolicy(p);if(errors.length)throw new Error(errors.join(' '));
 if(![s.year,s.month,s.day,s.hour,s.minute].every(Number.isInteger)||s.hour<0||s.hour>23||s.minute<0||s.minute>59)throw new Error('날짜·시각을 확인해 주세요.');
 const wall=Date.UTC(s.year,s.month-1,s.day,s.hour,s.minute), verify=new Date(wall);
 if(verify.getUTCMonth()!==s.month-1||verify.getUTCDate()!==s.day)throw new Error('존재하지 않는 날짜입니다.');
 const offsets=p.zone==='fixed'?[p.offsetMinutes*60]:p.zone==='Asia/Seoul'?[...new Set(tz.transitions.map(t=>t.offsetSeconds))]:foreignOffsets.get(p.zone);
 const choices=offsets.map(o=>wall-o*1000).filter(t=>t+zoneAt(t,p).offsetSeconds*1000===wall).sort((a,b)=>a-b);
 if(!choices.length)throw new Error('시계가 앞으로 이동한 구간으로 실제 존재하지 않는 현지 시각입니다.');
 if(choices.length>1&&p.fold==='reject')throw new Error('시계가 뒤로 이동해 두 번 존재하는 시각입니다. 먼저/나중 시각을 선택하세요.');
 return {instant:p.fold==='later'?choices.at(-1):choices[0],ambiguous:choices.length>1};
}
export function equationOfTime(instant) {
 const d=new Date(instant),year=d.getUTCFullYear(),days=(Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/DAY;
 const n=(instant-Date.UTC(year,0,1))/DAY;
 const g=2*Math.PI/days*(n-.5);
 return 229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g));
}
export function correctedClock(s,p=DEFAULT_POLICY) {
 const {instant,ambiguous}=localToUtc(s,p),zone=zoneAt(instant,p);
 const standardOffset=(zone.offsetSeconds-zone.dstSeconds)/60;
 const longitudeMinutes=p.clock==='standard'?0:p.longitude*4-standardOffset;
 const eot=p.clock==='apparent-solar'?equationOfTime(instant):0;
 const adjusted=instant+(standardOffset+longitudeMinutes+eot)*60000;
 const d=new Date(adjusted);
 return {instant,adjusted,year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate(),hour:d.getUTCHours(),minute:d.getUTCMinutes(),second:d.getUTCSeconds(),audit:{zone:p.zone,offsetMinutes:zone.offsetSeconds/60,dstMinutes:zone.dstSeconds/60,longitudeMinutes,equationMinutes:eot,totalCorrectionMinutes:-zone.dstSeconds/60+longitudeMinutes+eot,ambiguous,policy:{...p},tzdb:p.zone==='fixed'?'fixed':p.zone==='Asia/Seoul'?'2025b':foreignZones.tzdb}};
}
const NAMES=['소한','대한','입춘','우수','경칩','춘분','청명','곡우','입하','소만','망종','하지','소서','대서','입추','처서','백로','추분','한로','상강','입동','소설','대설','동지'];
export function solarTerms(year) {
 if(!Number.isInteger(year)||year<1898||year>2052)throw new Error('절기 연도 범위를 벗어났습니다.');
 if(!cache.has(year)) {
  const rows=NAMES.map((name,i)=>{const month=Math.floor(i/2),start=new Date(Date.UTC(year,month,i%2===0?1:15));
   const target=(285+15*i)%360,time=SearchSunLongitude(target,start,18);
   if(!time)throw new Error('절기 탐색 실패: '+name);
   return Object.freeze({name,index:i,longitude:target,instant:time.date.getTime(),iso:time.date.toISOString(),jie:i%2===0});});
  cache.set(year,Object.freeze(rows));if(cache.size>12)cache.delete(cache.keys().next().value);
 }
 return cache.get(year);
}
export function datePillar(year,month,day) {
 // 2000-01-07 is 甲子; independently checked against bundled Korean lunar calendar GapJa.
 const index=mod(Math.floor((Date.UTC(year,month-1,day)-Date.UTC(2000,0,7))/DAY),60);return pillar(index,index);
}
export function precisePillars(s,p=DEFAULT_POLICY) {
 const clock=correctedClock(s,p),utcYear=new Date(clock.instant).getUTCFullYear();
 const events=[...solarTerms(utcYear-1),...solarTerms(utcYear),...solarTerms(utcYear+1)].sort((a,b)=>a.instant-b.instant);
 const lastJie=events.filter(e=>e.jie&&e.instant<=clock.instant).at(-1),nextJie=events.find(e=>e.jie&&e.instant>clock.instant);
 const lichun=solarTerms(s.year)[2];
 const solarYear=clock.instant<lichun.instant?s.year-1:s.year;
 const year=p.yearBoundary==='jan1'?s.year:solarYear;
 const monthBranch=mod(1+Math.floor(lastJie.index/2),12),monthOrdinal=mod(monthBranch-2,12);
 // Month stems follow the solar-term year even if displayed year uses Jan 1.
 const monthStem=mod((mod(solarYear-4,10)%5)*2+2+monthOrdinal,10);
 let dayInstant=Date.UTC(clock.year,clock.month-1,clock.day);
 const minuteOfDay=clock.hour*60+clock.minute,offset=p.hourBoundaryOffset||0,lateZi=minuteOfDay>=1380+offset;
 if(p.dayBoundary==='zi23'&&lateZi)dayInstant+=DAY;
 const dayDate=new Date(dayInstant),dp=datePillar(dayDate.getUTCFullYear(),dayDate.getUTCMonth()+1,dayDate.getUTCDate());
 const hourBranch=Math.floor(mod(minuteOfDay+60-offset,1440)/120);
 const hourDayStem=p.dayBoundary==='zi-split'&&lateZi?mod(dp.stemIdx+1,10):dp.stemIdx;
 const pillars=[pillar((hourDayStem%5)*2+hourBranch,hourBranch),dp,pillar(monthStem,monthBranch),pillar(year-4,year-4)]
   .map((v,i)=>({label:['시','일','월','년'][i],...v}));
 return {pillars,dayStem:dp.stem,solar:{...s},clock,lastJie,nextJie,yearBoundary:lichun.iso};
}
export function preciseDaeun(saju,sex) {
 const policy=saju.clock.audit.policy,direction=policy.daeunDirection||'auto';
 if(direction==='auto'&&!['male','female'].includes(sex))return [];
 const forward=direction==='auto'?(saju.pillars[3].stemIdx%2===0)===(sex==='male'):direction==='forward',event=forward?saju.nextJie:saju.lastJie;
 const gap=Math.abs(event.instant-saju.clock.instant)/DAY,age=gap/3;
 const base=saju.pillars[2],birthYear=saju.solar.year;
 return Array.from({length:10},(_,i)=>{
  const startAgeExact=age+i*10,startInstant=policy.daeunMethod==='calendar'?calendarDaeunStart(saju.clock.instant,age,i):saju.clock.instant+startAgeExact*365.2425*DAY;
  return {...pillar(base.stemIdx+(forward?1:-1)*(i+1),base.branchIdx+(forward?1:-1)*(i+1)),startAge:Number(startAgeExact.toFixed(2)),startAgeExact,startYear:new Date(startInstant+zoneAt(startInstant,policy).offsetSeconds*1000).getUTCFullYear(),startInstant,direction:forward?'순행':'역행',gapDays:gap,basis:policy.daeunMethod==='calendar'?'절입 경과 3일=1년, 1일=4개월, 나머지는 30일/월 비례; UTC 달력 가산':'절입까지 경과일 ÷ 3; 시작일은 1년=365.2425일 근사',boundary:event.iso,birthYear};
 });
}
export function calendarDaeunStart(birthInstant,age,decadeIndex=0){
 const months=age*12,whole=Math.floor(months)+decadeIndex*120,fraction=months-Math.floor(months),d=new Date(birthInstant);
 const targetMonth=d.getUTCMonth()+whole,year=d.getUTCFullYear()+Math.floor(targetMonth/12),month=mod(targetMonth,12),day=Math.min(d.getUTCDate(),new Date(Date.UTC(year,month+1,0)).getUTCDate());
 return Date.UTC(year,month,day,d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds(),d.getUTCMilliseconds())+fraction*30*DAY;
}
export function preciseEntryBase(b) {
 const s=solarInput(b),p=b.calculation_policy;
 if(b.time_status!=='known') {
  // Midnight itself can be a gap/fold. Inspect the entire civil date, including
  // both occurrences of repeated minutes, without choosing a birth time.
  const errors=validatePolicy(p);if(errors.length)throw new Error(errors.join(' '));
  const extremes={};
  for(let minute=0;minute<1440;minute++){
   const sample={...s,hour:Math.floor(minute/60),minute:minute%60};
   let first;
   try{first=correctedClock(sample,{...p,fold:'earlier'});}
   catch(error){if(error.message.includes('실제 존재하지 않는 현지 시각'))continue;throw error;}
   const clocks=[{clock:first,fold:'earlier'}];
   if(first.audit.ambiguous)clocks.push({clock:correctedClock(sample,{...p,fold:'later'}),fold:'later'});
   for(const {clock,fold} of clocks)for(const key of ['instant','adjusted'])for(const side of ['min','max']){
    const id=key+side,previous=extremes[id];
    if(!previous||(side==='min'?clock[key]<previous.clock[key]:clock[key]>previous.clock[key]))extremes[id]={sample,clock,fold};
   }
  }
  if(!extremes.instantmin)throw new Error('이 시간대에 실제 존재하는 현지 날짜가 아닙니다.');
  // Year/month depend on actual instants; day on corrected instants. All are
  // monotone over those ranges. Hour is always withheld for unknown time.
  const probes=Object.values(extremes).map(({sample,fold})=>precisePillars(sample,{...p,fold}));
  const pillars=probes[0].pillars.map((v,i)=>i===0||probes.some(z=>v.stem!==z.pillars[i].stem||v.branch!==z.pillars[i].branch)?{label:v.label,unknown:true}:v);
  return {saju:{pillars,dayStem:pillars[1].unknown?null:pillars[1].stem,solar:{...s,hour:null,minute:null}},daeun:[],partial:true};
 }
 const saju=precisePillars({...s,hour:b.input_hour,minute:b.input_minute},p);
 return {saju,daeun:preciseDaeun(saju,b.sex),partial:false};
}
