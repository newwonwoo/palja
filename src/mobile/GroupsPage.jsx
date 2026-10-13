import React, { useMemo, useState } from 'react';
import { saveGroup, deleteGroup, restoreGroup } from '../vault/workspace-actions.js';
import { activeGroups } from '../vault/workspace.js';
import { referenceBirthLabel } from './list-utils.js';
import './workspace.css';

export default function GroupsPage({ vault, change, busy }) {
  const groups = activeGroups(vault);
  const [draft, setDraft] = useState(null);
  const [query, setQuery] = useState('');
  const [removing, setRemoving] = useState(null);
  const [message, setMessage] = useState('');
  const entries = useMemo(() => vault.entries.filter(e => !e.deletedAt), [vault.entries]);
  const matches = useMemo(() => entries.filter(e => (e.name+' '+e.memo).toLocaleLowerCase('ko').includes(query.trim().toLocaleLowerCase('ko'))), [entries,query]);
  const edit = group => { setDraft(group ? {...group,entryIds:[...group.entryIds]} : {name:'',entryIds:[]}); setQuery('');setMessage('');setRemoving(null); };
  const toggle = id => setDraft(d => ({...d,entryIds:d.entryIds.includes(id)?d.entryIds.filter(x=>x!==id):[...d.entryIds,id]}));
  const save = async e => {
    e.preventDefault();
    const result = await change(state => saveGroup(state,draft),'그룹을 저장했습니다.');
    if (result) {setDraft(null);setMessage('그룹 저장 완료');}
  };
  return <section className="workspace-page" aria-label="그룹 관리">
    <div className="workspace-title"><h1>그룹 관리</h1>{!draft&&<button className="small-button" type="button" onClick={()=>edit(null)}>그룹 만들기</button>}</div>
    <p className="muted">한 명식을 여러 그룹에 담을 수 있습니다. 그룹을 삭제해도 명식은 남습니다.</p>
    {message&&<p role="status">{message}</p>}
    {draft ? <form className="panel group-editor" onSubmit={save}><fieldset disabled={busy}><legend>{draft.id?'그룹 편집':'새 그룹'}</legend>
      <label>그룹 이름<input aria-label="그룹 이름" value={draft.name} maxLength={80} required autoFocus onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/></label>
      <label>담을 명식 찾기<input type="search" aria-label="그룹 명식 검색" value={query} onChange={e=>setQuery(e.target.value)} placeholder="이름 또는 메모"/></label>
      <div className="group-selection-summary"><strong>{draft.entryIds.filter(id=>entries.some(e=>e.id===id)).length}명 선택</strong><button className="text-button" type="button" onClick={()=>setDraft(d=>({...d,entryIds:[...new Set([...d.entryIds,...matches.map(e=>e.id)])]}))}>검색 결과 전체 선택</button></div>
      <ul className="group-members">{matches.map(entry=><li key={entry.id}><label><input type="checkbox" checked={draft.entryIds.includes(entry.id)} onChange={()=>toggle(entry.id)}/><span><strong>{entry.name}</strong><small>{referenceBirthLabel(entry)}</small></span></label></li>)}</ul>
      {!matches.length&&<p className="muted">검색 결과가 없습니다.</p>}
      <div className="button-row"><button type="button" className="secondary" onClick={()=>setDraft(null)}>취소</button><button type="submit" className="primary">그룹 저장</button></div>
    </fieldset></form> : <>
      <ul className="group-list">{groups.map(group=><li className="panel" key={group.id}><div><h2>{group.name}</h2><p className="muted">{group.entryIds.filter(id=>entries.some(e=>e.id===id)).length}명</p></div><button type="button" className="small-button" onClick={()=>edit(group)} aria-label={group.name+' 그룹 편집'}>편집</button><button type="button" className="text-button danger" onClick={()=>setRemoving(group)} aria-label={group.name+' 그룹 삭제'}>삭제</button></li>)}</ul>
      {!groups.length&&<section className="panel"><p>아직 그룹이 없습니다.</p><button type="button" className="primary" onClick={()=>edit(null)}>첫 그룹 만들기</button></section>}
      {removing&&<section className="panel" role="alert" aria-label="그룹 삭제 확인"><p><strong>{removing.name}</strong> 그룹만 휴지통으로 옮깁니다. 명식은 삭제하지 않습니다.</p><div className="button-row"><button type="button" className="secondary" onClick={()=>setRemoving(null)}>취소</button><button type="button" className="danger-button" disabled={busy} onClick={async()=>{if(await change(state=>deleteGroup(state,removing.id),'그룹을 휴지통으로 옮겼습니다.'))setRemoving(null);}}>그룹만 삭제</button></div></section>}
      <details className="panel"><summary>삭제한 그룹</summary>{(vault.workspace?.groups||[]).filter(g=>g.deletedAt).map(g=><div className="group-trash-row" key={g.id}><span>{g.name}</span><button type="button" className="small-button" disabled={busy} onClick={()=>change(state=>restoreGroup(state,g.id),'그룹을 복원했습니다.')} aria-label={g.name+' 그룹 복원'}>복원</button></div>)}</details>
    </>}
  </section>;
}
