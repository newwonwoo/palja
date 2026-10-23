import React,{useMemo,useState} from 'react';
import {selectedPillars} from './selection-model.js';
import {getSS,EBH} from './engine.js';
import {nayinOf,gongmangOf,samjaeOf,branchPairTypes} from './traditional-reference.js';
import {classifyTenGod} from './fortune-model.js';
import {researchAnalysis,ELEMENTS} from './research-analysis.js';
import {DEFAULT_WEIGHTS} from '../vault/integrated-schema.js';
import {readRules} from '../vault/analysis-rules.js';
import {zoneAt,DEFAULT_POLICY} from '../calendar/precise.js';
export function nowSelection(policy,now=new Date()){
 const d=new Date(now.getTime()+zoneAt(now.getTime(),policy||DEFAULT_POLICY).offsetSeconds*1000);
 return {date:d.toISOString().slice(0,10),hour:d.getUTCHours(),minute:d.getUTCMinutes()};
}
export function selectionForDecade(decade,policy){
 if(Number.isFinite(decade.startInstant))return nowSelection(policy,new Date(Math.ceil(decade.startInstant/60000)*60000));
 if(!Number.isInteger(decade.startYear)||decade.startYear<1900||decade.startYear>2050)throw new Error('선택할 수 있는 대운 시작 연도가 없습니다.');
 return {date:`${decade.startYear}-07-01`,hour:12,minute:0};
}
export default function LuckExplorer({result,selection,view,policy,onSelect,busy,vault,weights}){
 const selected=useMemo(()=>selectedPillars(selection,policy),[selection,policy]);
 const [calendar,setCalendar]=useState(false),rules=readRules(vault),day=result.saju?.pillars?.[1];
 const layers=[['대운',view.decade],['세운',selected.year],['월운',selected.month],['일운',selected.day],['시운',selected.hour]];
 const current=useMemo(()=>researchAnalysis(result,layers.map(x=>x[1]),weights.enabled?weights:DEFAULT_WEIGHTS,rules),[result,selected,view.decade,weights,rules.combinationMode,rules.combinationWeight,rules.patternMode]);
 const month=selection.date.slice(0,7),[y,m]=month.split('-').map(Number);
 const days=useMemo(()=>calendar?Array.from({length:new Date(Date.UTC(y,m,0)).getUTCDate()},(_,i)=>{const date=`${month}-${String(i+1).padStart(2,'0')}`,p=selectedPillars({...selection,date},policy);return {date,p};}):[],[calendar,month,selection.hour,selection.minute,policy]);
 return <section className="completion-box" aria-label="운세 트리와 일별 분석"><h3>운세 트리 · 대운 → 세운 → 월운 → 일운 → 시운</h3>
 <button type="button" className="rr-primary-action" disabled={busy} onClick={()=>onSelect(nowSelection(policy))}>현재 운 바로가기</button>
 <div className="luck-tree">{layers.map(([label,p],i)=><div key={label} style={{paddingLeft:i*8}}><strong>{label} {p?p.stem+p.branch:'미확인'}</strong>{p&&day&&!day.unknown&&<span> · {getSS(day.stem,p.stem)} · {nayinOf(p)?.name} · {gongmangOf(day)?.empty.includes(p.branch)?'공망 지지':'공망 해당 없음'}</span>}{p&&<p>{branchPairTypes(day?.branch,p.branch).join('·')||'일지 형·파·해·원진 조합 없음'}</p>}</div>)}</div>
 <details><summary>운세 트리에서 날짜·시각 선택</summary><div className="completion-filter"><label>세운<select aria-label="트리 세운" disabled={busy} value={y} onChange={e=>{const year=+e.target.value,max=new Date(Date.UTC(year,m,0)).getUTCDate();onSelect({...selection,date:`${year}-${String(m).padStart(2,'0')}-${String(Math.min(+selection.date.slice(-2),max)).padStart(2,'0')}`});}}>{Array.from({length:151},(_,i)=>1900+i).map(year=><option key={year}>{year}</option>)}</select></label><label>월운<select aria-label="트리 월운" disabled={busy} value={m} onChange={e=>onSelect({...selection,date:`${y}-${String(e.target.value).padStart(2,'0')}-15`})}>{Array.from({length:12},(_,i)=>i+1).map(n=><option key={n}>{n}</option>)}</select></label><label>시운<select aria-label="트리 시운" disabled={busy} value={selection.hour} onChange={e=>onSelect({...selection,hour:+e.target.value})}>{Array.from({length:24},(_,i)=><option key={i} value={i}>{i}시</option>)}</select></label></div><div className="completion-filter">{(view.decades||[]).map(d=><button type="button" key={d.startYear??d.startAge} disabled={busy||!Number.isInteger(d.startYear)||d.startYear<1900||d.startYear>2050} aria-pressed={view.decade===d} onClick={()=>onSelect(selectionForDecade(d,policy))}>{d.stem}{d.branch} {d.startAge}세</button>)}</div></details>
 {selected.error&&<p role="alert">{selected.error}</p>}
 <h4>다층 운 분야별 구성</h4><p className="rr-subnote">각 운의 천간과 본기 십성을 함께 분류합니다. 분야의 강도·성과·사건 예언 점수가 아닙니다.</p><div className="completion-grid">{layers.filter(x=>x[1]).map(([label,p])=>{const stem=getSS(day?.stem,p.stem),branch=getSS(day?.stem,EBH[p.branch]?.bon[0]);return <article key={label}><h4>{label} {p.stem}{p.branch}</h4><p>{stem} · {classifyTenGod(stem)?.label||'일간 미확인'}</p><p>본기 {branch} · {classifyTenGod(branch)?.label||'미분류'}</p></article>;})}</div>
 {current.status==='ready'&&<><h4>원국 → 선택한 5계층 오행</h4><table><thead><tr><th>오행</th><th>원국 비중</th><th>원국+선택운</th></tr></thead><tbody>{ELEMENTS.map(e=><tr key={e}><th>{e}</th><td>{current.base.total?(current.base.scores[e]/current.base.total*100).toFixed(1):'0'}%</td><td>{(current.scores[e]/current.total*100).toFixed(1)}%</td></tr>)}</tbody></table><p>{current.strength.name} · {current.methods.map(x=>x.name+' '+(x.element||'보류')).join(' / ')}</p></>}
 <p>선택 연도 삼재: {samjaeOf(result.saju?.pillars?.[3]?.branch,selected.year?.branch)?.name||'미확인'} · 전통 분류이며 실제 사건을 뜻하지 않습니다.</p>
 <button type="button" onClick={()=>setCalendar(v=>!v)} aria-expanded={calendar}>일별 운세 달력 {calendar?'접기':'열기'}</button>{calendar&&<div className="completion-grid">{days.map(({date,p})=><button type="button" key={date} disabled={busy||Boolean(p.error)} aria-pressed={date===selection.date} onClick={()=>onSelect({...selection,date})}><strong>{date.slice(-2)}일 {p.day?.stem}{p.day?.branch}</strong><span> {getSS(day?.stem,p.day?.stem)} · {classifyTenGod(getSS(day?.stem,p.day?.stem))?.label||p.error}</span></button>)}</div>}
 </section>;
}
