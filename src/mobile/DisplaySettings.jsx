import React from 'react';
import {DISPLAY_DEFAULTS,readPresentation} from '../vault/presentation.js';
import {savePresentation} from '../vault/workspace-actions.js';
const NAMES={overview:'분석',relations:'사주',luck:'운세',compare:'궁합',me:'내 명식',favorites:'즐겨찾기',friends:'친구'};
const CHOICES={fontFamily:['글꼴',[['system','기본 고딕'],['serif','명조 계열'],['mono','고정폭']]],ageMode:['나이 기준',[['full','만나이'],['counting','세는나이'],['year','연나이']]],palette:['오행 색상',[['classic','기본'],['muted','차분한 색'],['contrast','높은 대비'],['custom','직접 지정']]],fontScale:['글자 크기',[[1,'기본'],[1.15,'크게'],[1.3,'더 크게']]],cardStyle:['명식 카드',[['plain','기본'],['outlined','테두리'],['soft','부드러운 배경']]],listLayout:['목록 배열',[['rows','행 목록'],['cards','카드 배열']]]};
export default function DisplaySettings({vault,change,busy}){
 const p=readPresentation(vault),save=patch=>change(s=>savePresentation(s,patch),'표시 설정을 저장했습니다.');
 const move=(key,i,delta)=>{const a=[...p[key]],j=i+delta;[a[i],a[j]]=[a[j],a[i]];save({[key]:a});};
 return <section className="panel display-settings" aria-label="명식 표시와 디자인"><h2>명식 표시와 디자인</h2><fieldset disabled={busy}>
 {Object.entries({tenGods:'십성',hidden:'지장간',growth:'십이운성',nayin:'납음·공망',shinsal:'신살'}).map(([k,label])=><label className="checkbox-line" key={k}><input type="checkbox" checked={p[k]} onChange={e=>save({[k]:e.target.checked})}/>{label} 표시</label>)}
 {Object.entries(CHOICES).map(([key,[label,options]])=><label className="display-field" key={key}>{label}<select aria-label={label} value={p[key]} onChange={e=>save({[key]:key==='fontScale'?Number(e.target.value):e.target.value})}>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>)}
 {p.palette==='custom'&&<div className="completion-filter">{Object.entries({wood:'목',fire:'화',earth:'토',metal:'금',water:'수'}).map(([k,label])=><label key={k}>{label}<input type="color" aria-label={label+' 색상'} value={p.elementColors[k]} onChange={e=>save({elementColors:{...p.elementColors,[k]:e.target.value}})}/></label>)}</div>}
 {['tabOrder','bannerOrder'].map(key=><div key={key}><h3>{key==='tabOrder'?'풀이 탭 순서':'프로필 배너 순서'}</h3><ol className="display-order">{p[key].map((v,i)=><li key={v}><span>{NAMES[v]}</span><button type="button" disabled={busy||i===0} aria-label={NAMES[v]+' 위로'} onClick={()=>move(key,i,-1)}>↑</button><button type="button" disabled={busy||i===p[key].length-1} aria-label={NAMES[v]+' 아래로'} onClick={()=>move(key,i,1)}>↓</button></li>)}</ol></div>)}
 <button type="button" className="secondary" onClick={()=>save({...DISPLAY_DEFAULTS})}>표시 설정 초기화</button></fieldset><p className="field-hint">재실행과 JSON 백업·복원에 적용됩니다.</p></section>;
}
