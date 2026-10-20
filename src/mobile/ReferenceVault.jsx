import React, { useMemo, useState } from 'react';
import { referenceDay } from './engine.js';
import {
  ageBadge, dayGlyphs, referenceBirthLabel, stemColor, branchColor,
  filterAndSortEntries, LIST_SORT_OPTIONS,
} from './list-utils.js';
import './reference-vault.css';
import './workspace.css';
import { activeGroups, readPreferences } from '../vault/workspace.js';
import { savePreferences } from '../vault/workspace-actions.js';
import {EMPTY_MATCH_SELECTION,toggleMatchSelection,matchSelectionEntries} from './match-selection.js';
import ProfileBanners from './ProfileBanners.jsx';
import './profile-banners.css';

function RefIcon({ name, size = 23, fill = false }) {
  const paths = {
    close: <path d="M5 5l14 14M19 5L5 19" />,
    personAdd: <><circle cx="10" cy="7.5" r="4" /><path d="M2.5 21c0-4 3-6.5 7.5-6.5 1.4 0 2.7.2 3.8.8M18 14v8m-4-4h8" /></>,
    edit: <><rect x="3" y="4" width="13" height="17" rx="2" /><path d="M7 8h5m-5 4h4M17 6l3 3-7 7-4 1 1-4 7-7z" /></>,
    vault: <><rect x="3" y="5" width="18" height="14" rx="3" /><rect x="13" y="8" width="5" height="6" rx="1" /></>,
    heart: <path d="M12 20.5 3.3 12a5.1 5.1 0 0 1 7.2-7.2L12 6.3l1.5-1.5a5.1 5.1 0 0 1 7.2 7.2L12 20.5z" />,
    gear: <><path d="m10.5 2-.4 2.2-2.2 1.2-2-.8-2 3.5 1.6 1.5v2.6L4 13.6l2 3.5 2-.8 2.2 1.2.4 2.5h4l.4-2.5 2.2-1.2 2 .8 2-3.5-1.6-1.4V9.5l1.6-1.4-2-3.5-2 .8-2.2-1.2L14.5 2z" /><circle cx="12.5" cy="11.5" r="2.9" /></>,
    person: <><circle cx="12" cy="7.5" r="4" /><path d="M4 21v-1c0-4.5 3-7.5 8-7.5s8 3 8 7.5v1" /></>,
    clock: <><circle cx="12" cy="12" r="9.5" /><path d="M12 5.5v7l4.5 3M2.5 7.5h4v-4" /></>,
    search: <><circle cx="10.8" cy="10.8" r="7" /><path d="m16 16 5.5 5.5" /></>,
    star: <path d="m12 2.5 3 6.3 7 .9-5.1 5 1.2 7-6.1-3.2-6.2 3.2 1.2-7-5-5 7-.9z" />,
    check: <path d="m4 12 5 5L20 6" />,
    chevron: <path d="m9 5 7 7-7 7" />,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function PersonRow({ entry, self = false, open, favorite, busy, compact, comparison, selected, select, ageNotation }) {
  const age = ageBadge(entry, new Date(), ageNotation);
  const rawDay = referenceDay(entry);
  const day = dayGlyphs(entry, rawDay);
  const label = referenceBirthLabel(entry);
  return <li className={'ref-row' + (compact ? ' compact' : '') + (selected ? ' checked' : '')}>
    <button className="ref-person" onClick={() => comparison ? select(entry.id) : open(entry.id)} aria-pressed={comparison ? selected : undefined}>
      <span className={'ref-age ' + (entry.referenceDisplay?.badge_color === 'pink' ? 'pink' : entry.referenceDisplay?.badge_color === 'teal' ? 'teal' : 'neutral')} title={age.captured ? '원본 화면에 기록된 나이' : ageNotation === 'korean' ? '옛 한국 나이' : '생일 기준 만나이'}>{age.text}</span>
      <span className="ref-day" title={day.captured ? '원본 화면에 표시된 일주' : '계산된 일주'}><span data-color={stemColor(day.stem)}>{day.stem}</span><span data-color={branchColor(day.branch)}>{day.branch}</span></span>
      <span className="ref-person-info"><strong>{entry.name}</strong><span className="ref-birth">{label}</span></span>
      {comparison && <span className="ref-selected" aria-hidden="true">{selected && <RefIcon name="check" size={17} />}</span>}
    </button>
    {!self && !comparison && <button type="button" className={'ref-favorite ' + (entry.favorite ? 'active' : '')} aria-label={entry.name + (entry.favorite ? ' 즐겨찾기 해제' : ' 즐겨찾기 추가')} aria-pressed={entry.favorite} disabled={busy} onClick={() => favorite(entry.id)}><RefIcon name="star" size={25} fill={entry.favorite} /></button>}
  </li>;
}

function ComparisonPanel({ selection, entries, open, close, compare }) {
  const {basis,partner}=matchSelectionEntries(selection,entries);
  const chosen = [basis,partner].filter(Boolean);
  if (!chosen.length) return null;
  return <div className="ref-comparison" role="status" aria-live="polite">
    <div className="ref-compare-top"><strong>궁합 비교</strong><span>{chosen.length}/2 선택</span><button type="button" onClick={close}>취소</button></div>
    <div className="ref-compare-cards">{chosen.map(entry => { const day = dayGlyphs(entry, referenceDay(entry)); return <div key={entry.id}><small>{entry===basis?'기준 명식':'상대 명식'}</small><strong>{entry.name}</strong><span>{day.stem}{day.branch} · {referenceBirthLabel(entry)}</span></div>; })}</div>
    <div className="ref-compare-actions"><button type="button" disabled={!basis||!partner} onClick={()=>compare(basis.id,partner.id)}>궁합 확인 <RefIcon name="chevron" size={15}/></button>{chosen.length === 2 ? chosen.map(entry => <button key={entry.id} type="button" onClick={() => open(entry.id)}>{entry.name} 상세 보기</button>) : <small>{basis?'상대 명식':'기준 명식'}을 선택하세요.</small>}</div>
  </div>;
}

export default function ReferenceVault({ vault, navigate, open, favorite, busy, change, onExit }) {
  const [tab, setTab] = useState('friends');
  const [search, setSearch] = useState('');
  const { sort, compact, ageNotation } = readPreferences(vault);
  const setSort = sort => change(state => savePreferences(state,{sort}));
  const [groupId, setGroupId] = useState('');
  const groups = activeGroups(vault);
  const selectedGroup = groups.find(g => g.id === groupId);
  const groupActive = Boolean(selectedGroup) || groupId === 'ungrouped';
  const [compare, setCompare] = useState(false);
  const [selection, setSelection] = useState(EMPTY_MATCH_SELECTION);
  const entries = useMemo(() => vault.entries.filter(e => !e.deletedAt), [vault.entries]);
  const favorites = entries.filter(e => e.favorite);
  const friends = entries.filter(e => !e.favorite);
  const queryActive = Boolean(search.trim());
  const limited = queryActive || groupActive;
  const recent = useMemo(() => vault.recent.map(item => entries.find(e => e.id === item.entryId)).filter(Boolean).filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i), [vault.recent, entries]);
  const pool = tab === 'recent' ? recent : entries;
  const groupedIds = new Set(groups.flatMap(g => g.entryIds));
  const visible = selectedGroup ? pool.filter(e => selectedGroup.entryIds.includes(e.id)) : groupId === 'ungrouped' ? pool.filter(e=>!groupedIds.has(e.id)) : pool;
  const matching = useMemo(() => filterAndSortEntries(visible, {query:search, sort:tab === 'recent' ? 'recent' : sort,
    dayOf:referenceDay, ageNotation}), [visible, search, sort, tab, ageNotation]);
  // Recent items must preserve access order, not fall back to 가나다순.
  const ordered = tab === 'recent' ? visible.filter(e => matching.includes(e)) : matching;
  const sections = tab === 'recent' ? [{ key:'recent', title:'최근 입력', count:ordered.length, items:ordered }] : limited
    ? [{ key:'search', title:queryActive?'검색 결과':selectedGroup?.name || '미분류', count:ordered.length, items:ordered }]
    : [
        { key:'favorites', title:'즐겨찾기', count:favorites.length, items:ordered.filter(e => e.favorite) },
        { key:'friends', title:'친구', count:friends.length, items:ordered.filter(e => !e.favorite) },
      ];
  const toggleCompare = () => { setCompare(v => !v); setSelection(EMPTY_MATCH_SELECTION); };
  const select = id => setSelection(current => toggleMatchSelection(current,id));
  return <div className="reference-vault" data-comparing={compare} data-testid="reference-vault">
    <div className="ref-fixed">
      <header className="ref-topbar"><button type="button" className="ref-toolbar-button" title="앱 종료" aria-label="앱 종료" disabled={busy} onClick={onExit}><RefIcon name="close" size={23} /></button><span className="ref-mobile-title">명식 보관함</span><div className="ref-right-icons"><button className="ref-toolbar-button" aria-label="명식 추가" onClick={() => navigate({name:'form'})}><RefIcon name="personAdd" size={25} /></button><button className="ref-toolbar-button" aria-label="명식 관리" onClick={() => navigate({name:'settings'})}><RefIcon name="edit" size={25} /></button></div></header>
      <div className="ref-quick-links" aria-label="바로가기">
        {[{key:'custom',icon:'vault',title:'커스텀',action:()=>navigate({name:'form',mode:'pillars'})},{key:'compare',icon:'heart',title:'궁합 모드',action:toggleCompare},{key:'settings',icon:'gear',title:'설정',action:()=>navigate({name:'settings'})}].map(x=><button type="button" key={x.key} className={x.key==='compare'&&compare?'active':''} onClick={x.action}><span className="ref-shortcut-icon"><RefIcon name={x.icon} size={24} fill={x.key==='compare'} /></span><span>{x.title}</span></button>)}
      </div>
      <div className="ref-filterbar">
        <div className="ref-tabs" aria-label="명식 목록 구분"><button type="button" aria-pressed={tab==='friends'} className={tab==='friends'?'active':''} onClick={()=>{setTab('friends');setSelection(EMPTY_MATCH_SELECTION);}}><RefIcon name="person" size={21}/>친구</button><button type="button" aria-pressed={tab==='recent'} className={tab==='recent'?'active':''} onClick={()=>{setTab('recent');setSelection(EMPTY_MATCH_SELECTION);}}><RefIcon name="clock" size={21}/>최근 입력</button></div>
        <div className="ref-searchrow"><label className="ref-search"><RefIcon name="search" size={22}/><input type="search" aria-label="명식 검색" autoComplete="off" value={search} onChange={e=>setSearch(e.target.value)} placeholder="이름 / 생년월일시 / 나이 / 일주 검색"/>{queryActive && <button type="button" className="ref-clear" aria-label="검색어 지우기" onClick={()=>setSearch('')}>×</button>}</label><select aria-label="정렬" className="ref-sort" value={sort} onChange={e=>setSort(e.target.value)} disabled={busy||tab==='recent'}>{LIST_SORT_OPTIONS.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
        {groups.length > 0 && <div className="ref-group-filter"><select aria-label="그룹 필터" value={groupId} onChange={e=>setGroupId(e.target.value)}><option value="">전체 그룹</option><option value="ungrouped">미분류</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select><button type="button" onClick={()=>navigate({name:'groups'})}>그룹 관리</button><button type="button" onClick={()=>navigate({name:'bulk'})}>일괄 관리</button></div>}
      </div>
    </div>
    <div className="ref-results">
      {!compare&&!limited&&tab==='friends'&&<ProfileBanners vault={vault} settings={readPreferences(vault).profileBanners} open={open} navigate={navigate} busy={busy}/>}
      {sections.filter(section=>section.items.length || (!limited && section.key!=='me')).map(section=><section className={'ref-section section-'+section.key} key={section.key} aria-label={section.title}>
        <h2>{section.title}{section.count!==null&&<span> {section.count}</span>}</h2>
        <ul className="ref-people">{section.items.map(entry=><PersonRow key={entry.id} entry={entry} self={section.key==='me'} open={open} favorite={favorite} busy={busy} compact={compact} comparison={compare} selected={selection.basisId===entry.id||selection.partnerId===entry.id} select={select} ageNotation={ageNotation}/>)}</ul>
      </section>)}
      {!ordered.length && <section className="ref-no-results"><RefIcon name="search" size={29}/><strong>{queryActive?'검색 결과가 없습니다':groupActive?'이 그룹에 명식이 없습니다':tab==='recent'?'최근 입력한 명식이 없습니다':'아직 명식이 없습니다'}</strong><p>{queryActive?'이름·날짜·나이·일주를 바꿔 검색해 보세요.':'오른쪽 상단의 추가 버튼으로 명식을 등록할 수 있습니다.'}</p></section>}
      {entries.some(e=>e.source) && <p className="ref-accuracy">원본에서 가져온 나이·일주는 저장 당시 표시값입니다. 역법·성별이 확인되지 않은 명식은 임의로 계산하지 않습니다.</p>}
    </div>
    {compare && <ComparisonPanel selection={selection} entries={entries} open={open} compare={(id,compareId)=>navigate({name:'details',id,compareId,panel:'compare'})} close={()=>{setCompare(false);setSelection(EMPTY_MATCH_SELECTION);}}/>}
  </div>;
}
