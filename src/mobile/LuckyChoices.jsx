import React from 'react';
import {CHOICE_METHODS,luckyChoice} from './lucky-choice.js';
import {readRules} from '../vault/analysis-rules.js';
import {setAnalysisRules} from '../vault/integrated-actions.js';
export default function LuckyChoices({analysis,vault,change,busy}){
 const rules=readRules(vault),choice=luckyChoice(analysis,rules.luckyMethod);
 return <section className="completion-box" aria-label="행운 선택 기준과 근거"><h4>행운 선택 정보</h4><label className="display-field">선택 기준<select aria-label="행운 선택 기준" value={rules.luckyMethod} disabled={busy} onChange={e=>change(s=>setAnalysisRules(s,{luckyMethod:e.target.value}),'행운 선택 기준을 저장했습니다.')}>{CHOICE_METHODS.map(m=><option key={m}>{m}</option>)}</select></label>
 {choice.status==='ready'?<><p><strong>{choice.method} 기준 · {choice.element}</strong></p><div className="completion-grid"><article><h4>색</h4>{choice.color}</article><article><h4>방향</h4>{choice.direction}</article><article><h4>계절</h4>{choice.season}</article><article><h4>전통 대응수</h4>{choice.numbers.join(' · ')}</article></div><p>{choice.reason}</p><p className="rr-subnote">{choice.basis}</p><a href={choice.source} target="_blank" rel="noreferrer">하도 대응표 근거</a></>:<p role="status">{choice.reason}</p>}
 </section>;
}
