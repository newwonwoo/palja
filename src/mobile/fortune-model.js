/** Independent descriptive *classification*, not a fortune, lucky-score, or event probability.
 * One representative instant per civil month, never presented as an exact solar-month boundary.
 */
import {getSS,HS,HS_EL} from './engine.js';
import {selectedPillars} from './selection-model.js';
import {validPillar} from './reader-model.js';
import {branchPairTypes} from './traditional-reference.js';
import {researchAnalysis} from './research-analysis.js';
import {DEFAULT_WEIGHTS} from '../vault/integrated-schema.js';
import {DEFAULT_RULES} from '../vault/analysis-rules.js';

export const FORTUNE_AREAS=Object.freeze([
  {id:'wealth',label:'재물·관리',tags:['편재','정재'],explanation:'재성은 일간이 극하는 오행과 관련된 전통 분류입니다. 돈의 증가나 손실을 예측하지 않습니다.'},
  {id:'work',label:'직업·규범',tags:['편관','정관'],explanation:'관성은 일간을 극하는 오행과 관련된 전통 분류입니다. 승진·합격·불이익을 예측하지 않습니다.'},
  {id:'expression',label:'표현·생산',tags:['식신','상관'],explanation:'식상은 일간이 생하는 오행과 관련된 전통 분류입니다. 성과·평판을 예측하지 않습니다.'},
  {id:'study',label:'학습·지원',tags:['편인','정인'],explanation:'인성은 일간을 생하는 오행과 관련된 전통 분류입니다. 시험·계약 결과를 예측하지 않습니다.'},
  {id:'people',label:'동료·협력',tags:['비견','겁재'],explanation:'비겁은 일간과 같은 오행과 관련된 전통 분류입니다. 인간관계의 좋고 나쁨을 예측하지 않습니다.'},
]);
export function classifyTenGod(god){return FORTUNE_AREAS.find(a=>a.tags.includes(god))||null;}
export function fortuneMonthTimeline(result,year,policy){
 const day=result?.saju?.pillars?.[1];
 if(!validPillar(day))return {status:'unavailable',reason:'일주가 확인된 명식에서만 분야별 십성을 분류합니다.',months:[]};
 if(!Number.isInteger(year)||year<1900||year>2050)return {status:'unavailable',reason:'조회 연도는 1900~2050년입니다.',months:[]};
 const months=[];
 for(let month=1;month<=12;month++){
   const date=`${year}-${String(month).padStart(2,'0')}-15`;
   const r=selectedPillars({date,hour:12,minute:0},policy);
   if(r.error||!validPillar(r.month)){months.push({month,date,error:r.error||'월주를 계산하지 못했습니다.'});continue;}
   const god=getSS(day.stem,r.month.stem),focus=classifyTenGod(god);
   const branchTypes=branchPairTypes(day.branch,r.month.branch);
   months.push({month,date,pillar:{stem:r.month.stem,branch:r.month.branch},god,focusId:focus?.id||null,
      element:HS_EL[HS.indexOf(r.month.stem)],dayBranchRelations:branchTypes});
 }
 return {status:'ready',year,months,explanation:'각 양력 월 15일 12:00의 월주 표본입니다. 절입 전후에는 월주가 달라집니다. 분야 이름은 십성의 전통 분류이며 길흉·성과·확률·점수가 아닙니다.'};
}
export function areaMonths(timeline,id){if(timeline.status!=='ready')return [];return timeline.months.filter(m=>!m.error&&m.focusId===id);}
export function elementMonthTimeline(result,year,policy,weights=DEFAULT_WEIGHTS,rules=DEFAULT_RULES){
 if(!Number.isInteger(year)||year<1900||year>2050)return [];
 return Array.from({length:12},(_,i)=>{
  const date=`${year}-${String(i+1).padStart(2,'0')}-15`,s=selectedPillars({date,hour:12,minute:0},policy);
  if(s.error)return {month:i+1,error:s.error};
  const ordered=(result.daeun||[]).filter(d=>Number.isFinite(d.startInstant)).sort((a,b)=>a.startInstant-b.startInstant);
  const decade=ordered.length?ordered.find((d,i)=>s.instant>=d.startInstant&&s.instant<(ordered[i+1]?.startInstant??d.startInstant+10*365.2425*86400000)):(result.daeun||[]).find(d=>year>=d.startYear&&year<d.startYear+10);
  const a=researchAnalysis(result,[decade,s.year,s.month,s.day,s.hour],weights,rules);
  return a.status==='ready'?{month:i+1,date,ratios:Object.fromEntries(Object.entries(a.scores).map(([e,n])=>[e,n/a.total])),strength:a.strength.name}:{month:i+1,error:a.reason};
 });
}
