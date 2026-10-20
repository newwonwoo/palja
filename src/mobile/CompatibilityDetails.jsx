import React,{useState} from 'react';
import {compatibilityComposition} from './compatibility-model.js';
import {readRules} from '../vault/analysis-rules.js';
import {setAnalysisRules} from '../vault/integrated-actions.js';
export default function CompatibilityDetails({left,right,vault,change,busy}){
 const rules=readRules(vault),r=compatibilityComposition(left,right,rules.matchWeights),[draft,setDraft]=useState(()=>({...rules.matchWeights}));
 if(r.status!=='ready')return <p>{r.reason}</p>;
 const labels={same:'동일',combine:'합',clash:'충',other:'형·파·해·원진·자형'};
 return <section className="completion-box" aria-label="궁합 구성과 비중"><h3>궁합 구성 점수 · 구조 유사도 {r.structuralSimilarity.toFixed(1)} / 100</h3><p>{r.equalGlyphs}/{r.glyphs} 글자 동일 · {r.note}</p><div className="completion-grid">{Object.keys(labels).map(k=><article key={k}><h4>{labels[k]}</h4><p>{r.counts[k]}조합 · {r.composition[k]===null?'비중 없음':(r.composition[k]*100).toFixed(1)+'%'}</p></article>)}</div>
 <h4>상대 일간에 대한 십성</h4>{r.directional.map(x=><p key={x.label}>{x.label}: 시·일·월·년 천간 {x.stemGods.map(g=>g||'미확인').join(' / ')} · 본기 {x.branchGods.map(g=>g||'미확인').join(' / ')}</p>)}
 <form onSubmit={async e=>{e.preventDefault();await change(s=>setAnalysisRules(s,{matchWeights:draft}),'궁합 비중을 저장했습니다.');}}><fieldset disabled={busy}><legend>관계 구성 비중 편집</legend><div className="completion-filter">{Object.keys(labels).map(k=><label key={k}>{labels[k]}<input aria-label={'궁합 '+labels[k]+' 비중'} type="number" required min="0" max="10" step="0.1" value={draft[k]} onChange={e=>setDraft({...draft,[k]:e.target.value===''?'':Number(e.target.value)})}/></label>)}</div><button type="submit">궁합 비중 저장</button></fieldset></form>
 </section>;
}
