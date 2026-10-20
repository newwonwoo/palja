import React, {useRef,useState} from 'react';
import {readPreferences} from '../vault/workspace.js';
import {savePreferences} from '../vault/workspace-actions.js';
import {MANSE_DETAIL_PRESETS,MANSE_DETAIL_PRESET_LABELS} from '../vault/manse-details.js';

export default function ManseDetailSettings({value,change,busy}) {
  const [draft,setDraft]=useState(null), pending=useRef(Promise.resolve()), count=useRef(0);
  const enqueue=(update,preset=false)=>{
    setDraft(current=>update(current||value));
    count.current++;
    pending.current=pending.current.then(()=>change(state=>{
      const prefs=readPreferences(state),next=update(prefs.manseDetails);
      return savePreferences(state,{manseDetails:next,...(preset?{appearance:{...prefs.appearance,
        tenGods:next.dayStemGods||next.columnStemGods,growth:next.dayGrowth||next.columnGrowth}}:{})});
    })).finally(()=>{if(--count.current===0)setDraft(null);});
  };
  const set=(key,checked)=>enqueue(current=>({...current,[key]:checked}));
  const details=draft||value;
  return <section className="panel personal-settings" aria-labelledby="manse-details-title">
    <h2 id="manse-details-title">명식표 상세 표시</h2>
    <fieldset disabled={busy}>
      <div className="manse-detail-presets" aria-label="명식표 표시 프리셋">{Object.entries(MANSE_DETAIL_PRESETS).map(([key,preset])=><button type="button" className="secondary" key={key} aria-label={`명식표 ${MANSE_DETAIL_PRESET_LABELS[key]} 프리셋`} onClick={()=>enqueue(()=>({...preset}),true)}>{MANSE_DETAIL_PRESET_LABELS[key]}</button>)}</div>
      {[['dayStemGods','십신 · 일간 기준'],['columnStemGods','십신 · 각 기둥 천간 기준'],['dayGrowth','십이운성 · 일간 기준'],['columnGrowth','십이운성 · 각 기둥 천간 기준'],['yearShinsal','십이신살 · 연주 기준'],['dayShinsal','십이신살 · 일주 기준']].map(([key,label])=><label className="checkbox-line" key={key}><input type="checkbox" checked={details[key]} onChange={e=>set(key,e.target.checked)}/><span>{label}</span></label>)}
      <label className="checkbox-line"><input type="checkbox" checked={details.hiddenStemGods} onChange={e=>set('hiddenStemGods',e.target.checked)}/><span>일간 기준 모든 지장간 십신</span></label>
      <label className="checkbox-line"><input type="checkbox" checked={details.nayin} onChange={e=>set('nayin',e.target.checked)}/><span>납음오행 표시</span></label>
    </fieldset>
    <p className="field-hint">십신·운성은 ‘나의 화면’의 행 표시가 켜져 있을 때 보입니다. 프리셋은 필요한 행을 함께 켭니다. 지장간 십신은 지장간 글자 아래에 표시하며 계산 비중은 바꾸지 않습니다.</p>
  </section>;
}
