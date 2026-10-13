import React,{useState} from 'react';
import {selectedBackup} from '../vault/integrated-actions.js';
import {exportBackupFile} from '../vault/persistence.js';
export default function ExportSelection({vault,initialIds=[]}){
 const [ids,setIds]=useState(initialIds),[memo,setMemo]=useState(false),[status,setStatus]=useState(''),[busy,setBusy]=useState(false);
 return <section className="panel integration-export"><h2>선택한 명식 내보내기</h2><p className="muted">이름·출생정보가 파일에 포함됩니다. 원본 스크린샷 묶음은 제외하여 선택하지 않은 사람의 자료가 섞이지 않게 합니다.</p>
 <select aria-label="내보낼 그룹" defaultValue="" onChange={e=>{const g=vault.workspace?.groups.find(g=>g.id===e.target.value);setIds(g?g.entryIds:[]);}}><option value="">개별 선택</option>{(vault.workspace?.groups||[]).filter(g=>!g.deletedAt).map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select>
 <div style={{maxHeight:260,overflowY:'auto'}}>{vault.entries.filter(e=>!e.deletedAt).map(e=><label key={e.id}><input type="checkbox" aria-label={'내보내기 '+e.name} checked={ids.includes(e.id)} onChange={ev=>setIds(v=>ev.target.checked?[...v,e.id]:v.filter(id=>id!==e.id))}/>{e.name}</label>)}</div>
 <label><input type="checkbox" checked={memo} onChange={e=>setMemo(e.target.checked)}/>메모·사진·그림·수정 이력 포함</label><button type="button" className="primary full-width" disabled={!ids.length||busy} onClick={async()=>{setBusy(true);try{await exportBackupFile(selectedBackup(vault,ids,{withMemo:memo}));setStatus('선택 명식을 내보냈습니다.');}catch(e){setStatus(e.message);}finally{setBusy(false);}}}>선택 {ids.length}명 내보내기</button><p role="status">{status}</p></section>;
}
