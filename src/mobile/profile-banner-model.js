import {solarInput,DEFAULT_POLICY} from '../calendar/precise.js';
import {selectionForNow} from './selection-model.js';

/** Original banner compares the stored solar birth month/day, including lunar
 * births converted in their birth year, rather than this year's lunar birthday. */
export function birthdayEntries(entries,now=new Date()){
 if(!(now instanceof Date)||!Number.isFinite(now.getTime()))return [];
 return entries.filter(e=>{
  if(e.deletedAt||e.showBirthday===false||e.birth?.pillar_input||!['solar','lunar'].includes(e.birth?.calendar_type))return false;
  try{const s=solarInput(e.birth);return s.month===now.getMonth()+1&&s.day===now.getDate();}catch{return false;}
 });
}
export function currentBirth(now=new Date()){
 const s=selectionForNow('current-preview',now),[y,m,d]=s.date.split('-').map(Number);
 return {input_year:y,input_month:m,input_day:d,input_hour:s.hour,input_minute:s.minute,time_status:'known',calendar_type:'solar',lunar_leap_month:false,calculation_policy:{...DEFAULT_POLICY}};
}
