import React,{useEffect,useState} from 'react';
import {birthdayEntries} from './profile-banner-model.js';
import {referenceBirthLabel} from './list-utils.js';
import {PROFILE_BANNERS} from '../vault/profile-banners.js';
export default function ProfileBanners({vault,settings,open,navigate,busy}){
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{const refresh=()=>setNow(new Date()),timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};},[]);
 const self=vault.entries.find(e=>e.id===vault.selfId&&!e.deletedAt),birthday=birthdayEntries(vault.entries,now).filter(e=>e.id!==vault.selfId);
 return <section className="profile-banners" aria-label="프로필 배너">{settings.order.filter(k=>!settings.hidden.includes(k)).map(key=><section className="profile-banner" key={key} aria-label={PROFILE_BANNERS[key]+' 배너'}><h2>{PROFILE_BANNERS[key]}</h2>{key==='my'?(self?<button type="button" disabled={busy} onClick={()=>open(self.id)}><strong>{self.name}</strong><small>{referenceBirthLabel(self)}</small></button>:<button type="button" disabled={busy} onClick={()=>navigate({name:'form'})}>내 명식 등록 <small>등록 후 관리에서 내 명식으로 지정하세요.</small></button>):key==='current'?<button type="button" disabled={busy} onClick={()=>navigate({name:'current'})}><strong>현재 명식 보기</strong><small>{now.toLocaleString('ko-KR',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</small></button>:birthday.length?<ul>{birthday.map(e=><li key={e.id}><button type="button" disabled={busy} onClick={()=>open(e.id)}><strong>{e.name}</strong><small>{referenceBirthLabel(e)}</small></button></li>)}</ul>:<p>오늘 생일인 명식이 없습니다.</p>}</section>)}</section>;
}
