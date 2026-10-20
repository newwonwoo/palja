import React,{useEffect,useRef,useState} from 'react';
import {DEFAULT_READING_ORDER,READING_TABS,moveReadingTab} from '../vault/reading-order.js';
import {savePreferences} from '../vault/workspace-actions.js';

function OrderEditor({value,change,busy,onClose}){
 const ref=useRef(null),[draft,setDraft]=useState(()=>[...value]),[error,setError]=useState('');
 useEffect(()=>{const d=ref.current;d.showModal();return()=>d.close();},[]);
 const save=async()=>{setError('');if(await change(s=>savePreferences(s,{readingOrder:[...draft]}),'풀이 보기 순서를 저장했습니다.'))onClose();else setError('순서를 저장하지 못했습니다. 다시 확인해 주세요.');};
 return <dialog className="vault-dialog reading-order-dialog" ref={ref} aria-label="풀이 보기 순서 변경" onCancel={e=>{e.preventDefault();if(!busy)onClose();}}>
  <div className="dialog-heading"><h2>풀이 보기 순서 변경</h2></div><p>위아래로 옮긴 뒤 확인을 누르면 저장됩니다.</p>
  <ol>{draft.map((key,i)=><li key={key}><strong>{READING_TABS[key]}</strong><button type="button" disabled={busy||i===0} aria-label={`${READING_TABS[key]} 위로`} onClick={()=>setDraft(s=>moveReadingTab(s,key,-1))}>↑</button><button type="button" disabled={busy||i===draft.length-1} aria-label={`${READING_TABS[key]} 아래로`} onClick={()=>setDraft(s=>moveReadingTab(s,key,1))}>↓</button></li>)}</ol>
  <button type="button" className="secondary" disabled={busy} onClick={()=>setDraft([...DEFAULT_READING_ORDER])}>기본 순서</button>
  {error&&<p role="alert">{error}</p>}<div className="reading-order-actions"><button type="button" className="secondary" disabled={busy} onClick={onClose}>취소</button><button type="button" disabled={busy} onClick={save}>확인</button></div>
 </dialog>;
}
export default function ReadingOrderSettings({value,change,busy}){
 const [open,setOpen]=useState(false);
 return <section className="panel"><h2>풀이 보기 순서</h2><p className="muted">{value.map(k=>READING_TABS[k]).join(' → ')}</p><button type="button" className="secondary" disabled={busy} onClick={()=>setOpen(true)}>풀이 보기 순서 변경</button>{open&&<OrderEditor value={value} change={change} busy={busy} onClose={()=>setOpen(false)}/>}</section>;
}
