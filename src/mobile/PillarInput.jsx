import React, { useEffect, useRef, useState } from 'react';
import { upsertEntry } from '../vault/model.js';
import { PILLAR_FIELDS, SIXTY_PILLARS, assertPillarInput, manualBirth, pillarText, duplicateCandidates } from '../vault/pillar-input.js';
import { STEM_KO, BRANCH_KO } from './engine.js';
import { stemColor, branchColor } from './list-utils.js';
import { useUnsavedForm } from './UnsavedForm.jsx';
import { entryEditConflict, assertEntryEditCurrent } from '../vault/edit-conflicts.js';
import './pillar-input.css';
const STEMS = [...'甲乙丙丁戊己庚辛壬癸'], BRANCHES = [...'子丑寅卯辰巳午未申酉戌亥'];
export const blankPillarInput = () => ({ version: 1, pillars: { year: null, month: null, day: null, hour: null } });
const clone = value => JSON.parse(JSON.stringify(value));
export function PillarInputFields({ value, onChange, disabled = false, prefix = '' }) {
  return <div className="pi-grid" role="group" aria-label={prefix + '네 기둥 입력'}>
    {PILLAR_FIELDS.map(({ key, label }) => {
      const p = value.pillars[key], stemKo = p ? STEM_KO[STEMS.indexOf(p.stem)] : '', branchKo = p ? BRANCH_KO[BRANCHES.indexOf(p.branch)] : '';
      return <label key={key} className={'pi-column pi-' + key}><span>{label}</span>
        <span className="pi-glyph" data-tone={stemColor(stemKo)}><b>{p?.stem || '—'}</b><small>{stemKo || '천간'}</small></span>
        <span className="pi-glyph" data-tone={branchColor(branchKo)}><b>{p?.branch || '—'}</b><small>{branchKo || '지지'}</small></span>
        <select aria-label={prefix + label + ' 간지'} value={p ? pillarText(p) : ''} disabled={disabled} required={key !== 'hour'} onChange={event => {
          const selected = SIXTY_PILLARS.find(pair => pillarText(pair) === event.target.value);
          onChange({ version: 1, pillars: { ...value.pillars, [key]: selected ? { ...selected } : null } });
        }}><option value="">{key === 'hour' ? '시주 미상' : '선택'}</option>
          {SIXTY_PILLARS.map((pair, i) => <option key={i} value={pillarText(pair)}>{pillarText(pair)} {STEM_KO[i % 10]}{BRANCH_KO[i % 12]}</option>)}
        </select>
      </label>;
    })}
  </div>;
}
export function DuplicateDialog({ candidates, onCancel, onConfirm, busy }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="pi-dialog" aria-label="비슷한 명식 확인" onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}>
    <h2>비슷한 명식이 있습니다</h2><p>자동으로 합치거나 덮어쓰지 않습니다. 다른 사람이나 비교용 기록이면 별개로 저장하세요.</p>
    <ul>{candidates.map(item => <li key={item.id}><strong>{item.name}</strong><span>{item.reason}</span></li>)}</ul>
    <div className="button-row"><button type="button" className="secondary" disabled={busy} onClick={onCancel}>돌아가서 확인</button><button type="button" className="primary" disabled={busy} onClick={onConfirm}>별개 명식으로 저장</button></div>
  </dialog>;
}
export default function ManualPillarForm({ entry, vault, navigate, change, busy }) {
  const [input, setInput] = useState(() => entry?.birth.pillar_input ? clone(entry.birth.pillar_input) : blankPillarInput());
  const [name, setName] = useState(entry?.name || ''), [memo, setMemo] = useState(entry?.memo || '');
  const [sex, setSex] = useState(entry?.birth.sex || ''), [error, setError] = useState(''), [pending, setPending] = useState(null);
  const [decade,setDecade]=useState(entry?.birth.manual_daeun||null);
  const originalEntry = useRef(entry).current;
  const stale = entryEditConflict(originalEntry, entry);
  const initialBirthInput = useRef(JSON.stringify({ input, sex, decade })).current;
  const guard = useUnsavedForm({ input, name, memo, sex, decade }, busy);
  const persist = async draft => {
    const saved = await change(state => { assertEntryEditCurrent(state, originalEntry); return upsertEntry(state, draft); }, '간지 명식을 저장했습니다.');
    if (saved) { setPending(null); guard.allowLeave(); navigate({ name: 'details', id: entry?.id || saved.state.entries.at(-1).id }, true); }
  };
  const draftValue = () => ({ ...(entry ? { id: entry.id } : {}), name: name.trim(), memo, ...(entry && JSON.stringify({ input, sex, decade }) === initialBirthInput ? {} : { birth: {...manualBirth(input, sex || null),manual_daeun:decade} }) });
  const save = async event => {
    event.preventDefault(); setError('');
    if (stale) return;
    try {
      const draft = draftValue();
      if (!draft.name) throw new Error('이름을 입력해 주세요.');
      const duplicates = duplicateCandidates(vault, { ...draft, birth: draft.birth || entry?.birth });
      if (duplicates.length) setPending({ draft, duplicates }); else await persist(draft);
    } catch (failure) { setError(failure.message); }
  };
  const search = () => {
    try { assertPillarInput(input); setError(''); navigate({ name: 'tools', tab: 'reverse', pillarInput: clone(input) }); }
    catch (failure) { setError(failure.message); }
  };
  return <section className="pillar-input-page">
    {stale && <section className="panel" role="alert"><p>다른 화면에서 이 명식이 {entry?.deletedAt ? '삭제' : '변경'}되었습니다. 작성 중인 내용은 유지되며 덮어쓰지 않습니다.</p><button type="button" onClick={() => navigate(entry?.deletedAt ? {name:'vault'} : {name:'form',id:entry.id,editSession:crypto.randomUUID()}, true)}>{entry?.deletedAt ? '보관함으로 이동' : '최신 내용으로 다시 열기'}</button></section>}
    {!entry && <nav className="pi-mode-tabs" aria-label="명식 입력 방식"><button type="button" onClick={() => navigate({ name: 'form' }, true)}>생년월일</button><button type="button" aria-current="page">간지 직접</button></nav>}
    <h1>{entry ? '간지 명식 수정' : '간지 직접 입력'}</h1>
    <p className="pi-lead">생일 대신 네 기둥을 입력합니다.<br/>모르는 시주는 비워 두세요.</p>
    <form onSubmit={save}><fieldset className="pi-fields" disabled={busy || Boolean(pending) || stale}>
      <PillarInputFields value={input} onChange={setInput}/>
      <div className="pi-rule-note"><strong>날짜를 임의로 만들지 않습니다</strong><p>육십갑자 조합만 검사합니다. 실제 날짜에 해당하는 명식인지는 역검색으로 확인하세요. 생일이 없으므로 현재 나이·정확한 대운 기산일은 계산하지 않습니다. 대운수는 알고 있는 값을 별도로 입력할 수 있습니다.</p></div>
      <label className="pi-field">이름<input aria-label="간지 명식 이름" value={name} maxLength={200} required onChange={event => setName(event.target.value)} placeholder="이름 또는 연구용 별칭"/></label>
      <label className="pi-field">성별<select aria-label="간지 명식 성별" value={sex} onChange={event => setSex(event.target.value)}><option value="">미확인</option><option value="male">남성</option><option value="female">여성</option></select></label>
      <section className="integration-manual-decade"><label className="rr-check"><input type="checkbox" aria-label="대운수 직접 지정" checked={Boolean(decade)} onChange={e=>setDecade(e.target.checked?{version:1,direction:'forward',startAge:0,startYear:null}:null)}/>대운수 직접 지정</label>{decade&&<><div className="integration-grid2"><label>첫 대운 나이<input aria-label="첫 대운 나이" type="number" min="0" max="120" step="0.01" required value={decade.startAge} onChange={e=>setDecade(d=>({...d,startAge:e.target.value===''?'':Number(e.target.value)}))}/></label><label>방향<select aria-label="직접 대운 방향" value={decade.direction} onChange={e=>setDecade(d=>({...d,direction:e.target.value}))}><option value="forward">순행</option><option value="backward">역행</option></select></label></div><label>첫 대운 연도 · 모르면 비움<input aria-label="첫 대운 연도" type="number" min="1900" max="2050" value={decade.startYear??''} onChange={e=>setDecade(d=>({...d,startYear:e.target.value===''?null:Number(e.target.value)}))}/></label><p className="muted">월주 다음 또는 이전 간지부터 10개 대운을 만듭니다. 연도를 비우면 대운 나이표만 표시하며 특정 해의 대운으로 확정하지 않습니다.</p></>}</section>
      <label className="pi-field">메모<textarea aria-label="간지 명식 메모" value={memo} maxLength={20000} rows={3} onChange={event => setMemo(event.target.value)} placeholder="출처, 비교 목적, 판단 근거"/></label>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <button type="submit" className="primary full-width">{busy ? '저장 중…' : '간지 명식 저장'}</button>
      <button type="button" className="secondary full-width pi-search-button" onClick={search}>이 네 기둥으로 날짜 찾기</button>
      <p className="pi-footnote">역검색은 현재 입력한 간지만 전달합니다. 이름과 메모는 저장 버튼을 눌러야 보관됩니다.</p>
    </fieldset></form>
    {pending && <DuplicateDialog candidates={pending.duplicates} busy={busy} onCancel={() => setPending(null)} onConfirm={() => persist(pending.draft)}/>}
    {guard.dialog}
  </section>;
}
