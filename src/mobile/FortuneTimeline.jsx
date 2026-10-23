import {readRules} from '../vault/analysis-rules.js';
import {DEFAULT_WEIGHTS} from '../vault/integrated-schema.js';
import React,{useMemo,useState} from 'react';
import {FORTUNE_AREAS,fortuneMonthTimeline,areaMonths,elementMonthTimeline} from './fortune-model.js';
import {STEM_KO,BRANCH_KO,HS,EB} from './engine.js';
import './fortune-timeline.css';
const ko=p=>p?STEM_KO[HS.indexOf(p.stem)]+BRANCH_KO[EB.indexOf(p.branch)]:null;
export default function FortuneTimeline({result,year,policy,onSelect,busy,vault,weights}){
 const [area,setArea]=useState('all');
 const rules=readRules(vault||{});
 const series=useMemo(()=>elementMonthTimeline(result,year,policy,weights?.enabled?weights:DEFAULT_WEIGHTS,rules),[result,year,policy,weights,rules.combinationMode,rules.combinationWeight,rules.patternMode]);
 const timeline=useMemo(()=>fortuneMonthTimeline(result,year,policy),[result,year,policy]);
 const focus=FORTUNE_AREAS.find(a=>a.id===area);
 const matching=area==='all'?timeline.months:areaMonths(timeline,area);
 return <section className="ft-root" aria-label="분야별 월운 흐름"><header className="ft-header"><h2>분야별 월운 흐름</h2><span>{year}년</span></header>
  <p className="ft-note">십성에 따른 월별 관심 분야를 보여줍니다. 점수·예언 대신 계산된 간지와 근거만 표시합니다.</p>
  {timeline.status!=='ready'?<p role="status">{timeline.reason}</p>:<>
   <div role="group" aria-label="관심 분야 필터" className="ft-filters"><button type="button" aria-pressed={area==='all'} onClick={()=>setArea('all')}>전체</button>{FORTUNE_AREAS.map(a=><button type="button" key={a.id} aria-pressed={area===a.id} onClick={()=>setArea(a.id)}>{a.label}</button>)}</div>
   {focus&&<p className="ft-explanation">{focus.explanation}</p>}
   <div className="ft-months">{matching.map(m=><button type="button" key={m.month} disabled={busy||Boolean(m.error)} aria-label={`${m.month}월 ${m.error||m.god+' '+ko(m.pillar)} 선택`} onClick={()=>onSelect({date:m.date,hour:12,minute:0})}>
     <span className="ft-month">{m.month}월</span><strong>{ko(m.pillar)||'—'}</strong><small>{m.god||'계산 불가'}</small><em>{FORTUNE_AREAS.find(a=>a.id===m.focusId)?.label||'미분류'}</em>
     {(m.dayBranchRelations||[]).length>0&&<small>일지 {m.dayBranchRelations.join('·')}</small>}
   </button>)}</div>
   {!matching.length&&<p role="status" className="ft-explanation">선택한 분야의 천간 십성은 이 표본 월에 없습니다. 다른 분야 또는 전체를 선택하세요.</p>}
   <details className="completion-box"><summary>월별 오행 비율 타임라인</summary><p>각 월 15일 12시의 원국+대운·세운·월운·일운·시운 상대 비중입니다. 정밀 절입 경계나 운세 성과를 나타내는 선이 아닙니다.</p><svg viewBox="0 0 360 180" role="img" aria-label="12개월 오행 비율 변화"><path d="M20 10V155H350" fill="none" stroke="#aaa"/>{[['木','#39764e'],['火','#b8463f'],['土','#97722a'],['金','#777'],['水','#326d9c']].map(([e,color])=><polyline key={e} fill="none" stroke={color} strokeWidth="2" points={series.filter(x=>x.ratios).map(x=>`${20+(x.month-1)*30},${155-x.ratios[e]*140}`).join(' ')}/>)}{series.map(x=><text key={x.month} x={20+(x.month-1)*30} y="174" textAnchor="middle" fontSize="10">{x.month}</text>)}</svg><table><thead><tr><th>월</th>{[...'木火土金水'].map(e=><th key={e}>{e}</th>)}</tr></thead><tbody>{series.map(x=><tr key={x.month}><th>{x.month}</th>{[...'木火土金水'].map(e=><td key={e}>{x.ratios?(x.ratios[e]*100).toFixed(1)+'%':'—'}</td>)}</tr>)}</tbody></table></details>
   <p className="ft-foot">{timeline.explanation} 월을 누르면 해당 날짜 12:00로 일·시운을 변경합니다. 저장된 출생정보는 바뀌지 않습니다.</p>
  </>}
 </section>;
}
