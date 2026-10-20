import React, { useMemo, useState, useId } from 'react';
import { HS_EL, EBH } from './engine.js';
import { normalizeElementScores } from './detail-view-model.js';
import { TONES, ELEMENT_NAMES, relations, shinsalView, climateView } from './reader-model.js';
import { Rune, SixPillars } from './ReaderTiles.jsx';
import { nayinOf, gongmangOf, samjaeOf } from './traditional-reference.js';

export function ElementDiagram({scores,onInfo}) {
  const uid=useId().replace(/:/g,'');
  const normalized=normalizeElementScores(scores);
  const nodes=[{key:'水',x:180,y:52},{key:'木',x:265,y:118},{key:'火',x:229,y:216},{key:'土',x:125,y:216},{key:'金',x:91,y:118}]
    .map(n=>({...n,...normalized.find(x=>x.key===n.key)}));
  if(!normalized.some(x=>x.score>0))return <p className="rr-empty">출생시각을 확인하면 오행 분포를 표시합니다.</p>;
  const points=nodes.map(n=>({...n,r:Math.max(22,Math.min(53,21+Math.sqrt(n.percentage)*5))}));
  const segment=(a,b,inset=0)=>{const d=Math.hypot(b.x-a.x,b.y-a.y),ux=(b.x-a.x)/d,uy=(b.y-a.y)/d;
    return {x1:a.x+ux*(a.r-inset),y1:a.y+uy*(a.r-inset),x2:b.x-ux*(b.r-inset),y2:b.y-uy*(b.r-inset)};};
  return <div className="rr-element-diagram">
    <svg viewBox="0 0 360 282" role="img" aria-label={'표시 오행 분포 '+points.map(n=>`${n.name} ${n.percentage}%`).join(', ')}>
      <defs><marker id={uid+'gen'} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 5 2.5 0 5" fill="#daa2b7"/></marker><marker id={uid+'ctrl'} markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 5 2.5 0 5" fill="#83aabd"/></marker></defs>
      {points.map(n=><circle key={n.key} cx={n.x} cy={n.y} r={n.r} data-tone={n.tone} className="rr-element-circle"/>)}
      {points.map((a,i)=>{const b=points[(i+1)%5],line=segment(a,b,7);return <line key={'gen'+a.key} {...line} stroke="#daa2b7" strokeWidth=".85" markerEnd={`url(#${uid}gen)`}/>;})}
      {points.map((a,i)=>{const b=points[(i+2)%5],line=segment(a,b,8);return <line key={'ctrl'+a.key} {...line} stroke="#83aabd" strokeWidth="1" markerEnd={`url(#${uid}ctrl)`}/>;})}
      {points.map(n=><g key={'text'+n.key}><text x={n.x} y={n.y-2} textAnchor="middle" className="rr-element-label">{n.name}</text><text x={n.x} y={n.y+17} textAnchor="middle" className="rr-element-value">{n.percentage}</text></g>)}
    </svg>
    <div className="rr-element-targets">{points.map(n=><button type="button" key={n.key} style={{left:`${n.x/3.6}%`,top:`${n.y/2.82}%`}} aria-label={`${n.name} 비중 ${n.percentage}% 자세히`} onClick={()=>onInfo({title:`${n.name} 오행`,text:`표시 오행 점수 ${n.score.toFixed(2)}를 백분율로 바꾼 값은 ${n.percentage}%입니다. 원의 크기도 이 비율에 따라 달라집니다. 조견표 값이나 궁합 점수가 아닙니다.`})}/>)}</div>
  </div>;
}
function ClimateGauge({left,right,base,value,name,onInfo}) {
  const pct=n=>`${Math.min(96,Math.max(4,50+n*2.5))}%`;
  return <button type="button" className={'rr-climate '+(name==='한난'?'rr-temperature':'rr-humidity')} aria-label={`${name} 원국 ${base}, 선택 ${value}`} onClick={()=>onInfo({title:name+' 지표',text:`원국 ${base} → 현재 ${value}. 기존 계산기 지수를 -20~20 표시 범위에 맞춰 배치했습니다. 범위 밖은 끝에 표시합니다. 원국은 빈 마름모, 현재 선택은 초록 마름모입니다. 물리적 온도나 습도 측정값이 아닙니다.`})}><span>{left}</span><span className="rr-climate-line"><i className="rr-base-marker" style={{left:pct(base)}}/><i className="rr-current-marker" style={{left:pct(value)}}/></span><strong>{right}</strong></button>;
}
function ElementChip({value}) {
  if(!ELEMENT_NAMES[value])return <span className="rr-pending">—</span>;
  return <span className="rr-element-chip" data-tone={TONES[value]}>{ELEMENT_NAMES[value]}</span>;
}
export function AnalysisOverview({result,view,includeLuck,setIncludeLuck,onInfo,weighted,customWeights=false,onEditWeights,onEditRules,research,display={nayin:true}}) {
  const climate=useMemo(()=>climateView(result,view,includeLuck),[result,view,includeLuck]);
  const y=result.yongsin,day=result.saju?.pillars?.[1],month=result.saju?.pillars?.[2];
  const monthMain=EBH[month?.branch]?.bon?.[0];
  const natal=result.saju?.pillars||[];
  const emptiness=gongmangOf(natal[1]);
  const samjae=samjaeOf(natal[3]?.branch,view.annual?.branch);
  return <>
    <ElementDiagram scores={result.strength?.elementScores} onInfo={onInfo}/>
    <p className="rr-analysis-caption">{customWeights?'오행·음양 사용자 비중 · ':'오행·음양 기본 비중 · '}오행·관계표는 {includeLuck?'선택운 포함':'원국만'}</p>
    <div className="rr-weight-controls">{[['palace','궁성 비중'],['combination','합화 비중'],['hidden','지장간 비중']].map(([key,label])=><button type="button" key={key} onClick={()=>key==='combination'?onEditRules?.():onEditWeights?.()}>{label}</button>)}<button type="button" aria-pressed={includeLuck} onClick={()=>setIncludeLuck(!includeLuck)}>선택운 {includeLuck?'포함':'제외'}</button></div>
    <button type="button" className="rr-small-link rr-scope-help" onClick={()=>onEditWeights?.()}>선택운 비중 편집</button>{weighted&&weighted.total>0&&<div className="integration-yinyang"><span>음 {Math.round(weighted.yin/weighted.total*100)}%</span><span>양 {Math.round(weighted.yang/weighted.total*100)}%</span><span>{customWeights?'사용자 비중':'상대 가중치 참고'}</span></div>}
    {climate?<div className="rr-climate-row"><ClimateGauge left="한" right="난" base={climate.temperatureBase} value={climate.temperature} name="한난" onInfo={onInfo}/><ClimateGauge left="조" right="습" base={climate.humidityBase} value={climate.humidity} name="조습" onInfo={onInfo}/></div>:<p className="rr-empty">한난·조습은 출생시각 확인 후 표시합니다.</p>}
    <section className="rr-analysis-summary" aria-label="원국 분석 요약">
      <div className="rr-summary-line"><strong>{result.strength?.strength||'미확인'}</strong><span className={result.strength?.isDeukRyeong?'rr-emphasis':'rr-pending'}>{result.strength?(result.strength.isDeukRyeong?'득령':'실령'):'—'}</span><span>일간 <ElementChip value={day&&!day.unknown?HS_EL[day.stemIdx]:null}/></span><span>용 <ElementChip value={y?.primary}/></span></div>
      <div className="rr-summary-line"><span>월령</span><b>{monthMain||'—'}</b><small>월지 지장간 본기</small></div>
      {[['억부용신','eobbu'],['조후용신','johu'],['통관용신','tongwan']].map(([label,key])=><div className="rr-summary-line" key={key}><span>{label}</span><ElementChip value={y?.[key]?.primary}/><button type="button" className="rr-small-link" onClick={()=>onInfo({title:label,text:y?.[key]?.reason||'기존 계산기에서 해당 용신을 산출하지 않았습니다. 없음과 미검증을 구분해 확인해 주세요.'})}>판정 근거</button></div>)}
      <div className="rr-patterns"><span>격국 · 용격</span><button type="button" onClick={onEditRules}>{research?.pattern?.inner.name||'월주 미확인'} · 규칙별 판정 보기</button></div>
      {display.nayin&&<div className="integration-nayin" aria-label="납음과 공망 조견표"><h3>납음 · 공망</h3><p>전통 조견표로 분류한 보조 정보입니다. 오행 점수·용신에는 합산하지 않습니다.</p><div className="integration-nayin-grid">{[['시',0],['일',1],['월',2],['년',3]].map(([label,i])=>{const n=nayinOf(natal[i]);return <div key={label}><small>{label}주</small><strong>{n?.name||'미확인'}</strong>{n&&<span>{n.hanja} · {n.element}</span>}</div>})}</div><p className="integration-gongmang">일주 기준 공망: <b>{emptiness?emptiness.empty.join('·')+' ('+emptiness.decade+')':'미확인'}</b></p>
      <p>선택 연도 삼재(연지 기준): <b>{samjae?samjae.name:'미확인'}</b> {samjae&&<small>· {samjae.birthGroup} 그룹 / {samjae.annualBranch}년</small>}</p>
      <p className="rr-subnote">삼재는 전통적인 연지 분류이며 실제 재난 발생이나 길흉을 예측하지 않습니다.</p></div>}
    </section>
  </>;
}
export function RelationSection({columns,part,hanja=true}) {
  const [filter,setFilter]=useState('all'),[selectedId,setSelectedId]=useState(null);
  const items=useMemo(()=>relations(columns,part,filter),[columns,part,filter]);
  const selected=items.find(i=>i.id===selectedId)||items[0];
  const label=part==='stem'?'천간':'지지';
  return <section className="rr-relation-section" aria-label={`${label} 관계도`}>
    <div className="rr-section-label"><h2>{label}</h2><div className="rr-filter-pills">{[['all','전체'],['hap','합'],['clash','충·형·파·해']].map(([key,value])=><button type="button" key={key} className={filter===key?'active':''} aria-pressed={filter===key} aria-label={`${label} ${value} 보기`} onClick={()=>{setFilter(key);setSelectedId(null)}}>{value}</button>)}</div></div>
    <div className="rr-relation-scroll"><div className="rr-relation-body" style={{minWidth:columns.length>6?columns.length*56:undefined}}>
      <div className="rr-relation-columns" style={{gridTemplateColumns:`repeat(${columns.length},minmax(0,1fr))`}}>{columns.map(c=><div key={c.key}><span className="rr-col-name">{c.label}</span><Rune column={c} part={part} hanja={hanja} active={selected?.indices.includes(c.index)}/></div>)}</div>
      <div className="rr-relation-lines">{items.length?items.map((item,i)=>{
        const first=Math.min(...item.indices),last=Math.max(...item.indices),left=(first+.5)/columns.length*100,right=(last+.5)/columns.length*100;
        return <button type="button" key={item.id} className={`rr-relation-line ${selected?.id===item.id?'active':''}`} data-kind={item.type} aria-label={`${label} ${item.label} 관계 ${i+1}`} aria-pressed={selected?.id===item.id} onClick={()=>setSelectedId(item.id)}>
          <i className="rr-line-stroke" style={{left:left+'%',width:(right-left)+'%'}}/>{item.indices.map(n=><i key={n} className="rr-line-point" style={{left:(n+.5)/columns.length*100+'%'}}/>)}<span className="rr-line-name" style={{left:(left+right)/2+'%'}}>{item.label}</span>
        </button>;
      }):<p className="rr-empty">현재 계산 가능한 글자에 이 관계 조합이 없습니다.</p>}</div>
      {selected&&<div className="rr-relation-detail" aria-live="polite"><strong>{selected.label}</strong><p>{selected.detail}</p></div>}
      <p className="rr-subnote">전통 관계 조합표입니다. 합화 성립·실제 사건·길흉을 자동 판정하지 않습니다.</p>
    </div></div>
  </section>;
}
export function ShinsalGrid({columns,dayStem,hanja=true,onInfo,basis='both',onBasis,display}) {
  const bases=basis==='both'?['day','birthYear']:basis==='day'?['day']:basis==='year'?['birthYear']:[];
  const records=useMemo(()=>shinsalView(columns,bases),[columns,bases]);
  const toggle=key=>{const next=bases.includes(key)?bases.filter(k=>k!==key):[...bases,key];onBasis?.(next.length===2?'both':next[0]==='day'?'day':next[0]==='birthYear'?'year':'none');};
  return <section className="rr-shinsal-section" aria-label="신살 표">
    <div className="rr-section-label"><h2>신살</h2><div className="rr-basis-pills">{[['day','일'],['birthYear','년']].map(([key,text])=><button type="button" key={key} data-basis={key} aria-label={`${text} 기준 신살`} aria-pressed={bases.includes(key)} onClick={()=>toggle(key)}>{text}</button>)}<button type="button" aria-label="신살 지원 범위" onClick={()=>onInfo({title:'신살 지원 범위',text:'추가 조견표: 문창·금여·국인·태극·홍염·유하·천덕·월덕·천의·고신·과숙·홍란·천희·귀문을 연결했습니다. 학파별 다른 표를 전부 합한 것은 아닙니다. 십이신살은 삼합 그룹별 겁살 시작점에서 순서대로 배치하는 별도 조견표를 연결했습니다. 기존 길흉살에서는 천을귀인·양인·백호·괴강·원진을 표시합니다. 日/年은 기준 글자이며 柱는 해당 기둥의 조합입니다. 원진은 원국의 기존 거리 규칙을 유지합니다. 원본 앱의 추가 길신·흉살과 신살 가중치는 미검증입니다. 십이신살 참고는 점친당의 공개 만세력 엔진 조견표이며 원본 앱 코드 복원은 아닙니다. 미상 입력은 —로 남깁니다.'})}>?</button></div></div>
    <div className="rr-shinsal-scroll"><div className="rr-shinsal-table" style={{minWidth:columns.length>6?columns.length*56:undefined}}><SixPillars display={display} columns={columns} dayStem={dayStem} hanja={hanja} compact/>
      {[['movement','십이신살','연·일지 조견표'],['good','길신','기준별 조견표'],['caution','흉살','선언된 규칙표']].map(([key,title,note])=><React.Fragment key={key}>
        <div className="rr-shinsal-title"><span>{title}</span><small>{note}</small></div><div className="rr-shinsal-row" style={{gridTemplateColumns:`repeat(${columns.length},minmax(0,1fr))`}}>{records.map(r=><div key={r.column.key} className={'rr-shinsal-cell rr-tint-'+r.column.key}>{r[key].length?r[key].map((item,i)=><button type="button" key={item.name+item.basis+i} onClick={()=>onInfo({title:`${r.column.label} · ${item.name}`,text:`기준 ${item.basis==='日'?'일주':item.basis==='年'?'연주':'해당 주 조합'} · ${item.reason|| (key==='movement'?'삼합별 십이신살 조견표':'선언된 신살 조견표')} 조건에서 표시됩니다. 신살의 명칭만으로 길흉이나 사건을 확정하지 않습니다.`})}><small data-basis={item.basis}>{item.basis}</small><span>{item.name}</span></button>):<span className="rr-nohit" aria-label={r.column.label+' '+(r.column.kind==='unknown'?'입력 미확인':'연결 규칙에서 해당 없음')}>—</span>}</div>)}</div>
      </React.Fragment>)}
      <p className="rr-subnote">표의 ‘—’는 연결된 규칙의 결과입니다. 미연결 신살 전체가 없다는 뜻은 아닙니다.</p>
    </div></div>
  </section>;
}
