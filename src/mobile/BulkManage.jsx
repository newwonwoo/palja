import React,{useMemo,useState} from 'react';
import {activeGroups} from '../vault/workspace.js';
import {batchGroupEntries,batchTrashEntries} from '../vault/workspace-actions.js';
import {referenceBirthLabel} from './list-utils.js';
import './bulk-manage.css';
export default function BulkManage({vault,change,busy,navigate}){
 const [search,setSearch]=useState(''),[selected,setSelected]=useState([]),[groupId,setGroupId]=useState(''),[intent,setIntent]=useState(null);
 const entries=useMemo(()=>vault.entries.filter(e=>!e.deletedAt),[vault.entries]);
 const groups=activeGroups(vault);
 const matches=entries.filter(e=>e.name.toLocaleLowerCase('ko').includes(search.trim().toLocaleLowerCase('ko'))||String(e.birth?.date_raw||'').includes(search.trim()));
 const chosen=entries.filter(e=>selected.includes(e.id));
 const toggle=id=>setSelected(list=>list.includes(id)?list.filter(x=>x!==id):[...list,id]);
 const apply=async()=>{
   const ids=[...selected],mode=intent;
   const outcome=await change(s=>mode==='trash'?batchTrashEntries(s,ids):batchGroupEntries(s,{ids,groupId,mode}),mode==='trash'?'선택한 명식을 휴지통으로 옮겼습니다.':'그룹 배정을 변경했습니다.');
   if(outcome){setSelected([]);setIntent(null);}
 };
 return <section className="bm-page"><header><h1>명식 일괄 관리</h1><p>명식 원본·메모를 유지하면서 그룹을 여러 건 관리합니다. 삭제는 휴지통으로 이동합니다.</p></header>
 <div className="bm-panel"><label>명식 검색<input type="search" aria-label="일괄 명식 검색" placeholder="이름 또는 저장 생년월일" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="bm-action-row"><strong>{selected.length}명 선택</strong><button type="button" onClick={()=>setSelected(list=>[...new Set([...list,...matches.map(e=>e.id)])])}>검색 결과 전체 선택</button><button type="button" onClick={()=>setSelected([])}>선택 해제</button></div>
 <ul className="bm-list">{matches.map(e=><li key={e.id}><label><input type="checkbox" checked={selected.includes(e.id)} onChange={()=>toggle(e.id)}/><span><b>{e.name}</b><small>{referenceBirthLabel(e)}</small></span></label></li>)}</ul>{matches.length===0&&<p>검색한 명식이 없습니다.</p>}</div>
 <div className="bm-panel"><label>대상 그룹<select aria-label="일괄 대상 그룹" value={groupId} onChange={e=>setGroupId(e.target.value)}><option value="">그룹 선택</option>{groups.map(g=><option value={g.id} key={g.id}>{g.name}</option>)}</select></label><div className="bm-action-row"><button type="button" disabled={busy||selected.length===0||!groupId} onClick={()=>setIntent('add')}>그룹에 추가</button><button type="button" disabled={busy||selected.length===0||!groupId} onClick={()=>setIntent('remove')}>그룹에서 제외</button><button className="bm-danger" type="button" disabled={busy||selected.length===0} onClick={()=>setIntent('trash')}>휴지통 이동</button></div>{!groups.length&&<p>그룹이 없습니다. <button type="button" onClick={()=>navigate({name:'groups'})}>그룹 관리로 이동</button></p>}</div>
 {intent&&<section className="bm-confirm" role="alertdialog" aria-label="일괄 변경 확인" aria-modal="true"><h2>선택한 {chosen.length}명의 명식을 {intent==='trash'?'휴지통으로 옮길까요?':intent==='add'?'그룹에 추가할까요?':'그룹에서 제외할까요?'}</h2><p>일괄 작업은 현재 기기에 저장됩니다. 휴지통에 들어간 명식은 설정에서 복원할 수 있습니다.</p><div className="bm-action-row"><button type="button" onClick={()=>setIntent(null)} disabled={busy}>취소</button><button type="button" onClick={apply} disabled={busy}>{busy?'처리 중':'확인'}</button></div></section>}
 </section>;
}
