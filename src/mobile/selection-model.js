import {precisePillars,DEFAULT_POLICY,zoneAt} from '../calendar/precise.js';
import {validSelection} from '../vault/integrated-schema.js';
import {treeDecade} from './decade-selection.js';
export const LUCK_TYPES=Object.freeze({day:'일운',month:'월운',year:'세운'});
export const selectionType=s=>Object.hasOwn(LUCK_TYPES,s?.type)?s.type:'day';
export function selectionForType(selection,type){
 if(!Object.hasOwn(LUCK_TYPES,type)||!validSelection(selection))throw new Error('운 선택 날짜와 유형을 확인해 주세요.');
 return {...selection,type};
}
/** Civil month/year navigation clamps only the day, preserving the selected
 * local clock. It is a UI navigation aid, not a solar-term boundary calculator. */
export function shiftSelection(selection,offset){
 if(!validSelection(selection)||![-1,1].includes(offset))throw new Error('운 선택 날짜와 이동 방향을 확인해 주세요.');
 const [y,m,d]=selection.date.split('-').map(Number),type=selectionType(selection);
 let date;
 if(type==='day')date=new Date(Date.UTC(y,m-1,d+offset));
 else {const anchor=new Date(Date.UTC(y+(type==='year'?offset:0),m-1+(type==='month'?offset:0),1));const max=new Date(Date.UTC(anchor.getUTCFullYear(),anchor.getUTCMonth()+1,0)).getUTCDate();anchor.setUTCDate(Math.min(d,max));date=anchor;}
 const next={...selection,date:date.toISOString().slice(0,10),type};
 if(!validSelection(next))throw new Error('운 선택은 1900~2050년입니다.');
 return next;
}
export function selectedLuckItems(selection,selected){
 const type=selectionType(selection),items=[['year','세운'],['month','월운'],['day','일운'],['hour','시운']];
 return items.slice(0,type==='year'?1:type==='month'?2:4).map(([key,label])=>({key,label,pillar:selected[key]}));
}
export function selectionForDecade(selection,decade,policy=DEFAULT_POLICY){
 if(!Number.isFinite(decade?.startInstant)){
  if(!Number.isInteger(decade?.startYear))throw new Error('대운 시작 연도가 확인되지 않았습니다.');
  const next={...selectionForYear(selection,decade.startYear),type:'year'};
  if(!validSelection(next))throw new Error('운 선택은 1900~2050년입니다.');
  return next;
 }
 // A minute-only input must land at/after the crossing, including historical
 // zones whose UTC offsets include seconds. Never round back into the old luck.
 const p=policy||DEFAULT_POLICY,offset=zoneAt(decade.startInstant,p).offsetSeconds*1000;
 const wall=new Date(Math.ceil((decade.startInstant+offset)/60000)*60000);
 const next={...selection,date:wall.toISOString().slice(0,10),hour:wall.getUTCHours(),minute:wall.getUTCMinutes(),type:'year'};
 if(!validSelection(next))throw new Error('운 선택은 1900~2050년입니다.');
 const checked=selectedPillars(next,p);
 if(checked.error)throw new Error(checked.error);
 if(checked.instant<decade.startInstant)throw new Error('교운 시각을 확인해 주세요.');
 return next;
}
export function selectionForNow(entryId,now=new Date()){
 if(typeof entryId!=='string'||!entryId||!(now instanceof Date)||!Number.isFinite(now.getTime()))throw new Error('현재 날짜와 명식을 확인해 주세요.');
 const year=now.getFullYear();if(year<1900||year>2050)throw new Error('운 선택은 1900~2050년입니다.');
 const pad=n=>String(n).padStart(2,'0');
 return {entryId,date:`${year}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`,hour:now.getHours(),minute:now.getMinutes()};
}
export function selectedPillars(selection,policy=DEFAULT_POLICY){
 try{const [year,month,day]=selection.date.split('-').map(Number);if(year<1900||year>2050)throw new Error('운 선택은 1900~2050년입니다.');
  const r=precisePillars({year,month,day,hour:selection.hour,minute:selection.minute},policy||DEFAULT_POLICY);
  return {instant:r.clock.instant,year:r.pillars[3],month:r.pillars[2],day:r.pillars[1],hour:r.pillars[0],term:r.lastJie,audit:r.clock.audit};
 }catch(e){return {error:e.message};}
}
export function selectionForYear(selection,year){const [_,month,day]=selection.date.split('-').map(Number),max=new Date(Date.UTC(year,month,0)).getUTCDate();return {...selection,date:`${year}-${String(month).padStart(2,'0')}-${String(Math.min(day,max)).padStart(2,'0')}`};}

export function preciseLuckView(base,result,selected,policy) {
 if(result.origin!=='astronomical'||selected.error)return base;
 const decade=treeDecade(base.decades,selected,base.year).pillar;
 const convert=(year,month)=>selectedPillars({date:`${year}-${String(month).padStart(2,'0')}-15`,hour:12,minute:0},policy);
 return {...base,decade,annual:{...selected.year,year:base.year},years:base.years.filter(y=>y.year<=2050).map(y=>({...convert(y.year,7).year,year:y.year})),
 months:base.months.filter(m=>m.year<=2050).map(m=>({...m,...convert(m.year,m.month).month})),precision:true};
}
