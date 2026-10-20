import {validPillar,sixColumns} from './reader-model.js';

/** Read-only adapter. No flow score, event prediction or missing pillar is invented. */
export function treeDecade(decades,selected,year){
 const known=(decades||[]).filter(validPillar);
 const timed=known.filter(d=>Number.isFinite(d.startInstant)).sort((a,b)=>a.startInstant-b.startInstant);
 if(timed.length&&Number.isFinite(selected.instant)){
  const i=timed.findLastIndex(d=>d.startInstant<=selected.instant);
  if(i<0)return {pillar:null,precision:'instant',reason:'대운 시작 전'};
  const d=timed[i],end=timed[i+1]?.startInstant??d.endInstant;
  if(Number.isFinite(end))return selected.instant<end?{pillar:d,precision:'instant'}:{pillar:null,precision:'instant',reason:'확인된 대운 범위 밖'};
  // The final returned decade has no following boundary. Keep its declared
  // ten-year range, visibly marked as year-based rather than extending forever.
  return Number.isInteger(d.startYear)&&year<d.startYear+10?{pillar:d,precision:'year'}:{pillar:null,precision:'year',reason:'확인된 대운 범위 밖'};
 }
 const byYear=known.filter(d=>Number.isInteger(d.startYear)).sort((a,b)=>b.startYear-a.startYear);
 const d=byYear.find(d=>year>=d.startYear&&year<d.startYear+10);
 return {pillar:d||null,precision:'year',reason:d?null:byYear.length&&year<byYear.at(-1).startYear?'대운 시작 전':'대운을 계산할 정보가 없습니다.'};
}

export function luckTreeView(entry,result,selection,selected){
 if(selected.error)return {status:'unavailable',reason:selected.error};
 if(!validPillar(result.saju?.pillars?.[1]))return {status:'unavailable',reason:'일주를 계산·확인한 명식에서 운세 트리를 볼 수 있습니다.'};
 const year=Number(selection.date.slice(0,4)),decade=treeDecade(result.daeun,selected,year);
 const items=[['hour','시진',selected.hour],['day','일진',selected.day],['month','절운',selected.month],['year','세운',selected.year],['decade','대운',decade.pillar]];
 return {status:'ready',decadePrecision:decade.precision,decadeReason:decade.reason,
  columns:items.map(([key,label,pillar],index)=>({key:'tree-'+key,label,index,kind:validPillar(pillar)?'calculated':'unknown',pillar:validPillar(pillar)?pillar:null})),
  natal:sixColumns(entry,result,{},false).slice(2)};
}
