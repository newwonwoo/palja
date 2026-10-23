import { noteEditConflict, assertNoteEditCurrent, assertMemoEditCurrent } from '../vault/edit-conflicts.js';
import {readRules} from '../vault/analysis-rules.js';
import {setAnalysisRules} from '../vault/integrated-actions.js';
import {researchAnalysis} from './research-analysis.js';
import {DEFAULT_WEIGHTS} from '../vault/integrated-schema.js';
import CompatibilityDetails from './CompatibilityDetails.jsx';
import DaeunSetup from './DaeunSetup.jsx';
import ResearchPanel from './ResearchPanel.jsx';
import LuckExplorer,{nowSelection,selectionForDecade} from './LuckExplorer.jsx';
import {readPresentation} from '../vault/presentation.js';
import Journal from './Journal.jsx';
import WeightEditor from './WeightEditor.jsx';
import SelectionTools from './SelectionTools.jsx';
import FortuneTimeline from './FortuneTimeline.jsx';
import ChartExport from './ChartExport.jsx';
import {integrated,saveNote,rememberSelection,selectionForEntry} from '../vault/integrated-actions.js';
import {selectedPillars,selectionForYear,preciseLuckView} from './selection-model.js';
import { compareIndependentEngines } from './engine-crosscheck.js';
import { compareChartFacts, similarChartFacts } from './compatibility-model.js';
import './integration.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { deleteEntry, setSelf, toggleFavorite, upsertEntry } from '../vault/model.js';
import { calculateEntry, birthSummary, STEM_KO, BRANCH_KO } from './engine.js';
import { referenceBirthLabel } from './list-utils.js';
import { displayCertainty, isSourceDayDifferent } from './detail-view-model.js';
import { safeYear, luckView, sixColumns, glyphInfo, pillarLabels } from './reader-model.js';
import { ReaderIcon, SixPillars, LuckRails } from './ReaderTiles.jsx';
import { AnalysisOverview, RelationSection, ShinsalGrid } from './ReaderAnalysis.jsx';
import './reference-reader.css';
import { readPreferences } from '../vault/workspace.js';
import { savePreferences } from '../vault/workspace-actions.js';

