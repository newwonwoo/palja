import React,{useState} from 'react';
import {PUBLIC_PEOPLE,addPublicPerson} from './public-people.js';
export default function PublicPeople({vault,change,navigate,busy}){
 const [query,setQuery]=useState(''),[category,setCategory]=useState('');
 const people=PUBLIC_PEOPLE.filter(p=>(!category||p.category===category)&&(p.name+' '+p.place).includes(query.trim()));
 return <section className="completion-box" aria-label="공개 인물 자료"><h1>공개 인물 자료</h1><p>출처를 확인한 3명의 생년월일과 출생지를 오프라인으로 제공합니다. 시각이 확인되지 않아 시주·대운 방향을 만들지 않습니다. 전기상의 업적을 사주와 연결해 검증된 인과로 해석하지 않습니다.</p><div className="completion-filter"><label>이름·장소<input aria-label="공개 인물 검색" type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label><label>분류<select aria-label="공개 인물 분류" value={category} onChange={e=>setCategory(e.target.value)}><option value="">전체</option>{[...new Set(PUBLIC_PEOPLE.map(p=>p.category))].map(c=><option key={c}>{c}</option>)}</select></label></div>
 {people.map(p=>{const entry=vault.entries.find(e=>e.birth.public_profile?.id===p.id);return <article className="completion-box" key={p.id}><h2>{p.name}</h2><p>{p.date} · {p.place} · {p.category}</p><p><a href={p.url} target="_blank" rel="noreferrer">출처: {p.publisher}</a> · 확인 2026-10-20</p><p>원문 링크 확인에는 인터넷이 필요합니다. 명식 추가·조회·백업은 오프라인으로 동작합니다.</p><button type="button" className="rr-primary-action" disabled={busy||Boolean(entry?.deletedAt)} onClick={async()=>{let target=entry;if(!target){const saved=await change(s=>addPublicPerson(s,p.id),'공개 인물을 보관함에 추가했습니다.');target=saved?.state.entries.find(e=>e.birth.public_profile?.id===p.id);}if(target)navigate({name:'details',id:target.id});}}>{entry?.deletedAt?'휴지통에서 복원 필요':entry?'보관한 명식 열기':'근거와 함께 보관함에 추가'}</button></article>;})}
 {!people.length&&<p>조건에 맞는 공개 인물이 없습니다.</p>}
 </section>;
}
