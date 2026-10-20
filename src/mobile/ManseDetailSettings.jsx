import React, {useRef,useState} from 'react';
import {readPreferences} from '../vault/workspace.js';
import {savePreferences} from '../vault/workspace-actions.js';

export default function ManseDetailSettings({value,change,busy}) {
  const [draft,setDraft]=useState(null), pending=useRef(Promise.resolve()), count=useRef(0);
  const set=(key,checked)=>{
    setDraft(current=>({...current||value,[key]:checked}));
    count.current++;
    pending.current=pending.current.then(()=>change(state=>savePreferences(state,{
      manseDetails:{...readPreferences(state).manseDetails,[key]:checked}
    }))).finally(()=>{if(--count.current===0)setDraft(null);});
  };
  const details=draft||value;
  return <section className="panel personal-settings" aria-labelledby="manse-details-title">
    <h2 id="manse-details-title">명식표 상세 표시</h2>
    <fieldset disabled={busy}>
      <label className="checkbox-line"><input type="checkbox" checked={details.hiddenStemGods} onChange={e=>set('hiddenStemGods',e.target.checked)}/><span>일간 기준 모든 지장간 십신</span></label>
      <label className="checkbox-line"><input type="checkbox" checked={details.nayin} onChange={e=>set('nayin',e.target.checked)}/><span>납음오행 표시</span></label>
    </fieldset>
    <p className="field-hint">지장간 십신은 지장간 글자 아래에 표시합니다. 납음은 기둥별로 표시하며 오행 계산 비중은 바꾸지 않습니다.</p>
  </section>;
}