const PANELS=[['overview','분석'],['relations','사주'],['luck','운세'],['compare','궁합']];
function ReaderDialog({title,children,onClose,busy=false}) {
  const ref=useRef(null);
  useEffect(()=>{const d=ref.current;d.showModal();return()=>d.close()},[]);
  return <dialog className="rr-dialog" ref={ref} aria-label={title} onCancel={e=>{e.preventDefault();if(!busy)onClose();}} onClick={e=>{if(e.target===e.currentTarget&&!busy)onClose();}}>
    <header><h2>{title}</h2><button type="button" aria-label="창 닫기" disabled={busy} onClick={onClose}><ReaderIcon name="close"/></button></header>{children}
  </dialog>;
}
function ComparePanel({entry,vault,result,onInspect,onOpen,initialCompareId,change,busy}) {
  const [otherId,setOtherId]=useState(initialCompareId||'');
  const [showSimilar,setShowSimilar]=useState(false);
  const [similarFilter,setSimilarFilter]=useState('any');
  const other=vault.entries.find(e=>e.id===otherId&&!e.deletedAt);
  const otherResult=useMemo(()=>other?calculateEntry(other):null,[other]);
  const facts=useMemo(()=>otherResult?compareChartFacts(result,otherResult):null,[result,otherResult]);
  const similar=useMemo(()=>showSimilar?similarChartFacts(result,vault.entries.filter(e=>e.id!==entry.id&&!e.deletedAt),calculateEntry,50,{condition:similarFilter}):[],[showSimilar,result,vault.entries,entry.id,similarFilter]);
  const empty=useMemo(()=>luckView(result,new Date().getFullYear()),[result]);
  return <section className="rr-compare-panel"><h2>두 명식의 확인 가능한 관계</h2><p className="rr-subnote">독립 관계표로 일간·일지·월지를 비교합니다. 궁합 점수나 좋고 나쁨을 계산하지 않습니다.</p>
    <label>비교할 명식<select aria-label="비교할 명식" value={otherId} onChange={e=>setOtherId(e.target.value)}><option value="">선택하세요</option>{vault.entries.filter(e=>e.id!==entry.id&&!e.deletedAt).map(e=><option value={e.id} key={e.id}>{e.name}</option>)}</select></label>
    {[{e:entry,r:result},{e:other,r:otherResult}].filter(x=>x.e&&x.r).map(({e,r})=><section key={e.id} className="rr-compare-card"><h3>{e.name}</h3><p>{birthSummary(e.birth)}</p><SixPillars display={readPresentation(vault)} columns={sixColumns(e,r,empty,false).slice(2)} dayStem={r.saju?.dayStem} onInspect={(c,p)=>onInspect({...c,inspectionDayStem:r.saju?.dayStem},p)}/></section>)}
    {facts&&(facts.status==='ready'?<section className="integration-compare-facts" aria-label="명식 상호관계"><h3>일주 {facts.dayPillars.join(' ↔ ')}</h3><p>비교 가능한 기둥 {facts.comparablePillars}개 · 글자 전체가 같은 기둥 {facts.samePillars}개</p>{facts.facts.length?<ul>{facts.facts.map((fact,i)=><li key={fact.name+i}><strong>{fact.name}</strong><span>{fact.description}</span></li>)}</ul>:<p>현재 연결된 조견표에서 일주·월지 조합이 발견되지 않았습니다. 관계가 없다는 뜻은 아닙니다.</p>}<small>{facts.note}</small></section>:<p className="rr-subnote">{facts.reason}</p>)}
    {otherResult&&<CompatibilityDetails left={result} right={otherResult} vault={vault} change={change} busy={busy}/>}
    <section className="integration-compare-facts"><h3>보관함에서 비슷한 기둥 찾기</h3><button type="button" className="rr-primary-action" onClick={()=>setShowSimilar(v=>!v)}>{showSimilar?'검색 결과 닫기':'저장된 명식의 공통 글자 검색'}</button>
      {showSimilar&&<label>유사 조건<select aria-label="유사 조건" value={similarFilter} onChange={e=>setSimilarFilter(e.target.value)}>{[['any','전체'],['daySame','일주 동일'],['stemSame','일간 동일'],['branchSame','일지 동일'],['monthSame','월지 동일']].map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></label>}{showSimilar&&(similar.length?<ul className="integration-similar-list">{similar.map(item=><li key={item.entryId}><button type="button" onClick={()=>onOpen(item.entryId)}><strong>{item.name}</strong><span>{item.daySame?'일주 동일 · ':''}{item.stemSame?'일간 동일 · ':''}{item.branchSame?'일지 동일 · ':''}{item.monthSame?'월지 동일 · ':''}일치 기둥 {item.equalPillars}/{item.compared}</span></button></li>)}</ul>:<p>비교 가능한 다른 명식이 없습니다.</p>)}
      <p className="rr-subnote">전체 보관함을 조건으로 검색하고 일치도순 최대 50명을 표시합니다. 유사도는 글자의 형태 비교입니다. 운명·성격·궁합의 유사성을 보증하지 않습니다.</p>
    </section>
  </section>;
}
export default function ReferenceReader({entry,vault,navigate,change,busy,initialCompareId}) {
  const result=useMemo(()=>calculateEntry(entry),[entry.birth,entry.name]);
  const crosscheck=useMemo(()=>compareIndependentEngines(entry),[entry.birth]);
  const [screen,setScreen]=useState(initialCompareId?'reading':'chart'),[panel,setPanel]=useState(initialCompareId?'compare':'overview');
  const display=readPresentation(vault);
  const panels=display.tabOrder.map(key=>PANELS.find(p=>p[0]===key));
  const [year,setYear]=useState(()=>safeYear(selectionForEntry(vault,entry.id)?Number(selectionForEntry(vault,entry.id).date.slice(0,4)):new Date().getFullYear()));
  const [yearDraft,setYearDraft]=useState(String(year)),[selectedMonth,setSelectedMonth]=useState(null);
  const {hanja,large,includeLuck}=readPreferences(vault);
  const setHanja=hanja=>change(state=>savePreferences(state,{hanja}));
  const setLarge=large=>change(state=>savePreferences(state,{large}));
  const setIncludeLuck=includeLuck=>change(state=>savePreferences(state,{includeLuck}));
  const [journalDraft,setJournalDraft]=useState(null),[journalWorking,setJournalWorking]=useState(false),[journalOriginal,setJournalOriginal]=useState(null);
  const [selection,setSelection]=useState(()=>selectionForEntry(vault,entry.id)||{entryId:entry.id,date:new Date(Date.now()+9*3600000).toISOString().slice(0,10),hour:12,minute:0});
  const weights=integrated(vault).weights;
  const rules=readRules(vault);
  const selected=useMemo(()=>selectedPillars(selection,entry.birth.calculation_policy),[selection,entry.birth.calculation_policy]);
  const [memo,setMemo]=useState(entry.memo),[dialog,setDialog]=useState(null),[pendingLeave,setPendingLeave]=useState(null);
  const view=useMemo(()=>{const v=luckView(result,year);return preciseLuckView(v,result,selected,entry.birth.calculation_policy);},[result,year,selected]);
  const research=useMemo(()=>researchAnalysis(result,includeLuck?[view.decade,selected.year,selected.month,selected.day,selected.hour]:[],weights.enabled?weights:DEFAULT_WEIGHTS,rules),[result,view.decade,selected,includeLuck,weights,rules.combinationMode,rules.combinationWeight,rules.patternMode]);
  const weighted=research.status==='ready'?research.current:null;
  const analysisResult=weighted?{...result,strength:{...result.strength,elementScores:weighted.scores},weighted}:result;
  const columns=useMemo(()=>sixColumns(entry,result,view),[entry,result,view]);
  const analysisColumns=useMemo(()=>[...sixColumns(entry,result,view,includeLuck),...([['selectedMonth','월운',selected.month],['selectedDay','일운',selected.day],['selectedHour','시운',selected.hour]].map(([key,label,pillar],i)=>({key,label,index:6+i,pillar,kind:includeLuck&&pillar?'calculated':'unknown'})))],[entry,result,view,includeLuck,selected]);
  const status=displayCertainty(entry,result),mismatch=isSourceDayDifferent(entry,result,STEM_KO,BRANCH_KO);
  const dirty=memo!==entry.memo||Boolean(journalDraft);
  const [memoBase,setMemoBase]=useState(entry.memo);
  const memoStale=memo!==memoBase&&entry.memo!==memoBase;
  const noteStale=Boolean(journalDraft)&&noteEditConflict(journalOriginal,integrated(vault).notes.find(n=>n.id===journalOriginal?.id));
  useEffect(()=>{if(memo===memoBase&&entry.memo!==memoBase){setMemo(entry.memo);setMemoBase(entry.memo);}},[entry.memo,memo,memoBase]);
  useEffect(()=>{if(!dirty)return;const unload=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',unload);return()=>window.removeEventListener('beforeunload',unload);},[dirty]);
  // Browser/WebView history back must not discard a lifted note draft.
  useEffect(()=>{
    const guard=event=>{
      if(!dirty&&!journalWorking&&!busy)return;
      event.preventDefault();
      if(journalWorking||busy)setDialog({kind:'info',title:'처리 중',text:'사진 처리와 저장이 끝난 뒤 이동할 수 있습니다.'});
      else setPendingLeave(()=>event.detail.resume);
    };
    window.addEventListener('saju:before-history-leave',guard);
    return ()=>window.removeEventListener('saju:before-history-leave',guard);
  },[dirty,journalWorking,busy]);
  const external=next=>{if(journalWorking||busy){setDialog({kind:'info',title:'처리 중',text:'사진 처리와 저장이 끝난 뒤 이동할 수 있습니다.'});return;}if(dirty)setPendingLeave(()=>()=>navigate(next));else navigate(next);};
  const go=next=>{if(journalWorking||busy)return;setScreen(next);window.scrollTo({top:0,behavior:'instant'});};
  const info=value=>setDialog({kind:'info',...value});
  const inspect=(column,part)=>{const g=glyphInfo(column,part),labels=pillarLabels(column,column.inspectionDayStem??result.saju?.dayStem);
    info({title:`${column.label} ${part==='stem'?'천간':'지지'} · ${g.hanja||g.ko}`,text:column.kind==='reference'?'가져온 원본 화면의 글자입니다. 출생정보 확인 전에는 계산 결과로 사용하지 않습니다.':!g.known?'이 기둥을 계산할 입력이나 대운 결과가 없습니다. 임의의 글자는 채우지 않습니다.':part==='stem'?`${g.hanja}(${g.ko}) · 일간 기준 ${labels.stem}. 현재 명식에 선택한 계산 기준의 결과입니다.`:`${g.hanja}(${g.ko}) · 본기 십성 ${labels.branch} · 12운성 ${labels.growth}. 지장간 ${labels.hidden.map(h=>h.hanja).join('·')}.`});};
  const applySelection=next=>{setSelection({...next,entryId:entry.id});setYear(Number(next.date.slice(0,4)));setSelectedMonth(null);};
  const commitSelection=async next=>{const value={...next,entryId:entry.id};if(!await change(state=>rememberSelection(state,value)))return false;applySelection(value);return true;};
  const selectYear=y=>commitSelection(selectionForYear(selection,Math.min(2050,safeYear(y,year))));
  const selectDecade=decade=>commitSelection(selectionForDecade(decade,entry.birth.calculation_policy));
  const selectMonth=async key=>{const [y,m]=key.split('-').map(Number);if(await commitSelection({...selection,date:`${y}-${String(m).padStart(2,'0')}-15`}))setSelectedMonth(key);};
  const toggleYear=d=>{setYearDraft(String(year));setDialog({kind:'options',title:'명식 보기 설정'});};
  const saveMemo=async()=>{if(journalWorking||busy||memoStale||noteStale)return null;const ok=await change(state=>{let next=state;if(memo!==memoBase){assertMemoEditCurrent(state,entry.id,memoBase);next=upsertEntry(state,{id:entry.id,memo});}if(journalDraft){assertNoteEditCurrent(next,journalOriginal);next=saveNote(next,entry.id,journalDraft);}return next;},'메모를 저장했습니다.');if(ok){setMemoBase(memo);setJournalDraft(null);setJournalOriginal(null);}return ok;};
  const showRules=()=>{const section=document.getElementById('research-analysis');const editor=section?.querySelector('details');if(editor)editor.open=true;section?.scrollIntoView({behavior:'smooth',block:'start'});};
  const showWarning=result.origin==='manual'||result.status!=='ready'||mismatch||result.assumedSolar||result.correctionUnapplied||result.daeunBoundaryRepair;
  const selectedLabel=`${view.year}년 ${view.annual?view.annual.stem+view.annual.branch:''}`;
  return <div className={'reference-reader '+(large?'rr-readable':'')} data-testid="reference-reader">
    {screen==='reading'?<div className="rr-topbar"><div role="tablist" aria-label="풀이 분류">{panels.map(([key,label],i)=><button type="button" key={key} id={'rr-tab-'+key} role="tab" aria-selected={panel===key} aria-controls="rr-reading-content" tabIndex={panel===key?0:-1} onClick={()=>{setPanel(key);window.scrollTo(0,0)}} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4;setPanel(panels[next][0]);document.getElementById('rr-tab-'+panels[next][0])?.focus();}}}>{label}</button>)}</div><button type="button" aria-label="명식 보기 설정" onClick={toggleYear}><ReaderIcon name="menu"/></button></div>
      :<header className="rr-person-header"><button type="button" aria-label="명식 보관함으로" onClick={()=>external({name:'vault'})}><ReaderIcon name="back"/></button><div><h1>{screen==='memo'?'메모 · '+entry.name:entry.name}</h1><p>{referenceBirthLabel(entry)}</p></div><button type="button" aria-label={entry.favorite?'즐겨찾기 해제':'즐겨찾기 추가'} aria-pressed={entry.favorite} disabled={busy} className={entry.favorite?'rr-favorite':''} onClick={()=>change(state=>toggleFavorite(state,entry.id))}><ReaderIcon name="star" filled={entry.favorite}/></button><button type="button" aria-label="명식 보기 설정" onClick={toggleYear}><ReaderIcon name="menu"/></button></header>}
    {showWarning&&<aside className="rr-warning" role="status"><strong>{mismatch?'원본 일주와 계산값이 다릅니다':status.title}</strong><p>{mismatch?'원본은 보존됩니다. 역법·날짜·시각 기준을 확인해 주세요.':status.body}</p><button type="button" onClick={()=>external({name:'form',id:entry.id})}>입력정보 확인</button></aside>}
    {(screen==='chart'||screen==='reading')&&<DaeunSetup entry={entry} result={result} change={change} busy={busy} onEdit={()=>external({name:'form',id:entry.id})} onMappings={()=>external({name:'settings',showImportMappings:true})}/>}
    {screen==='chart'&&<div className="rr-chart-page">
      {result.daeunBoundaryRepair&&<p className="rr-warning" role="status">대운 연경계 보완 적용 · 기존 원국은 유지하고, 비어 있던 대운만 인접 연도 절기로 계산했습니다. 아래 대운 기산 근거에서 확인할 수 있습니다.</p>}
      {result.saju?.clock?.audit&&<details className="integration-audit"><summary>계산 근거 · 절입/시각 보정</summary><dl><dt>시간대 · 전환표</dt><dd>{result.saju.clock.audit.zone} · {result.saju.clock.audit.tzdb}</dd><dt>현지 UTC 차이</dt><dd>{result.saju.clock.audit.offsetMinutes}분</dd><dt>서머타임 제거</dt><dd>{result.saju.clock.audit.dstMinutes}분</dd><dt>경도 보정</dt><dd>{result.saju.clock.audit.longitudeMinutes.toFixed(2)}분</dd><dt>균시차(근사)</dt><dd>{result.saju.clock.audit.equationMinutes.toFixed(2)}분</dd><dt>실제 순간(UTC)</dt><dd>{new Date(result.saju.clock.instant).toISOString()}</dd><dt>보정 후 역법 시각</dt><dd>{new Date(result.saju.clock.adjusted).toISOString().replace('T',' ').replace('Z','')}</dd><dt>중복 시각 선택</dt><dd>{result.saju.clock.audit.ambiguous?(result.saju.clock.audit.policy.fold==='later'?'나중 시각':'먼저 시각'):'중복 아님'}</dd></dl><p>이전 절기 {result.saju.lastJie?.name} · {result.saju.lastJie?.iso}</p><p className="warn">독립 천문 계산이며 대운 시작일은 근사값입니다. 기존 엔진과의 차이는 교차검증으로 확인합니다.</p></details>}
      {view.decades.length>0&&<details className="completion-box"><summary>대운 기산 단계별 근거</summary><ol><li>방향: {view.decades.at(-1).direction||'기존 엔진/직접 지정'}</li><li>절입 경계: {view.decades.at(-1).boundary||'기존 엔진/직접 지정'}</li><li>경과일: {view.decades.at(-1).gapDays?.toFixed(6)||'미제공'}</li><li>{view.decades.at(-1).basis||'대운 시작 나이 직접 지정 또는 기존 산식'}</li></ol><ul>{[...view.decades].reverse().map(d=><li key={d.startAge}>{d.stem}{d.branch} · {d.startAge}세 · {d.startInstant?new Date(d.startInstant).toISOString():d.startYear?d.startYear+'년':'시작연도 미상'}</li>)}</ul></details>}{result.origin === 'manual' ? <button type="button" className="rr-calculation-note" onClick={() => external({name:'tools',tab:'reverse',pillarInput:entry.birth.pillar_input})}>이 네 기둥으로 날짜 역검색</button>
        : entry.birth.time_status !== 'known' && <button type="button" className="rr-primary-action" onClick={() => external({name:'hour-candidates',id:entry.id})}>미상 시각 후보 비교</button>}
      <details className="integration-crosscheck" data-testid="engine-crosscheck"><summary>독립 엔진 교차검증 {crosscheck.status==='comparable'?'· '+crosscheck.matching+'/4 일치':'· 입력 확인 필요'}</summary>
        {crosscheck.status==='comparable'?<><p>{crosscheck.explanation}</p><table><thead><tr><th>구분</th><th>기존 엔진</th><th>천문 엔진</th><th>결과</th></tr></thead><tbody>{crosscheck.rows.map(row=><tr key={row.name}><th>{row.name}</th><td>{row.legacy}</td><td>{row.astronomical}</td><td data-equal={row.equal}>{row.equal?'일치':'차이'}</td></tr>)}</tbody></table><p className="integration-cross-note">이 비교는 읽기 전용입니다. 저장된 명식·역법 설정·메모를 자동 변경하지 않습니다.</p></>:<p>{crosscheck.reason}</p>}
      </details>
      <SixPillars display={display} columns={columns} dayStem={result.saju?.dayStem} onInspect={inspect} hanja={hanja}/><ChartExport entry={entry} columns={columns} year={year} busy={busy}/>
      <LuckRails display={display} birth={entry.birth} ageMode={display.ageMode} view={view} dayStem={result.saju?.dayStem} selectedMonth={selectedMonth} onDecade={selectDecade} onYear={selectYear} onMonth={selectMonth} large={large}/>
      <button type="button" className="rr-primary-action" disabled={busy} onClick={()=>commitSelection(nowSelection(entry.birth.calculation_policy))}>현재 운 바로가기</button><div className="rr-selection-bar" role="status"><span>선택 {selectedLabel}{view.decade?` · ${view.decade.startAge}세 대운`:''}</span><button type="button" onClick={toggleYear}>연도 변경</button></div>
      <button type="button" className="rr-primary-action" onClick={()=>go('reading')}>선택한 명식 풀이 보기 <ReaderIcon name="arrow" size={17}/></button>
      <button type="button" className="rr-calculation-note" onClick={()=>info({title:status.title,text:status.body+' 대운 시작 나이는 근사값입니다. 세운 옆 나이는 세는나이이며 목록의 만나이와 다릅니다.'})}>{result.origin==='manual'?'직접 입력 간지 · 계산 기준 확인':result.origin==='astronomical'?'독립 절입·시각 계산 · 기준 확인':'기존 계산기 산식 · 계산 기준 확인'}</button>
    </div>}
    {screen==='reading'&&<div id="rr-reading-content" role="tabpanel" aria-labelledby={'rr-tab-'+panel} className="rr-reading-page">
      {panel==='overview'&&<><AnalysisOverview research={research.status==='ready'?research:null} onEditRules={showRules} display={display} result={analysisResult} weighted={weighted} customWeights={weights.enabled} onEditWeights={()=>setDialog({kind:'weights',title:'분석 비중 편집'})} view={view} includeLuck={includeLuck} setIncludeLuck={setIncludeLuck} onInfo={info}/><ResearchPanel result={result} luck={includeLuck?[view.decade,selected.year,selected.month,selected.day,selected.hour]:[]} weights={weights} vault={vault} change={change} busy={busy}/><RelationSection columns={analysisColumns} part="stem" hanja={hanja}/><RelationSection columns={analysisColumns} part="branch" hanja={hanja}/>{display.shinsal&&<ShinsalGrid display={display} basis={rules.sinsalBasis} onBasis={basis=>change(s=>setAnalysisRules(s,{sinsalBasis:basis}))} columns={analysisColumns} dayStem={result.saju?.dayStem} hanja={hanja} onInfo={info}/>}</>}
      {panel==='relations'&&<><div className="rr-section-intro"><h2>사주 관계</h2><p>{selectedLabel} · {includeLuck?'선택운 포함':'원국만'}</p><button type="button" onClick={()=>setIncludeLuck(!includeLuck)}>{includeLuck?'원국만 보기':'선택운 포함하기'}</button></div><RelationSection columns={analysisColumns} part="stem" hanja={hanja}/><RelationSection columns={analysisColumns} part="branch" hanja={hanja}/>{display.shinsal&&<ShinsalGrid display={display} basis={rules.sinsalBasis} onBasis={basis=>change(s=>setAnalysisRules(s,{sinsalBasis:basis}))} columns={analysisColumns} dayStem={result.saju?.dayStem} hanja={hanja} onInfo={info}/>}</>}
      {panel==='luck'&&<><LuckExplorer result={result} selection={selection} view={view} policy={entry.birth.calculation_policy} onSelect={commitSelection} vault={vault} weights={weights} busy={busy}/><SelectionTools key={JSON.stringify([selection.date,selection.hour,selection.minute])} vault={vault} entry={entry} selection={selection} onSelect={applySelection} change={change} busy={busy}/><FortuneTimeline selection={selection} weights={weights} vault={vault} result={result} year={year} policy={entry.birth.calculation_policy} busy={busy} onSelect={async next=>{const value={entryId:entry.id,...next};if(await change(state=>rememberSelection(state,value),'선택한 월운을 저장했습니다.'))applySelection(value);}}/>{selected.error?<p role="alert">{selected.error}</p>:<div className="integration-selected-pillars">{[['month','월운'],['day','일운'],['hour','시운']].map(([k,label])=><span key={k}>{label}<strong>{selected[k].stem}{selected[k].branch}</strong></span>)}</div>}<p className="rr-subnote">{selection.date} {selection.hour}:{String(selection.minute).padStart(2,'0')} · 월·일·시운: 선택일의 독립 절입/시각 기준. 원국·용신은 기존 판정 기준을 유지합니다.</p><div className="rr-section-intro"><h2>{selectedLabel} 운 선택</h2><p>대운·연도를 누르면 위 명식표와 관계표에 함께 적용됩니다.</p><button type="button" onClick={toggleYear}>연도 직접 선택</button></div><SixPillars display={display} columns={columns} dayStem={result.saju?.dayStem} hanja={hanja} onInspect={inspect}/><LuckRails display={display} birth={entry.birth} ageMode={display.ageMode} view={view} dayStem={result.saju?.dayStem} selectedMonth={selectedMonth} onDecade={selectDecade} onYear={selectYear} onMonth={selectMonth} large={large}/><AnalysisOverview research={research.status==='ready'?research:null} onEditRules={showRules} display={display} result={analysisResult} weighted={weighted} customWeights={weights.enabled} onEditWeights={()=>setDialog({kind:'weights',title:'분석 비중 편집'})} view={view} includeLuck={includeLuck} setIncludeLuck={setIncludeLuck} onInfo={info}/><ResearchPanel result={result} luck={includeLuck?[view.decade,selected.year,selected.month,selected.day,selected.hour]:[]} weights={weights} vault={vault} change={change} busy={busy}/></>}
      {panel==='compare'&&<ComparePanel change={change} busy={busy} initialCompareId={initialCompareId} entry={entry} vault={vault} result={result} onInspect={inspect} onOpen={id=>external({name:'details',id})}/>}
      <button type="button" className="rr-floating-chart" onClick={()=>go('chart')}><b>명식</b>보기</button>
    </div>}
    {screen==='memo'&&<div className="rr-memo-page"><h2>나의 메모</h2><label className="rr-memo-label">기록 {memo.length.toLocaleString()} / 20,000<textarea aria-label="명식 메모" value={memo} disabled={busy} maxLength={20000} rows={7} placeholder="상담과 관찰 내용을 기록하세요" onChange={e=>setMemo(e.target.value)}/></label><button type="button" className="rr-primary-action" disabled={busy||journalWorking||memoStale||noteStale||!dirty} onClick={saveMemo}>메모 저장</button>{dirty&&<p role="status">아직 저장하지 않은 내용이 있습니다.</p>}
      {memoStale&&<section role="alert"><p>다른 화면에서 메모가 변경되었습니다. 초안은 유지되며 덮어쓰지 않습니다.</p><button type="button" onClick={()=>{if(window.confirm('작성 중인 메모를 버리고 최신 메모를 불러올까요?')){setMemo(entry.memo);setMemoBase(entry.memo);}}}>최신 메모 불러오기</button></section>}
      <Journal original={journalOriginal} setOriginal={setJournalOriginal} entry={entry} vault={vault} change={change} busy={busy} draft={journalDraft} setDraft={setJournalDraft} working={journalWorking} setWorking={setJournalWorking} selection={{date:selection.date,hour:selection.hour,minute:selection.minute}} onApplySelection={async next=>{if(await commitSelection(next)){setPanel('luck');go('reading');}}}/>
      <div className="rr-management-actions"><button type="button" onClick={()=>external({name:'form',id:entry.id})}>출생정보 수정 <ReaderIcon name="arrow" size={18}/></button><button type="button" disabled={busy} onClick={()=>change(state=>setSelf(state,vault.selfId===entry.id?null:entry.id),'내 명식을 변경했습니다.')}>{vault.selfId===entry.id?'내 명식 해제':'내 명식 지정'} <ReaderIcon name="arrow" size={18}/></button><button type="button" onClick={()=>info({title:'원본과 수정 이력',text:`원본 일주 ${(entry.referenceDisplay?.day_stem_ko||'—')+(entry.referenceDisplay?.day_branch_ko||'—')} · 보정 ${entry.birth.correction_raw||'표시 없음'}. 출생정보 수정 ${entry.birthRevisions?.length??0}회. 원본은 수정과 분리해 보존됩니다.`})}>원본과 수정 이력 <ReaderIcon name="arrow" size={18}/></button><button type="button" onClick={()=>external({name:'settings'})}>백업·복원 <ReaderIcon name="arrow" size={18}/></button><button type="button" className="rr-danger" disabled={busy||journalWorking} onClick={()=>setDialog({kind:'delete',title:'명식 삭제 확인'})}>휴지통으로 이동 <ReaderIcon name="arrow" size={18}/></button></div>
    </div>}
    <nav className="rr-bottom-nav" aria-label="명식 주 메뉴"><button type="button" className={screen==='chart'?'active':''} aria-current={screen==='chart'?'page':undefined} onClick={()=>go('chart')}><ReaderIcon name="home" filled={screen==='chart'}/><span>명식</span></button><button type="button" className={screen==='reading'?'active':''} aria-current={screen==='reading'?'page':undefined} onClick={()=>go('reading')}><ReaderIcon name="book" filled={screen==='reading'}/><span>풀이</span></button><button type="button" aria-label="새 명식 추가" className="rr-nav-plus" onClick={()=>external({name:'form'})}><ReaderIcon name="plus" size={35}/></button><button type="button" className={screen==='memo'?'active':''} onClick={()=>go('memo')}><ReaderIcon name="memo"/><span>메모{dirty?' •':''}</span></button><button type="button" onClick={()=>external({name:'vault'})}><ReaderIcon name="grid"/><span>관리</span></button></nav>
    {dialog&&<ReaderDialog title={dialog.title} onClose={()=>setDialog(null)} busy={busy}>
      {dialog.kind==='weights'&&<WeightEditor value={weights} change={change} busy={busy} onClose={()=>setDialog(null)}/>}
      {dialog.kind==='info'&&<><p>{dialog.text}</p><button type="button" className="rr-primary-action" onClick={()=>setDialog(null)}>확인</button></>}
      {dialog.kind==='options'&&<form onSubmit={e=>{e.preventDefault();selectYear(Number(yearDraft));setDialog(null)}}><label>선택 연도<input aria-label="선택 연도" type="number" min="1900" max="2050" required value={yearDraft} onChange={e=>setYearDraft(e.target.value)}/></label><label className="rr-check"><input type="checkbox" disabled={busy} checked={hanja} onChange={e=>setHanja(e.target.checked)}/>명식표 한자 함께 보기</label><label className="rr-check"><input type="checkbox" disabled={busy} checked={large} onChange={e=>setLarge(e.target.checked)}/>운 목록 크게 보기 · 좌우 스크롤</label><label className="rr-check"><input type="checkbox" disabled={busy} checked={includeLuck} onChange={e=>setIncludeLuck(e.target.checked)}/>풀이에 선택운 포함 · 적용 범위는 안내 참고</label><p className="rr-subnote">보기 설정은 기기에 즉시 저장되며 백업에 포함됩니다. 사용자 비중은 오행·음양에 적용됩니다. 용신·신강약은 원국의 기존 판정이며 기존 엔진과 다른 산식은 교차검증 표에서 확인하세요.</p><button className="rr-primary-action" type="submit">적용</button><button type="button" className="rr-secondary-action" onClick={()=>{setDialog(null);external({name:'settings'})}}>보관함 백업·설정</button></form>}
      {dialog.kind==='delete'&&<><p>{entry.name} 명식을 휴지통으로 옮깁니다. 설정에서 복원할 수 있습니다.</p><div className="rr-dialog-actions"><button type="button" disabled={busy} onClick={()=>setDialog(null)}>취소</button><button type="button" disabled={busy} className="rr-danger" onClick={async()=>{const done=await change(state=>deleteEntry(state,entry.id),'휴지통으로 옮겼습니다.');if(done)navigate({name:'vault'},true);}}>휴지통으로</button></div></>}
    </ReaderDialog>}
    {pendingLeave&&<ReaderDialog title="저장하지 않은 메모" onClose={()=>setPendingLeave(null)} busy={busy}><p>이 화면을 나가기 전에 메모를 저장할까요?</p><div className="rr-dialog-actions"><button type="button" onClick={()=>setPendingLeave(null)}>계속 작성</button><button type="button" onClick={()=>{const leave=pendingLeave;setPendingLeave(null);leave()}}>저장 안 함</button><button type="button" disabled={busy||memoStale||noteStale} onClick={async()=>{const saved=await saveMemo();if(saved){const leave=pendingLeave;setPendingLeave(null);leave()}}}>저장 후 이동</button></div></ReaderDialog>}
  </div>;
}
