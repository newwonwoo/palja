import {precisePillars,DEFAULT_POLICY} from '../calendar/precise.js';
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
 const decade=base.decades.find(d=>selected.instant>=d.startInstant&&selected.instant<d.startInstant+10*365.2425*86400000)||null;
 const convert=(year,month)=>selectedPillars({date:`${year}-${String(month).padStart(2,'0')}-15`,hour:12,minute:0},policy);
 return {...base,decade,annual:{...selected.year,year:base.year},years:base.years.filter(y=>y.year<=2050).map(y=>({...convert(y.year,7).year,year:y.year})),
 months:base.months.filter(m=>m.year<=2050).map(m=>({...m,...convert(m.year,m.month).month})),precision:true};
}
