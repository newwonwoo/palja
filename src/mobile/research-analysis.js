/** Explicit Palja research conventions. Descriptive symbol analysis, never event forecasts.
 * Month hidden stems: existing EBH 30-day allocation. Inner patterns: month-main or revealed.
 * External-pattern percentage thresholds below are product screening conventions, not classical proofs.
 */
import {HS,EB,HS_EL,EB_EL,EBH,getSS} from './engine.js';
import {validPillar} from './reader-model.js';
import {weightedAnalysis} from './weighted-analysis.js';
import {DEFAULT_WEIGHTS} from '../vault/integrated-schema.js';
import {DEFAULT_RULES} from '../vault/analysis-rules.js';
export const ELEMENTS=[...'木火土金水'];
export const GENERATES={木:'火',火:'土',土:'金',金:'水',水:'木'};
export const CONTROLS={木:'土',火:'金',土:'水',金:'木',水:'火'};
export const GENERATED_BY=Object.fromEntries(Object.entries(GENERATES).map(([a,b])=>[b,a]));
export const CONTROLLED_BY=Object.fromEntries(Object.entries(CONTROLS).map(([a,b])=>[b,a]));
const HAP=[['甲','己','土'],['乙','庚','金'],['丙','辛','水'],['丁','壬','木'],['戊','癸','火']];
const SLOTS=['시','일','월','년'];
const el=s=>HS_EL[HS.indexOf(s)];
const hidden=p=>Object.values(EBH[p?.branch]||{}).filter(Boolean);
export function combineContributions(pillars,weighted,rules=DEFAULT_RULES){
 const scores={...weighted.scores},events=[],month=EB_EL[EB.indexOf(pillars[2]?.branch)],used=new Set();
 for(let i=0;i<pillars.length;i++)for(let j=i+1;j<pillars.length;j++){
  if(!validPillar(pillars[i])||!validPillar(pillars[j]))continue;
  const hit=HAP.find(([a,b])=>pillars[i].stem===a&&pillars[j].stem===b||pillars[i].stem===b&&pillars[j].stem===a);if(!hit)continue;
  const adjacent=j-i===1,season=month===hit[2]||GENERATES[month]===hit[2],competition=used.has(i)||used.has(j)||pillars.filter(p=>validPillar(p)&&(p.stem===hit[0]||p.stem===hit[1])).length!==2;
  const active=rules.combinationMode==='seasonal'&&adjacent&&season&&!competition;
  events.push({name:hit[0]+hit[1]+'合'+hit[2],indices:[i,j],active,reason:rules.combinationMode==='off'?'합화 변환 꺼짐':!adjacent?'인접하지 않은 천간':!season?'월지 오행이 화기와 같거나 생하지 않음':competition?'쟁합·중복으로 변환 보류':'인접·월령 지원·유일한 천간쌍의 제품 규칙 충족'});
  if(active){used.add(i);used.add(j);for(const k of [i,j]){
   const value=weighted.contributions.filter(c=>c.label===SLOTS[k]+' 천간').reduce((n,c)=>n+c.value,0)*rules.combinationWeight;
   scores[el(pillars[k].stem)]-=value;scores[hit[2]]+=value;
  }}
 }
 return {...weighted,scores,combinations:events,convention:weighted.convention+' / 합화는 인접 천간·월령 지원·쟁합 제외의 선택형 단순 규칙. 지장간은 변환하지 않음.'};
}
export function monthCommand(result){
 const p=result?.saju?.pillars||[],month=p[2];if(!validPillar(month))return null;
 const table=['yo','jung','bon'].map(k=>({kind:{yo:'여기',jung:'중기',bon:'본기'}[k],value:EBH[month.branch]?.[k]})).filter(x=>x.value);
 const instant=result.saju.clock?.instant,boundary=result.saju.lastJie?.instant;
 const days=Number.isFinite(instant)&&Number.isFinite(boundary)?Math.max(0,(instant-boundary)/86400000):null;
 let current=null,cumulative=0;
 for(const t of table){cumulative+=t.value[1];if(current===null&&days!==null&&Math.min(days,29.999999)<cumulative)current=t;}
 const revealed=table.map(t=>({...t,stem:t.value[0],days:t.value[1],positions:p.map((v,i)=>i!==1&&validPillar(v)&&v.stem===t.value[0]?SLOTS[i]:null).filter(Boolean)}));
 return {main:EBH[month.branch].bon[0],days,current:current?.value[0]||null,table:revealed,basis:'기존 지장간 30일 배당표: 절입 후 실제 경과일을 여기→중기→본기에 대입. 30일 이후 본기로 유지. 날짜 미상/기존 엔진에서는 사령을 추정하지 않음.'};
}
export function patternCandidates(result,rules=DEFAULT_RULES){
 const p=result?.saju?.pillars||[],day=p[1],month=p[2];if(!validPillar(day)||!validPillar(month))return null;
 const command=monthCommand(result),exposed=command.table.filter(t=>t.positions.length),chosen=rules.patternMode==='revealed'?(exposed.find(t=>p[2].stem===t.stem)||[...exposed].reverse()[0]||command.table.at(-1)):command.table.at(-1);
 const god=getSS(day.stem,chosen.stem),name=god==='비견'?'건록격':god==='겁재'?'월겁격':god+'격';
 const all=p.filter(validPillar),counts=Object.fromEntries(ELEMENTS.map(e=>[e,0]));
 for(const v of all){counts[el(v.stem)]++;counts[EB_EL[v.branchIdx]]++;}
 const total=all.length*2,dominant=ELEMENTS.reduce((a,b)=>counts[a]>=counts[b]?a:b),ratio=counts[dominant]/total;
 const external=[];
 if(all.length===4&&ratio>=.75)external.push({name:dominant===el(day.stem)?'전왕격 검토':'종격 검토',reason:`겉글자 ${total}개 중 ${counts[dominant]}개가 ${dominant} (${Math.round(ratio*100)}%). 75%는 후보 탐색용 제품 기준이며 종격 성립 확정이 아님.`});
 const dayPair=HAP.find(([a,b])=>day.stem===a||day.stem===b),partner=dayPair?.slice(0,2).find(s=>s!==day.stem);
 if(dayPair&&all.some((v,i)=>i!==1&&v.stem===partner))external.push({name:'화기격 검토',reason:`일간 ${day.stem}과 ${partner}의 합 후보. 월령·통근·쟁합·파격은 별도 확인.`});
 const applied=[];
 const exposedGods=p.filter((v,i)=>i!==1&&validPillar(v)).map(v=>getSS(day.stem,v.stem));
 for(const [a,b,n] of [['식신','편관','식신제살'],['정관','정인','관인상생'],['상관','정인','상관패인'],['식신','정재','식신생재']])if(exposedGods.includes(a)&&exposedGods.includes(b))applied.push({name:n,reason:`원국 투간 ${a}·${b} 동시 존재. 강약·제화 성공을 확정하지 않는 구성 분류.`});
 return {inner:{name,stem:chosen.stem,god,reason:`${rules.patternMode==='revealed'?'월지 투간 우선':'월지 본기'} 규칙: ${month.branch}의 ${chosen.stem} → 일간 ${day.stem} 기준 ${god}`},external,applied,command};
}
export function researchAnalysis(result,luck=[],weights=DEFAULT_WEIGHTS,rules=DEFAULT_RULES){
 const p=result?.saju?.pillars||[],day=p[1];if(!validPillar(day))return {status:'unavailable',reason:'일주를 먼저 확인하세요.'};
 const base=weightedAnalysis(p,[],weights),current=combineContributions(p,weightedAnalysis(p,luck,weights),rules),scores=current.scores,total=Object.values(scores).reduce((a,b)=>a+b,0),dayElement=el(day.stem),resource=GENERATED_BY[dayElement];
 if(total<=0)return {status:'unavailable',reason:'비중 합계가 0입니다. 분석 비중을 확인하세요.'};
 const support=(scores[dayElement]+scores[resource])/total,roots=p.flatMap((v,i)=>validPillar(v)?hidden(v).filter(([s])=>el(s)===dayElement).map(([s,n])=>({position:SLOTS[i],stem:s,days:n})):[]);
 const month=validPillar(p[2])?EB_EL[p[2].branchIdx]:null,season=month===dayElement||month===resource;
 const strength={name:support>=.6?'신강 경향':support<=.4?'신약 경향':'중화 구간',ratio:support,deukRyeong:month===null?null:season,deukJi:roots.length>0,deukSe:support>=.5,roots,basis:'신강/약: 비겁+인성의 상대 비중 ≥60% / ≤40%, 중간은 중화. 득령: 월지 오행이 비겁/인성. 득지: 원국 지장간에 일간 동오행. 득세: 비겁+인성 50% 이상. 이 임계값은 설명 가능한 제품 규칙.'};
 const eobbu=support>.6?GENERATES[dayElement]:support<.4?resource:null;
 const dominant=ELEMENTS.reduce((a,b)=>scores[a]>=scores[b]?a:b),byeong=scores[dominant]/total>=.4?dominant:null,yak=byeong?CONTROLLED_BY[byeong]:null;
 const johu=result.yongsin?.johu?.primary||null,tongwan=result.yongsin?.tongwan?.primary||null,pattern=patternCandidates(result,rules),patternElement=pattern?el(pattern.inner.stem):null;
 const yong=eobbu||johu||tongwan;
 const roles=ELEMENTS.map(e=>({element:e,role:!yong?'판정 보류':e===yong?'용':GENERATES[e]===yong?'희':CONTROLS[e]===yong?'기':CONTROLS[yong]===e?'구':'한',ratio:scores[e]/total}));
 const command=pattern?.command;
 const trueStems=command?.current?command.table.filter(t=>t.stem===command.current&&t.positions.length).map(t=>t.stem):[];
 const falseStems=command?.current?command.table.filter(t=>t.stem!==command.current&&t.positions.length).map(t=>t.stem):[];
 return {status:'ready',partial:p.some(v=>!validPillar(v)),base,current,scores,total,strength,pattern,
  cheYong:{body:day.stem,monthCommand:command?.main,current:command?.current,trueStems,falseStems},
  methods:[{name:'억부',element:eobbu,reason:`비겁+인성 ${(support*100).toFixed(1)}%: 60% 초과는 식상, 40% 미만은 인성, 중간은 보류`},{name:'조후',element:johu,reason:result.yongsin?.johu?.reason||'기존 조후 계산이 없거나 중간 구간'},{name:'통관',element:tongwan,reason:result.yongsin?.tongwan?.reason||'기존 통관 조합 없음'},{name:'병약',element:yak,reason:byeong?`${byeong} ${(scores[byeong]/total*100).toFixed(1)}% 집중(40% 이상) → 이를 극하는 ${yak}를 약 후보로 분류`:'40% 이상 집중 오행이 없어 보류'},{name:'용격',element:patternElement,reason:pattern?.inner.reason||'월주 미확인'}],roles,convention:'palja-research-v1: 설정 가능한 독립 규칙. 기존 엔진 판정과 병기하며 학파 전체의 합의나 원본 앱 산식을 뜻하지 않음.'};
}
