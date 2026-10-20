import React,{useMemo} from 'react';
import {luckTreeView} from './luck-tree-model.js';
import {pillarLabels,chartTwelveShinsal} from './reader-model.js';
import {nayinOf} from './traditional-reference.js';
import {Rune,SixPillars} from './ReaderTiles.jsx';
import SelectionTools from './SelectionTools.jsx';
import {readPreferences} from '../vault/workspace.js';
import './luck-tree.css';

export default function LuckTree({entry,result,selection,selected,vault,change,busy,onSelect,onToday,onExplain,onMemo,onInspect}){
 const tree=useMemo(()=>luckTreeView(entry,result,selection,selected),[entry,result,selection,selected]);
 const prefs=readPreferences(vault),time=`${String(selection.hour).padStart(2,'0')}:${String(selection.minute).padStart(2,'0')}`;
 const {appearance:a,manseDetails:m}=prefs;
 return <section className="luck-tree" aria-labelledby="luck-tree-title"><h2 id="luck-tree-title">운세 트리</h2>
  <p className="rr-subnote">{selection.date} {time} · 시진 → 일진 → 절운 → 세운 → 대운</p>
  <SelectionTools key={selection.date+time} entry={entry} selection={selection} vault={vault} change={change} busy={busy} onSelect={onSelect} onToday={onToday}/>
  {tree.status!=='ready'?<p role="status" className="rr-subnote">{tree.reason}</p>:<>
   <div className="luck-tree-scroll" role="region" tabIndex={0} aria-label="선택운 5단 명식, 좌우 스크롤"><div className="luck-tree-columns">{tree.columns.map(c=>{const labels=pillarLabels(c,result.saju.dayStem),p=c.pillar;return <article key={c.key} aria-label={`${c.label} 기둥`}><h3>{c.label}</h3>{a.tenGods&&m.dayStemGods&&<span className="luck-tree-god">{labels.stem}</span>}<Rune column={c} part="stem" hanja={prefs.hanja} onInspect={onInspect}/><Rune column={c} part="branch" hanja={prefs.hanja} onInspect={onInspect}/>{a.tenGods&&m.dayStemGods&&<span className="luck-tree-god">{labels.branch}</span>}{a.tenGods&&m.columnStemGods&&<span className="luck-tree-god" title="각 기둥 천간 기준">{labels.branchSelf||'—'}</span>}{a.growth&&m.dayGrowth&&<span className="luck-tree-growth">{labels.growth}</span>}{a.growth&&m.columnGrowth&&<span className="luck-tree-growth" title="각 기둥 천간 기준">{labels.growthSelf||'—'}</span>}{m.yearShinsal&&<small title="연주 기준 십이신살">{chartTwelveShinsal(result.saju.pillars?.[3]?.branch,p?.branch)||'—'}</small>}{m.dayShinsal&&<small title="일주 기준 십이신살">{chartTwelveShinsal(result.saju.pillars?.[1]?.branch,p?.branch)||'—'}</small>}{m.nayin&&<small title="납음">{nayinOf(p)?.name||'—'}</small>}{c.key==='tree-decade'&&<small>{c.kind==='unknown'?tree.decadeReason:tree.decadePrecision==='year'?'연도 기준 대운':`${c.pillar.startAge}세 대운`}</small>}</article>;})}</div></div>
   <p className="rr-subnote">선택운은 절입·시각 보정 기준으로 계산합니다. 원국·대운은 저장한 명식의 계산 기준을 따릅니다.{tree.decadePrecision==='year'?' 대운의 정확한 교운 시각은 확인되지 않아 연도 기준으로 표시합니다.':''}</p>
   <h3 className="luck-tree-natal-title">원국</h3><SixPillars columns={tree.natal} dayStem={result.saju.dayStem} appearance={prefs.appearance} manseDetails={prefs.manseDetails} hanja={prefs.hanja} onInspect={onInspect}/>
   <div className="luck-tree-actions"><button type="button" className="rr-primary-action" onClick={onExplain}>운세 보기</button><button type="button" className="rr-secondary-action" onClick={onMemo}>메모 작성</button></div>
   <p className="rr-subnote">현재는 선택운과 원국을 함께 표시합니다. 흐름 점수·합화 비중·한난조습의 다층 변화는 아직 연결되지 않았습니다.</p>
  </>}
 </section>;
}
