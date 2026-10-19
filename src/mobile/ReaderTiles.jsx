import React from 'react';
import { stemColor, branchColor } from './list-utils.js';
import { glyphInfo, pillarLabels } from './reader-model.js';

export function ReaderIcon({name,size=24,filled=false}) {
  const paths={
    back:<path d="m14 5-7 7 7 7"/>,
    home:<><path d="m3 10 9-8 9 8v11H3z"/></>,
    book:<><path d="M12 5C8 2 4 2 2 3v17c3-1 7-1 10 1 3-2 7-2 10-1V3c-2-1-6-1-10 2z"/><path d="M12 5v16"/></>,
    plus:<><rect x="2" y="2" width="20" height="20" rx="8"/><path d="M6 12h12M12 6v12"/></>,
    memo:<><path d="m4 17 13-13 3 3L7 20H3zM14 7l3 3M11 21h10"/></>,
    grid:<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    star:<path d="m12 2.5 3 6.3 7 .9-5.1 5 1.2 7-6.1-3.2-6.2 3.2 1.2-7-5-5 7-.9z"/>,
    menu:<path d="M6 5v14M12 5v14M18 5v14"/>,
    close:<path d="m5 5 14 14M19 5 5 19"/>,
    arrow:<path d="m9 5 7 7-7 7"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled?'currentColor':'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
export function Rune({column,part='stem',hanja=true,active=false,onInspect,small=false}) {
  const glyph=glyphInfo(column,part),tone=part==='stem'?stemColor(glyph.ko):branchColor(glyph.ko);
  const className=`rr-rune ${small?'rr-small-rune':''} ${active?'rr-lit':''}`;
  const content=<><strong>{hanja?(glyph.hanja||glyph.ko):glyph.ko}</strong>{!small&&<small>{glyph.known?glyph.ko:glyph.reference?'원본':'미확인'}</small>}</>;
  return onInspect?<button type="button" className={className} data-tone={tone} aria-label={`${column.label} ${part==='stem'?'천간':'지지'} ${glyph.ko}`} onClick={()=>onInspect(column,part)}>{content}</button>
    :<span className={className} data-tone={tone}>{content}</span>;
}
export function SixPillars({columns,dayStem,onInspect,hanja=true,compact=false,appearance}) {
  const labels=columns.map(c=>pillarLabels(c,dayStem));
  return <table className={`rr-six ${compact?'rr-six-compact':''}`} aria-label="세운 대운 시주 일주 월주 연주 명식표"><colgroup>{columns.map(c=><col key={c.key} className={c.index<2?'rr-luck-col':''}/>)}</colgroup>
    <thead><tr>{columns.map(c=><th key={c.key} scope="col">{c.label}</th>)}</tr></thead>
    <tbody>
      {!compact&&appearance?.tenGods!==false&&<tr className="rr-gods">{columns.map((c,i)=><td key={c.key} className={c.key==='day'?'rr-self-god':''}>{labels[i].stem}</td>)}</tr>}
      <tr>{columns.map(c=><td key={c.key}><Rune column={c} part="stem" hanja={hanja} onInspect={onInspect}/></td>)}</tr>
      <tr>{columns.map(c=><td key={c.key}><Rune column={c} part="branch" hanja={hanja} onInspect={onInspect}/></td>)}</tr>
      {appearance?.hiddenStems!==false&&<tr className="rr-hidden">{columns.map((c,i)=><td key={c.key}>{labels[i].hidden.length?labels[i].hidden.map((h,n)=><span key={h.hanja} data-tone={h.tone} className={n===labels[i].hidden.length-1?'rr-main-hidden':''}>{h.ko}</span>):'—'}</td>)}</tr>}
      {!compact&&appearance?.tenGods!==false&&<tr className="rr-gods rr-branch-gods">{columns.map((c,i)=><td key={c.key}>{labels[i].branch}</td>)}</tr>}
      {!compact&&appearance?.growth!==false&&<tr className="rr-growth">{columns.map((c,i)=><td key={c.key} data-stage={labels[i].growth}>{labels[i].growth}</td>)}</tr>}
    </tbody></table>;
}
function LuckTile({item,kind,dayStem,selected,onSelect,birthYear}) {
  const c={kind:'calculated',pillar:item,key:kind,label:kind==='year'?'세운':kind==='decade'?'대운':'월운'};
  const labels=pillarLabels(c,dayStem);
  const title=kind==='decade'?`${item.startAge}세 대운 ${item.stem}${item.branch}`:kind==='year'?`${item.year}년 세운 ${item.stem}${item.branch}`:`${item.year}년 ${item.month}월 월운 ${item.stem}${item.branch}`;
  return <button type="button" className={`rr-luck-tile ${selected?'selected':''}`} aria-label={title} aria-pressed={selected} disabled={(kind==='decade'&&!Number.isInteger(item.startYear))||((kind==='decade'?item.startYear:item.year)>2050)} onClick={()=>onSelect(item)}>
    <span className="rr-luck-date">{kind==='decade'?item.startAge:kind==='year'?item.year:`${item.month}월`}</span>
    {kind==='year'&&<span className="rr-luck-age" title="세는나이: 해당 연도 − 출생연도 + 1">{birthYear&&item.year>=birthYear?item.year-birthYear+1:'—'}</span>}
    <span className="rr-luck-god">{labels.stem}</span><Rune column={c} part="stem" hanja={false} small/><Rune column={c} part="branch" hanja={false} small/>
    <span className="rr-luck-god">{labels.branch}</span><span className="rr-growth" data-stage={labels.growth}>{labels.growth}</span>
  </button>;
}
export function LuckRails({view,dayStem,selectedMonth,onYear,onMonth,large=false}) {
  const month=view.months.find(m=>m.key===selectedMonth);
  return <section className={`rr-luck-rails ${large?'rr-large-rails':''}`} aria-label="대운 세운 월운 선택">
    {view.decades.length>0?<div className="rr-rail" role="group" aria-label="대운 목록" style={{'--slots':Math.max(view.decades.length,8)}}>{view.decades.map(d=><LuckTile key={d.startYear??d.startAge} item={d} kind="decade" dayStem={dayStem} selected={view.decade!=null&&view.decade.startYear===d.startYear} onSelect={d=>onYear(d.startYear)}/>)}</div>:<p className="rr-empty">대운은 성별·출생시각과 계산 결과 확인 후 표시합니다.</p>}
    {view.decades.some(d=>d.manualBasis)&&<p className="rr-subnote">직접 지정 대운수입니다. 시작 연도 미상 또는 2050년 초과 항목은 연도 선택에 사용하지 않습니다.</p>}
    <div className="rr-rail" role="group" aria-label="세운 목록" style={{'--slots':10}}>{view.years.map(y=><LuckTile key={y.year} item={y} kind="year" dayStem={dayStem} selected={view.year===y.year} onSelect={y=>onYear(y.year)} birthYear={view.birthYear}/>)}</div>
    {view.months.length>0&&<><div className="rr-rail rr-month-rail" role="group" aria-label="월운 목록" style={{'--slots':12}}>{view.months.map(m=><LuckTile key={m.key} item={m} kind="month" dayStem={dayStem} selected={selectedMonth===m.key} onSelect={m=>onMonth(m.key)}/>)}</div>
    <p className="rr-rail-note" role="status">{month?`${month.year}년 ${month.month}월 · ${month.stem}${month.branch} 선택. `:''}월운: 각 월 15일 {view.precision?'12시의 독립 절입 산식':'기존 산식'} · 1월은 다음 해입니다.</p></>}
  </section>;
}
