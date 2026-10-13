/** Independent, versioned offline calendar. No original 8ja AOT rules are claimed.
 * Astronomy Engine 2.1.19 SearchSunLongitude; korean-lunar-calendar 0.4.0;
 * IANA tzdb 2025b Asia/Seoul; NOAA fractional-year EOT approximation.
 */
import { SearchSunLongitude } from 'astronomy-engine';
import KoreanLunarCalendar from 'korean-lunar-calendar';
import tz from './seoul-transitions.json' with {type:'json'};
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
 let row=tz.transitions[0];for(const t of tz.transitions){if(t.at>instant)break;row=t;}return row;
}
export function localToUtc(s,p=DEFAULT_POLICY) {
 const errors=validatePolicy(p);if(errors.length)throw new Error(errors.join(' '));
 if(![s.year,s.month,s.day,s.hour,s.minute].every(Number.isInteger)||s.hour<0||s.hour>23||s.minute<0||s.minute>59)throw new Error('날짜·시각을 확인해 주세요.');
 const wall=Date.UTC(s.year,s.month-1,s.day,s.hour,s.minute), verify=new Date(wall);
 if(verify.getUTCMonth()!==s.month-1||verify.getUTCDate()!==s.day)throw new Error('존재하지 않는 날짜입니다.');
 const offsets=p.zone==='fixed'?[p.offsetMinutes*60]:[...new Set(tz.transitions.map(t=>t.offsetSeconds))];
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
 return {instant,adjusted,year:d.getUTCFullYear(),month:d.getUTCMonth()+1,day:d.getUTCDate(),hour:d.getUTCHours(),minute:d.getUTCMinutes(),second:d.getUTCSeconds(),audit:{zone:p.zone,offsetMinutes:zone.offsetSeconds/60,dstMinutes:zone.dstSeconds/60,longitudeMinutes,equationMinutes:eot,totalCorrectionMinutes:-zone.dstSeconds/60+longitudeMinutes+eot,ambiguous,policy:{...p},tzdb:'2025b'}};
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
 if(p.dayBoundary==='zi23'&&clock.hour>=23)dayInstant+=DAY;
 const dayDate=new Date(dayInstant),dp=datePillar(dayDate.getUTCFullYear(),dayDate.getUTCMonth()+1,dayDate.getUTCDate());
 const hourBranch=Math.floor(((clock.hour*60+clock.minute+60)%1440)/120);
 const pillars=[pillar((dp.stemIdx%5)*2+hourBranch,hourBranch),dp,pillar(monthStem,monthBranch),pillar(year-4,year-4)]
   .map((v,i)=>({label:['시','일','월','년'][i],...v}));
 return {pillars,dayStem:dp.stem,solar:{...s},clock,lastJie,nextJie,yearBoundary:lichun.iso};
}
export function preciseDaeun(saju,sex) {
 if(!['male','female'].includes(sex))return [];
 const forward=(saju.pillars[3].stemIdx%2===0)===(sex==='male'),event=forward?saju.nextJie:saju.lastJie;
 const gap=Math.abs(event.instant-saju.clock.instant)/DAY,age=gap/3;
 const base=saju.pillars[2],birthYear=saju.solar.year;
 return Array.from({length:10},(_,i)=>{
  const startAgeExact=age+i*10,startInstant=saju.clock.instant+startAgeExact*365.2425*DAY;
  return {...pillar(base.stemIdx+(forward?1:-1)*(i+1),base.branchIdx+(forward?1:-1)*(i+1)),startAge:Number(startAgeExact.toFixed(2)),startAgeExact,startYear:new Date(startInstant+9*3600000).getUTCFullYear(),startInstant,direction:forward?'순행':'역행',basis:'절입까지 경과일 ÷ 3; 시작일은 1년=365.2425일 근사',boundary:event.iso,birthYear};
 });
}
export function preciseEntryBase(b) {
 const s=solarInput(b),p=b.calculation_policy;
 if(b.time_status!=='known') {
  // Do not silently choose a noon birth near a term or changed local day.
  const a=precisePillars({...s,hour:0,minute:0},p),z=precisePillars({...s,hour:23,minute:59},p);
  const pillars=a.pillars.map((v,i)=>i===0||v.stem!==z.pillars[i].stem||v.branch!==z.pillars[i].branch?{label:v.label,unknown:true}:v);
  return {saju:{pillars,dayStem:pillars[1].unknown?null:pillars[1].stem,solar:{...s,hour:null,minute:null}},daeun:[],partial:true};
 }
 const saju=precisePillars({...s,hour:b.input_hour,minute:b.input_minute},p);
 return {saju,daeun:preciseDaeun(saju,b.sex),partial:false};
}
