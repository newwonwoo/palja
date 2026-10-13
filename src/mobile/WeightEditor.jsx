import React,{useState} from 'react';
import {DEFAULT_WEIGHTS,weightErrors} from '../vault/integrated-schema.js';
import {setWeights} from '../vault/integrated-actions.js';
export default function WeightEditor({value,change,onClose,busy}) {
 const [draft,setDraft]=useState(()=>JSON.parse(JSON.stringify(value))),[error,setError]=useState('');
 return <form className="integration-weights" onSubmit={async e=>{e.preventDefault();const errors=weightErrors(draft);if(errors.length){setError(errors.join(' · '));return;}if(await change(s=>setWeights(s,draft),'비중을 저장했습니다.'))onClose();}}>
 <label className="rr-check"><input type="checkbox" checked={draft.enabled} disabled={busy} onChange={e=>setDraft({...draft,enabled:e.target.checked})}/>사용자 비중으로 오행·음양 분석</label>
 <p className="rr-subnote">설정은 기기와 백업에 저장됩니다. 기존 용신·격국 규칙을 바꾸지 않으며 합화는 자동 성립시키지 않습니다.</p>
 {[['stems','궁성 천간',['시','일','월','년']],['branches','궁성 지지',['시','일','월','년']],['hidden','지장간 배율',['여기','중기','본기']],['luck','선택운 배율',['대운','세운','월운','일운','시운']]].map(([key,title,names])=><fieldset disabled={busy} key={key}><legend>{title}</legend><div className="integration-weight-grid">{names.map((name,i)=><label key={name}>{name}<input type="number" aria-label={title+' '+name} min="0" max="10" step="0.1" required value={draft[key][i]??''} onChange={e=>setDraft({...draft,[key]:draft[key].map((v,n)=>n===i?(e.target.value===''?null:Number(e.target.value)):v)})}/></label>)}</div></fieldset>)}
 {error&&<p role="alert">{error}</p>}<div className="rr-dialog-actions"><button type="button" disabled={busy} onClick={()=>setDraft(JSON.parse(JSON.stringify(DEFAULT_WEIGHTS)))}>초기값</button><button type="button" disabled={busy} onClick={onClose}>취소</button><button type="submit" disabled={busy}>비중 저장</button></div>
 </form>;
}
