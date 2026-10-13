import React, { useEffect, useMemo, useState } from 'react';
import { deleteEntry, setSelf, toggleFavorite, upsertEntry } from '../vault/model.js';
import { calculateEntry, birthSummary, STEM_KO, BRANCH_KO, EBH, getSS, getUnsung } from './engine.js';
import { ageBadge, referenceBirthLabel, stemColor, branchColor } from './list-utils.js';
import { chartSlots, displayCertainty, isSourceDayDifferent, normalizeElementScores } from './detail-view-model.js';
import './reference-detail.css';

const dateLabel = date => date ? new Date(date).toLocaleDateString('ko-KR') : '—';
const DAY_TAB = 'chart';

function DetailIcon({ name, size = 22, filled = false }) {
  const paths = {
    star: <path d="m12 2.5 3 6.3 7 .9-5.1 5 1.2 7-6.1-3.2-6.2 3.2 1.2-7-5-5 7-.9z" />,
    pencil: <><path d="m4 17 12-12 3 3-12 12-4 1z" /><path d="m14 7 3 3" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7.5h.01" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function PillarTable({ entry, result }) {
  const slots = chartSlots(entry, result);
  const hasReference = slots.some(slot => slot.kind === 'reference');
  return <section className="rd-card rd-chart-card" aria-label="사주 명식표">
    <div className="rd-section-heading"><h2>사주 명식</h2><span>{result?.saju ? '기존 계산기 산식' : '저장된 원문 기준'}</span></div>
    <div className="rd-table" role="table" aria-label="시주 일주 월주 년주 명식">
      <div className="rd-table-labels" role="row">{slots.map(slot => <div key={slot.label} role="columnheader" className={slot.index === 1 ? 'rd-dayfocus' : ''}>{slot.label}주</div>)}</div>
      <div className="rd-cells rd-ten-gods" role="row">{slots.map(slot => <div key={slot.label} role="cell">{slot.kind === 'calculated' ? slot.index === 1 ? '일간' : getSS(result.saju.dayStem, slot.pillar.stem) : '—'}</div>)}</div>
      <div className="rd-cells rd-stems" role="row">{slots.map(slot => {
        const ko = slot.kind === 'calculated' ? STEM_KO[slot.pillar.stemIdx] : slot.stem || '—';
        const hanja = slot.kind === 'calculated' ? slot.pillar.stem : null;
        const tone = slot.kind !== 'unknown' ? stemColor(ko) : 'unknown';
        return <div key={slot.label} role="cell" className={'rd-char-cell ' + (slot.index === 1 ? 'rd-dayfocus' : '')} data-tone={tone} aria-label={slot.label + '주 천간 ' + ko}><strong>{hanja || ko}</strong><small>{hanja ? ko : slot.kind === 'reference' ? '원본' : '미확인'}</small></div>;
      })}</div>
      <div className="rd-cells rd-branches" role="row">{slots.map(slot => {
        const ko = slot.kind === 'calculated' ? BRANCH_KO[slot.pillar.branchIdx] : slot.branch || '—';
        const hanja = slot.kind === 'calculated' ? slot.pillar.branch : null;
        const tone = slot.kind !== 'unknown' ? branchColor(ko) : 'unknown';
        return <div key={slot.label} role="cell" className={'rd-char-cell ' + (slot.index === 1 ? 'rd-dayfocus' : '')} data-tone={tone} aria-label={slot.label + '주 지지 ' + ko}><strong>{hanja || ko}</strong><small>{hanja ? ko : slot.kind === 'reference' ? '원본' : '미확인'}</small></div>;
      })}</div>
      <div className="rd-cells rd-ten-gods" role="row">{slots.map(slot => <div key={slot.label} role="cell">{slot.kind === 'calculated' ? getUnsung(result.saju.dayStem, slot.pillar.branch) : '—'}</div>)}</div>
      <div className="rd-cells rd-hidden-stems" role="row">{slots.map(slot => <div key={slot.label} role="cell">{slot.kind === 'calculated' ? ['yo', 'jung', 'bon'].map(key => EBH[slot.pillar.branch]?.[key]?.[0]).filter(Boolean).join(' · ') || '—' : '—'}</div>)}</div>
    </div>
    <div className="rd-chart-legend"><span><i data-tone="wood" />목</span><span><i data-tone="fire" />화</span><span><i data-tone="earth" />토</span><span><i data-tone="metal" />금</span><span><i data-tone="water" />수</span></div>
    {hasReference && <p className="rd-source-note">일주에 ‘원본’이라고 표시되면 가져온 화면의 문자이며, 계산으로 확인된 값이 아닙니다.</p>}
  </section>;
}

function AnalysisTab({ result, navigate, entry }) {
  const scores = normalizeElementScores(result.strength?.elementScores);
  return <div className="rd-tab-panel" role="tabpanel" id="rd-panel-analysis" aria-labelledby="rd-tab-analysis">
    <section className="rd-card">
      <div className="rd-section-heading"><h2>오행 분포</h2><span>{result.strength?.strength || '계산 정보 미확인'}</span></div>
      {scores.length ? <div className="rd-element-list">{scores.map(item => <div className="rd-element-row" key={item.key}><span className="rd-element-symbol" data-tone={item.tone}>{item.key}</span><span className="rd-element-name">{item.name}</span><div className="rd-meter" aria-label={`${item.name} ${item.percentage}%`}><i data-tone={item.tone} style={{width:item.percentage+'%'}} /></div><strong>{item.percentage}%</strong></div>)}</div>
        : <p className="rd-empty-analysis">입력정보가 확인되면 오행 결과를 이곳에 보여줍니다. 미확인 시각을 자정으로 가정하지 않습니다.</p>}
      {scores.length > 0 && <p className="rd-subnote">기존 계산기의 상대 점수를 환산한 분포입니다. 정확한 천문학적 검증은 별도로 필요합니다.</p>}
    </section>
    <section className="rd-card"><div className="rd-section-heading"><h2>용신 분석</h2><span>기존 계산기 기준</span></div>
      <div className="rd-yongsin-grid">{[['억부','eobbu'], ['조후','johu'], ['통관','tongwan']].map(([name,key]) => <div key={key}><span>{name}</span><strong>{result.yongsin?.[key]?.primary || '—'}</strong>{result.yongsin?.[key]?.reason && <details><summary>판정 근거</summary><p>{result.yongsin[key].reason}</p></details>}</div>)}</div>
      {!result.yongsin && <p className="rd-subnote">출생시각과 입력 기준을 먼저 확인해야 합니다.</p>}
    </section>
    <section className="rd-card"><div className="rd-section-heading"><h2>대운</h2><span>10년 운 흐름 · 기존 산식</span></div>
      {result.daeun?.length ? <div className="rd-daeun-strip" aria-label="대운 목록">{result.daeun.map((luck,index) => <div className="rd-daeun" key={luck.startAge + '-' + index}><span>{luck.startAge}세</span><strong>{luck.stem}<br />{luck.branch}</strong><small>{luck.startYear}년</small></div>)}</div> : <p className="rd-empty-analysis">{entry.birth.sex !== 'male' && entry.birth.sex !== 'female' ? '성별 확인 후 대운 방향을 계산합니다.' : result.status !== 'ready' ? '출생시각 확인 후 표시합니다.' : '기존 산식이 이 날짜의 대운을 계산하지 못했습니다. 임의 값으로 채우지 않습니다.'}</p>}
    </section>
    {result.legacyForm && <button type="button" className="rd-open-legacy" onClick={() => navigate({name:'analysis',id:entry.id})}><span><strong>기존 상세 분석 열기</strong><small>현재 사이트의 추가 해석 기능을 그대로 사용합니다.</small></span><DetailIcon name="chevron" size={20}/></button>}
  </div>;
}

function MemoTab({ entry, memo, setMemo, change, busy, navigate, setConfirmDelete }) {
  return <div className="rd-tab-panel" role="tabpanel" id="rd-panel-memo" aria-labelledby="rd-tab-memo">
    <section className="rd-card"><div className="rd-section-heading"><h2>나의 메모</h2><span>{memo.length.toLocaleString()} / 20,000자</span></div>
      <textarea className="rd-memo" aria-label="명식 메모" rows={5} disabled={busy} maxLength={20000} placeholder="관계, 상담 기록, 기억해 둘 이야기" value={memo} onChange={e=>setMemo(e.target.value)}/>
      <button type="button" className="rd-primary" disabled={busy || memo === entry.memo} onClick={()=>change(state=>upsertEntry(state,{id:entry.id,memo}), '메모를 저장했습니다.')}>메모 저장</button>
      {memo !== entry.memo && <p className="rd-subnote">수정된 내용은 ‘메모 저장’을 눌러야 보관됩니다.</p>}
    </section>
    {entry.source && <details className="rd-card rd-origin"><summary>가져온 원본 정보 <DetailIcon name="chevron" size={17}/></summary><dl>
      <div><dt>원본 일주</dt><dd>{(entry.referenceDisplay?.day_stem_ko||'—') + (entry.referenceDisplay?.day_branch_ko||'—')}</dd></div>
      <div><dt>원본 시각 보정</dt><dd>{entry.birth.correction_raw || '표시 없음'}</dd></div>
      <div><dt>출생정보 수정 기록</dt><dd>{entry.birthRevisions?.length ?? 0}회</dd></div>
    </dl></details>}
    <section className="rd-card rd-record-tools"><div className="rd-section-heading"><h2>기록 관리</h2></div><p>등록일 {dateLabel(entry.createdAt)} · 수정일 {dateLabel(entry.updatedAt)}</p>
      <button type="button" className="rd-tool" onClick={()=>navigate({name:'form',id:entry.id})}>입력정보 수정 <DetailIcon name="chevron" size={18}/></button>
      <button type="button" className="rd-tool rd-delete" disabled={busy} onClick={()=>setConfirmDelete(true)}>명식을 휴지통으로 이동 <DetailIcon name="chevron" size={18}/></button>
    </section>
  </div>;
}

export default function ReferenceDetail({ entry, vault, navigate, change, busy }) {
  const [tab, setTab] = useState(DAY_TAB);
  const [memo, setMemo] = useState(entry.memo);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const result = useMemo(()=>calculateEntry(entry),[entry.birth,entry.name]);
  const status = displayCertainty(entry,result);
  const age = ageBadge(entry);
  const mismatch = isSourceDayDifferent(entry,result,STEM_KO,BRANCH_KO);
  const isSelf = vault.selfId === entry.id;
  useEffect(()=>{setMemo(entry.memo)},[entry.memo]);
  const actions = [['chart','명식표'],['analysis','해석·대운'],['memo','메모·관리']];
  return <div className="reference-detail" data-testid="reference-detail">
    <section className="rd-summary"><div className="rd-summary-top"><span className="rd-kicker">{isSelf?'me · 내 명식':'명식 보관함'}</span><span className="rd-offline"><i/>오프라인 저장</span></div>
      <div className="rd-person-name"><span className={'rd-age '+(entry.referenceDisplay?.badge_color||'neutral')} title={age.captured?'원본 화면에 표시된 나이':'양력 생일 기준 만나이'}>{age.text}</span><h1>{entry.name}</h1><button type="button" className={'rd-star '+(entry.favorite?'selected':'')} aria-label={entry.name+(entry.favorite?' 즐겨찾기 해제':' 즐겨찾기 추가')} aria-pressed={entry.favorite} disabled={busy} onClick={()=>change(state=>toggleFavorite(state,entry.id))}><DetailIcon name="star" filled={entry.favorite} size={24}/></button></div>
      <p className="rd-birth-raw">{referenceBirthLabel(entry)}</p><p className="rd-birth-type">{birthSummary(entry.birth)}</p>
      <div className="rd-person-actions"><button type="button" onClick={()=>navigate({name:'form',id:entry.id})}><DetailIcon name="pencil" size={16}/>입력정보 수정</button><button type="button" disabled={busy} onClick={()=>change(state=>setSelf(state,isSelf?null:entry.id),'나의 명식 설정을 변경했습니다.')}><DetailIcon name="check" size={16}/>{isSelf?'내 명식 해제':'내 명식 지정'}</button></div>
    </section>
    <div className="rd-status" data-tone={status.tone}><DetailIcon name="info" size={19}/><div><strong>{status.title}</strong><p>{status.body}</p>{result.status==='needs_confirmation'&&<button type="button" onClick={()=>navigate({name:'form',id:entry.id})}>입력 기준 확인 →</button>}</div></div>
    {mismatch && <div className="rd-status" data-tone="warning"><DetailIcon name="info" size={19}/><div><strong>원본 일주와 계산 결과가 다릅니다</strong><p>원본 기록은 보존했습니다. 양력·음력, 시각 보정과 날짜를 확인해 주세요.</p></div></div>}
    <div className="rd-tabbar" role="tablist" aria-label="명식 상세 분류">{actions.map(([key,label])=><button key={key} id={'rd-tab-'+key} type="button" role="tab" aria-selected={tab===key} aria-controls={'rd-panel-'+key} className={tab===key?'active':''} onClick={()=>setTab(key)}>{label}{key==='memo'&&memo!==entry.memo?' •':''}</button>)}</div>
    {tab==='chart' && <div className="rd-tab-panel" role="tabpanel" id="rd-panel-chart" aria-labelledby="rd-tab-chart"><PillarTable entry={entry} result={result}/><section className="rd-card rd-advisory"><h2>계산 결과 확인</h2><p>현재 명식표는 보관한 원본과 기존 사주 계산기를 구분하여 보여줍니다. 절입 시각·한국 역사적 표준시·서머타임·경도 및 야자시 보정은 8자어때와 같다고 검증되지 않았습니다.</p>{result.saju?.lunar && <p className="rd-calendar-hint">기존 계산기 음력 표기: {result.saju.lunar.year}년 {result.saju.lunar.month}월 {result.saju.lunar.day}일{result.saju.lunar.isLeap?' (윤달)':''}</p>}<button type="button" className="rd-next" onClick={()=>setTab('analysis')}>오행과 대운 보기 <DetailIcon name="chevron" size={17}/></button></section></div>}
    {tab==='analysis' && <AnalysisTab result={result} entry={entry} navigate={navigate}/>} 
    {tab==='memo' && <MemoTab entry={entry} memo={memo} setMemo={setMemo} navigate={navigate} busy={busy} change={change} setConfirmDelete={setConfirmDelete}/>} 
    {confirmDelete && <div className="rd-confirm-mask" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setConfirmDelete(false);}}><section className="rd-confirm" role="alertdialog" aria-modal="true" aria-label="명식 삭제 확인" aria-describedby="rd-delete-explain"><h2>명식을 삭제할까요?</h2><p id="rd-delete-explain">{entry.name} 명식을 휴지통으로 옮깁니다. 설정에서 다시 복원할 수 있습니다.</p><div><button type="button" onClick={()=>setConfirmDelete(false)} disabled={busy}>취소</button><button type="button" className="danger" disabled={busy} onClick={async()=>{const saved=await change(state=>deleteEntry(state,entry.id),'휴지통으로 옮겼습니다.');if(saved)navigate({name:'vault'},true);}}>휴지통으로</button></div></section></div>}
  </div>;
}
