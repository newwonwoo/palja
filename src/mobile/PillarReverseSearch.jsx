import React, { useEffect, useRef, useState } from 'react';
import { PillarInputFields, blankPillarInput } from './PillarInput.jsx';
import { findFourPillars, candidateDateSeed, PILLAR_SEARCH_NOTE } from './pillar-search.js';
import './pillar-input.css';
export default function PillarReverseSearch({ navigate, initialInput }) {
  const [input, setInput] = useState(() => initialInput ? JSON.parse(JSON.stringify(initialInput)) : blankPillarInput());
  const [start, setStart] = useState('1900-01-01'), [end, setEnd] = useState('2030-12-31');
  const [result, setResult] = useState(null), [progress, setProgress] = useState(null), [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const request = useRef(null);
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);
  const invalidate = () => { request.current?.abort(); request.current = null; setWorking(false); setResult(null); setProgress(null); setError(''); };
  const run = async event => {
    event.preventDefault(); invalidate();
    const controller = new AbortController(); request.current = controller; setWorking(true);
    try {
      const found = await findFourPillars({ input, start, end, signal: controller.signal,
        onProgress: value => { if (request.current === controller) setProgress(value); } });
      if (request.current === controller) setResult(found);
    } catch (failure) { if (request.current === controller) setError(failure.name === 'AbortError' ? '검색을 취소했습니다.' : failure.message); }
    finally { if (request.current === controller) { request.current = null; setWorking(false); } }
  };
  return <section className="pillar-reverse-page" aria-label="네 기둥 역검색">
    <h2>네 기둥으로 날짜 찾기</h2><p className="pi-lead">연·월·일·시주가 함께 일치하는 날짜와 시각 구간을 찾습니다. 시주가 미상이면 세 기둥만 비교합니다.</p>
    <form onSubmit={run}>
      <PillarInputFields prefix="역검색 " value={input} onChange={value => { invalidate(); setInput(value); }}/>
      <div className="pi-date-range"><label>시작일<input aria-label="역검색 시작일" type="date" min="1900-01-01" max="2030-12-31" required value={start} onChange={e => { invalidate(); setStart(e.target.value); }}/></label><label>종료일<input aria-label="역검색 종료일" type="date" min="1900-01-01" max="2030-12-31" required value={end} onChange={e => { invalidate(); setEnd(e.target.value); }}/></label></div>
      <button type="submit" className="primary full-width" disabled={working}>네 기둥 날짜 검색</button>
    </form>
    {working && <div className="pi-search-status"><span role="status">{progress ? `${progress.checked.toLocaleString()} / ${progress.total.toLocaleString()}일 확인` : '검색 준비 중…'}</span><button type="button" className="secondary" onClick={() => { invalidate(); setError('검색을 취소했습니다.'); }}>검색 취소</button></div>}
    {error && <p className="inline-error" role="alert">{error}</p>}
    {result && <section className="pi-results" aria-live="polite"><h3>일치하는 날짜 {result.results.length}개</h3>
      {result.truncated && <p className="notice">결과 한도 100개에 도달했습니다. 전체 결과가 아니므로 범위를 좁혀 다시 검색하세요.</p>}
      {!result.results.length && <p>이 범위에서 일치하는 날짜가 없습니다. 입력 조합과 검색 범위를 확인하세요. 전체 역법에서 불가능한 조합이라는 뜻은 아닙니다.</p>}
      <ul>{result.results.map(candidate => <li key={candidate.date}><div><strong>{candidate.date}</strong><span>{input.pillars.hour ? candidate.windows.map(w => w.start + '–' + w.end).join(' · ') : '시주 미지정 · 하루 전체'}</span><small>후보 구간 · 실제 출생시각 미확정</small></div><button type="button" className="small-button" onClick={() => navigate({ name: 'form', seedBirth: candidateDateSeed(candidate), candidateNote: '역검색 후보 날짜입니다. 후보 시각을 자동 입력하지 않았습니다. 실제 시각을 알고 있을 때만 출생시각을 입력하세요.' })}>날짜만 입력</button></li>)}</ul>
    </section>}
    <details className="pi-engine-notes"><summary>검색 기준과 지원 범위</summary><p>{PILLAR_SEARCH_NOTE}</p><p>결과는 선택한 범위의 모든 날짜를 대조합니다. 월주는 기존 엔진의 날짜 경계를 따르며, 자시의 00:00–01:29와 23:30–23:59 구간을 모두 검사합니다.</p></details>
  </section>;
}
