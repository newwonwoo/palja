import React,{useEffect,useRef,useState} from 'react';
import {integrated,saveNote,setNoteDeleted,restoreNoteVersion} from '../vault/integrated-actions.js';
const today=()=>new Date(Date.now()+9*3600000).toISOString().slice(0,10);
async function compactImage(file) {
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024)throw new Error('사진은 12MB 이하 JPG/PNG/WebP로 선택하세요.');
 const bitmap=await createImageBitmap(file);try{const scale=Math.min(1,1280/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
 const data=canvas.toDataURL('image/jpeg',.72);if(data.length>1100000)throw new Error('사진이 너무 큽니다. 더 작은 사진으로 선택하세요.');return data;}finally{bitmap.close();}
}
function DrawingPad({value,onChange}) {
 const canvas=useRef(null),down=useRef(false),[color,setColor]=useState('#48566b'),[width,setWidth]=useState(4),[eraser,setEraser]=useState(false),[undo,setUndo]=useState([]);
 useEffect(()=>{const c=canvas.current,ctx=c.getContext('2d');ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,c.width,c.height);if(value){const img=new Image();let live=true;img.onload=()=>{if(live)ctx.drawImage(img,0,0,c.width,c.height);};img.src=value;return()=>{live=false;};}},[value]);
 const xy=e=>{const c=canvas.current,r=c.getBoundingClientRect();return[(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height];};
 return <div className="integration-drawing"><label>펜 색<input type="color" aria-label="펜 색" value={color} onChange={e=>setColor(e.target.value)}/></label><label>펜 굵기<input type="range" aria-label="펜 굵기" min="1" max="24" value={width} onChange={e=>setWidth(Number(e.target.value))}/><span>{width}</span></label><button type="button" aria-pressed={eraser} onClick={()=>setEraser(!eraser)}>{eraser?'펜으로 전환':'지우개로 전환'}</button><button type="button" disabled={!undo.length} onClick={()=>{const previous=undo.at(-1);setUndo(h=>h.slice(0,-1));onChange(previous);}}>획 되돌리기</button><canvas ref={canvas} width="640" height="360" aria-label="메모 그림판" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);down.current=true;setUndo(h=>[...h,value||null].slice(-20));const ctx=canvas.current.getContext('2d');ctx.globalCompositeOperation=eraser?'destination-out':'source-over';ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...xy(e));}} onPointerMove={e=>{if(!down.current)return;const ctx=canvas.current.getContext('2d');ctx.lineTo(...xy(e));ctx.stroke();}} onPointerUp={()=>{if(down.current){down.current=false;onChange(canvas.current.toDataURL('image/png'));}}} onPointerCancel={()=>{down.current=false;}}/><button type="button" onClick={()=>{setUndo(h=>[...h,value||null].slice(-20));canvas.current.getContext('2d').clearRect(0,0,640,360);onChange(null);}}>그림 지우기</button></div>;
}
export default function Journal({entry,vault,change,busy,draft,setDraft,selection,onApplySelection,working,setWorking}) {
 const [query,setQuery]=useState(''),[error,setError]=useState(''),[deleting,setDeleting]=useState(null),[preview,setPreview]=useState(null),[draw,setDraw]=useState(false);
 const dialog=useRef(null);
 useEffect(()=>{if(preview&&dialog.current)dialog.current.showModal();},[preview]);
 const all=integrated(vault).notes.filter(n=>n.entryId===entry.id),notes=all.filter(n=>!n.deletedAt&&[n.title,n.text,n.category,n.date].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a,b)=>b.date.localeCompare(a.date)||b.updatedAt.localeCompare(a.updatedAt));
 const edit=n=>{if(draft&&!window.confirm('작성 중인 내용을 버리고 다른 메모를 열까요?'))return;setDraft(n?JSON.parse(JSON.stringify(n)):{title:'',date:today(),category:'',text:'',images:[],drawing:null,selection:selection||null});setError('');setDraw(Boolean(n?.drawing));};
 const update=(k,v)=>setDraft(d=>({...d,[k]:v}));
 const save=async e=>{e?.preventDefault();if(working)return;const ok=await change(s=>saveNote(s,entry.id,draft),'날짜별 메모를 저장했습니다.');if(ok)setDraft(null);};
 return <section className="integration-journal"><div className="workspace-title"><h2>날짜별 상담 기록</h2>{!draft&&<button type="button" className="small-button" onClick={()=>edit(null)}>기록 추가</button>}</div>
 <p className="rr-subnote">기존 한 줄 메모는 그대로 유지합니다. 사진·그림·운 선택과 수정 이력은 백업에 포함됩니다. 전체 저장 한도 8MiB.</p>
 {draft?<form onSubmit={save} className="integration-note-form"><fieldset disabled={busy||working}>
 <label>제목<input aria-label="기록 제목" required maxLength="120" value={draft.title} onChange={e=>update('title',e.target.value)}/></label>
 <div className="integration-grid2"><label>날짜<input type="date" aria-label="기록 날짜" required value={draft.date} onChange={e=>update('date',e.target.value)}/></label><label>분류<input aria-label="기록 분류" maxLength="80" value={draft.category} onChange={e=>update('category',e.target.value)}/></label></div>
 <label>본문<textarea aria-label="기록 본문" value={draft.text} maxLength="20000" rows="5" onChange={e=>update('text',e.target.value)}/></label>
 <label>사진 첨부 · 최대 4장<input type="file" aria-label="기록 사진 첨부" accept="image/jpeg,image/png,image/webp" multiple onChange={async e=>{const chosen=Array.from(e.target.files||[]);e.target.value='';if(draft.images.length+chosen.length>4){setError('사진은 최대 4장입니다.');return;}setWorking(true);setError('');try{const result=await Promise.all(chosen.map(compactImage));setDraft(d=>d?({...d,images:[...d.images,...result]}):d);}catch(err){setError(err.message);}finally{setWorking(false);}}}/></label>
 <div className="integration-images">{draft.images.map((image,i)=><div key={i}><img src={image} alt={'첨부 사진 '+(i+1)}/><button type="button" aria-label={'사진 '+(i+1)+' 제거'} onClick={()=>update('images',draft.images.filter((_,n)=>n!==i))}>제거</button></div>)}</div>
 <button type="button" className="small-button" onClick={()=>setDraw(!draw)}>{draw?'그림판 접기':'그림 그리기'}</button>{draw&&<DrawingPad value={draft.drawing} onChange={v=>update('drawing',v)}/>}
 <label className="rr-check"><input type="checkbox" checked={Boolean(draft.selection)} onChange={e=>update('selection',e.target.checked?selection:null)}/>현재 선택운 함께 기록</label>
 {draft.selection&&<p className="rr-subnote">{draft.selection.date} {String(draft.selection.hour).padStart(2,'0')}:{String(draft.selection.minute).padStart(2,'0')}</p>}
 {error&&<p role="alert">{error}</p>}<div className="rr-dialog-actions"><button type="button" onClick={()=>{if(window.confirm('작성 내용을 버릴까요?'))setDraft(null);}}>작성 취소</button><button type="submit">기록 저장</button></div></fieldset></form>:<>
 <label>기록 검색<input type="search" aria-label="기록 검색" placeholder="제목·본문·날짜·분류" value={query} onChange={e=>setQuery(e.target.value)}/></label>
 {notes.map(n=><article className="integration-note" key={n.id}><div><h3>{n.title}</h3><small>{n.date} · {n.category||'미분류'}</small></div><p>{n.text}</p><div className="integration-images">{[...n.images,...(n.drawing?[n.drawing]:[])].map((img,i)=><button type="button" key={i} aria-label={n.title+' 첨부 '+(i+1)+' 크게 보기'} onClick={()=>setPreview(img)}><img src={img} alt="첨부 이미지"/></button>)}</div>
 {n.selection&&<button type="button" className="rr-small-link" onClick={()=>onApplySelection(n.selection)}>기록 당시 운 선택 · {n.selection.date}</button>}
 <div className="rr-dialog-actions"><button type="button" onClick={()=>edit(n)}>기록 수정</button><button type="button" onClick={()=>setDeleting(n.id)}>기록 삭제</button></div>
 {!!n.history.length&&<details><summary>수정 이력 {n.history.length}</summary>{n.history.map((h,i)=><div key={i}><span>{h.at.slice(0,16)} · {h.title}</span><button type="button" disabled={busy} onClick={()=>change(s=>restoreNoteVersion(s,n.id,i),'이전 메모를 복원했습니다.')}>이 버전 복원</button></div>)}</details>}
 </article>)}{!notes.length&&<p className="rr-empty">날짜별 기록이 없습니다.</p>}
 <details><summary>삭제한 기록 {all.filter(n=>n.deletedAt).length}</summary>{all.filter(n=>n.deletedAt).map(n=><div className="integration-note" key={n.id}>{n.title}<button type="button" disabled={busy} onClick={()=>change(s=>setNoteDeleted(s,n.id,false),'기록을 복원했습니다.')}>기록 복원</button></div>)}</details>
 </>}
 {deleting&&<div role="alert" className="integration-note"><p>이 기록을 휴지통으로 옮길까요?</p><button type="button" onClick={()=>setDeleting(null)}>취소</button><button type="button" disabled={busy} onClick={async()=>{if(await change(s=>setNoteDeleted(s,deleting,true),'기록을 삭제했습니다.'))setDeleting(null);}}>기록만 삭제</button></div>}
 {preview&&<dialog className="rr-dialog" ref={dialog} aria-label="첨부 이미지 확대" onCancel={()=>setPreview(null)}><button type="button" onClick={()=>setPreview(null)}>닫기</button><img src={preview} alt="저장 이미지 보기" style={{width:'100%',height:'auto'}}/></dialog>}
 </section>;
}
