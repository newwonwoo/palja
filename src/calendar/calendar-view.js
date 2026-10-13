import {solarInput,datePillar,solarTerms,precisePillars,DEFAULT_POLICY} from './precise.js';
const pad=n=>String(n).padStart(2,'0');
export function displayDate(value) {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('날짜를 선택하세요.');
 const [year,month,day]=value.split('-').map(Number);
 solarInput({input_year:year,input_month:month,input_day:day,calendar_type:'solar'});
 return {year,month,day};
}
/** Korean civil calendar display: times below are fixed UTC+09:00, not birth-clock corrections. */
export function lunarTermMonth(year,month) {
 displayDate(`${year}-${pad(month)}-01`);
 const firstWeekday=new Date(Date.UTC(year,month-1,1)).getUTCDay();
 const terms=solarTerms(year).map(t=>({...t,local:new Date(t.instant+9*3600000).toISOString().slice(0,16)})).filter(t=>Number(t.local.slice(5,7))===month);
 const count=new Date(Date.UTC(year,month,0)).getUTCDate();
 const days=Array.from({length:count},(_,i)=>{const day=i+1,key=`${year}-${pad(month)}-${pad(day)}`;
  const converted=solarInput({input_year:year,input_month:month,input_day:day,calendar_type:'solar'});
  return {year,month,day,key,pillar:datePillar(year,month,day),lunar:converted.lunar,terms:terms.filter(t=>t.local.slice(0,10)===key)};
 });
 return {year,month,firstWeekday,days,terms};
}
export function preciseDayHours(date) {
 const d=displayDate(date);
 return Array.from({length:12},(_,i)=>{const hour=i*2,base={hour,minute:0,time:pad(hour)+':00'};
  try{return {...base,pillar:precisePillars({...d,hour,minute:0},DEFAULT_POLICY).pillars[0]};}
  catch(e){return {...base,pillar:null,error:e.message};}
 });
}
