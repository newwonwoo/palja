import React,{useMemo,useState} from 'react';
import {FORTUNE_AREAS,fortuneMonthTimeline,areaMonths} from './fortune-model.js';
import {STEM_KO,BRANCH_KO,HS,EB} from './engine.js';
import './fortune-timeline.css';
const ko=p=>p?STEM_KO[HS.indexOf(p.stem)]+BRANCH_KO[EB.indexOf(p.branch)]:null;
export default function FortuneTimeline({result,year,policy,onSelect,busy}){
 const [area,setArea]=useState('all');
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
   <p className="ft-foot">{timeline.explanation} 월을 누르면 해당 날짜 12:00로 일·시운을 변경합니다. 저장된 출생정보는 바뀌지 않습니다.</p>
  </>}
 </section>;
}
