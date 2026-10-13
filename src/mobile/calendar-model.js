/** Offline calendar/reverse search using the existing engine, not recovered 8ja AOT. */
import {getDP,getMP,getYP,getMaxDay,calcSaju,HS,EB,EBH,getSS,getUnsung} from '../App.jsx';
export {HS,EB,EBH,getSS,getUnsung};
const pad = n => String(n).padStart(2,'0');
export const dateKey = (year,month,day) => `${year}-${pad(month)}-${pad(day)}`;
export function parseCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('날짜를 선택해 주세요.');
  const [year,month,day]=value.split('-').map(Number);
  if(year<1900||year>2030||month<1||month>12||day<1||day>getMaxDay(year,month))throw new Error('1900~2030년의 실제 날짜를 선택해 주세요.');
  return {year,month,day};
}
export function calendarMonth(year,month) {
  parseCalendarDate(dateKey(year,month,1));
  const firstWeekday=new Date(Date.UTC(year,month-1,1)).getUTCDay();
  const days=Array.from({length:getMaxDay(year,month)},(_,i)=>{const day=i+1;return {year,month,day,key:dateKey(year,month,day),weekday:(firstWeekday+i)%7,pillar:getDP(year,month,day)};});
  return {year,month,firstWeekday,days};
}
export function dayHours(value) {
  const {year,month,day}=parseCalendarDate(value);
  return Array.from({length:12},(_,i)=>({hour:i*2,minute:0,time:pad(i*2)+':00',pillar:calcSaju(year,month,day,i*2,0).pillars[0]}));
}
/** Bounded, cancellable day-pillar search. Never claims to be four-pillar reverse search. */
export async function findDayPillar({start,end,stem,branch,limit=100,signal,onProgress=()=>{}}) {
  const a=parseCalendarDate(start),b=parseCalendarDate(end);
  const startMs=Date.UTC(a.year,a.month-1,a.day),endMs=Date.UTC(b.year,b.month-1,b.day);
  if(startMs>endMs)throw new Error('시작일은 종료일보다 늦을 수 없습니다.');
  if(!HS.includes(stem)||!EB.includes(branch)||HS.indexOf(stem)%2!==EB.indexOf(branch)%2)throw new Error('육십갑자에 있는 일주를 선택해 주세요.');
  if(!Number.isSafeInteger(limit)||limit<1||limit>1000)throw new Error('검색 결과 한도를 확인해 주세요.');
  const total=(endMs-startMs)/86400000+1,results=[];let checked=0,truncated=false;
  for(let ms=startMs;ms<=endMs;ms+=86400000) {
    if(signal?.aborted)throw new DOMException('검색을 취소했습니다.','AbortError');
    const date=new Date(ms),year=date.getUTCFullYear(),month=date.getUTCMonth()+1,day=date.getUTCDate();
    const p=getDP(year,month,day);checked++;
    if(p.stem===stem&&p.branch===branch) {
      if(results.length===limit){truncated=true;break;}
      results.push({key:dateKey(year,month,day),dayPillar:p,monthPillar:getMP(year,month,day),yearPillar:getYP(year,month,day)});
    }
    if(checked%256===0){onProgress({checked,total});await new Promise(resolve=>setTimeout(resolve,0));}
  }
  onProgress({checked,total});return {results,checked,total,truncated};
}
