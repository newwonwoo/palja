import {validPillar,sixColumns} from './reader-model.js';

import {treeDecade} from './decade-selection.js';
export {treeDecade} from './decade-selection.js';

export function luckTreeView(entry,result,selection,selected){
 if(selected.error)return {status:'unavailable',reason:selected.error};
 if(!validPillar(result.saju?.pillars?.[1]))return {status:'unavailable',reason:'일주를 계산·확인한 명식에서 운세 트리를 볼 수 있습니다.'};
 const year=Number(selection.date.slice(0,4)),decade=treeDecade(result.daeun,selected,year);
 const items=[['hour','시진',selected.hour],['day','일진',selected.day],['month','절운',selected.month],['year','세운',selected.year],['decade','대운',decade.pillar]];
 return {status:'ready',decadePrecision:decade.precision,decadeReason:decade.reason,
  columns:items.map(([key,label,pillar],index)=>({key:'tree-'+key,label,index,kind:validPillar(pillar)?'calculated':'unknown',pillar:validPillar(pillar)?pillar:null})),
  natal:sixColumns(entry,result,{},false).slice(2)};
}
