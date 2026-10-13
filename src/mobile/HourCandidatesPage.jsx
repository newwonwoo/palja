import React, { useMemo, useState } from 'react';
import { unknownTimeCandidates, PILLAR_SEARCH_NOTE } from './pillar-search.js';
import { getSS, getUnsung, STEM_KO, BRANCH_KO } from './engine.js';
import { PILLAR_FIELDS, pillarText } from '../vault/pillar-input.js';
import { stemColor, branchColor } from './list-utils.js';
import './pillar-input.css';
export default function HourCandidatesPage({ entry, navigate }) {
  const [selected, setSelected] = useState([]);
  const { candidates, error } = useMemo(() => {
    try { return { candidates: unknownTimeCandidates(entry.birth), error: '' }; }
    catch (failure) { return { candidates: [], error: failure.message }; }
  }, [entry.birth]);
  const toggle = index => setSelected(current => current.includes(index) ? current.filter(i => i !== index) : [...current.slice(-1), index]);
  return <section className="pi-hour-page" aria-label="미상 시각 후보 비교">
    <h1>시각 후보 비교</h1><p className="pi-lead">{entry.name} · 두 후보를 골라 비교하세요.<br/>원래 출생정보는 바꾸지 않습니다.</p>
    {error ? <p className="inline-error" role="alert">{error}</p> : <>
      <div className="pi-candidate-heading"><strong>{candidates[0]?.date} 양력</strong><span>{selected.length}/2 선택</span></div>
      <div className="pi-hour-list" role="group" aria-label="하루의 시각 후보">{candidates.map((candidate, index) => {
        const pillar = candidate.saju.pillars[0];
        return <button type="button" key={candidate.startMinute} aria-pressed={selected.includes(index)} onClick={() => toggle(index)}>
          <span>{candidate.start}–{candidate.end}</span><strong>{pillarText(pillar)}</strong><span>{getSS(candidate.saju.dayStem, pillar.stem)} · {getUnsung(candidate.saju.dayStem, pillar.branch)}</span>
        </button>;
      })}</div>
      {selected.length > 0 && <div className="pi-compare-grid" aria-label="선택한 시각 후보">{selected.map(index => {
        const candidate = candidates[index];
        return <section key={index}><h2>{candidate.start}–{candidate.end}</h2><p>비교용 후보 · 저장 안 됨</p><div className="pi-small-pillars">{candidate.saju.pillars.map((p, i) => <div key={i}><span>{PILLAR_FIELDS[i].label}</span><strong data-tone={stemColor(STEM_KO[p.stemIdx])}>{p.stem}</strong><strong data-tone={branchColor(BRANCH_KO[p.branchIdx])}>{p.branch}</strong></div>)}</div></section>;
      })}</div>}
      <p className="pi-rule-note">자시가 하루의 앞뒤로 나뉘므로 13개 구간으로 표시합니다. 후보를 선택해도 출생시각으로 확정하거나 저장하지 않습니다.</p>
    </>}
    <button type="button" className="primary full-width" onClick={() => navigate({ name: 'form', id: entry.id })}>실제 시각 확인 후 출생정보 수정</button>
    <p className="pi-footnote">{PILLAR_SEARCH_NOTE}</p>
  </section>;
}
