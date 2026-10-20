import React,{useState} from 'react';
import {PROFILE_BANNERS,moveProfileBanner,toggleProfileBanner,DEFAULT_PROFILE_BANNERS} from '../vault/profile-banners.js';
import {savePreferences} from '../vault/workspace-actions.js';

export default function ProfileBannerSettings({value,change,busy}){
 const [error,setError]=useState('');
 const apply=async fn=>{setError('');try{const next=fn(value);await change(s=>savePreferences(s,{profileBanners:next}),'프로필 배너 설정을 저장했습니다.');}catch(e){setError(e.message);}};
 return <section className="panel profile-banner-settings"><h2>프로필 배너 순서·표시</h2><p className="muted">보관함 위에 표시할 배너입니다. 내 명식과 현재 중 하나는 표시합니다.</p><ol>{value.order.map((key,i)=><li key={key}><label><input type="checkbox" checked={!value.hidden.includes(key)} disabled={busy} onChange={()=>apply(s=>toggleProfileBanner(s,key))}/><span>{PROFILE_BANNERS[key]}</span></label><button type="button" className="small-button" aria-label={`${PROFILE_BANNERS[key]} 배너 위로`} disabled={busy||i===0} onClick={()=>apply(s=>moveProfileBanner(s,key,-1))}>↑</button><button type="button" className="small-button" aria-label={`${PROFILE_BANNERS[key]} 배너 아래로`} disabled={busy||i===2} onClick={()=>apply(s=>moveProfileBanner(s,key,1))}>↓</button></li>)}</ol><button type="button" className="secondary" disabled={busy} onClick={()=>apply(()=>({order:[...DEFAULT_PROFILE_BANNERS.order],hidden:[]}))}>배너 기본값</button>{error&&<p role="alert">{error}</p>}</section>;
}
