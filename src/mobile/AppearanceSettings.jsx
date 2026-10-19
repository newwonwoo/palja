import React, {useRef, useState} from 'react';
import {DEFAULT_APPEARANCE, FONT_OPTIONS, TEXT_SIZE_OPTIONS, CARD_STYLE_OPTIONS} from '../vault/appearance.js';
import {savePreferences} from '../vault/workspace-actions.js';
import {readPreferences} from '../vault/workspace.js';

export default function AppearanceSettings({preferences, change, busy}) {
  const [draft, setDraft] = useState(null);
  const a = draft || preferences.appearance;
  const pending = useRef(Promise.resolve());
  const pendingCount = useRef(0);
  const enqueue = update => {
    setDraft(current => update(current || preferences.appearance));
    pendingCount.current++;
    pending.current = pending.current.then(() => change(state => savePreferences(state, {appearance: update(readPreferences(state).appearance)})))
      .finally(() => { if (--pendingCount.current === 0) setDraft(null); });
  };
  const set = patch => enqueue(current => ({...current, ...patch}));
  return <section className="panel personal-settings" aria-labelledby="appearance-title">
    <h2 id="appearance-title">나의 화면</h2>
    <p className="muted">선택하면 바로 저장됩니다. 기기를 바꿀 때 백업으로 옮길 수 있습니다.</p>
    <fieldset disabled={busy}>
      <label className="personal-color">강조 색상<input aria-label="강조 색상" type="color" value={a.accent} onChange={e => set({accent: e.target.value})}/><span>{a.accent}</span></label>
      <div className="personal-fields">{[['font', '글꼴', FONT_OPTIONS], ['textSize', '글자 크기', TEXT_SIZE_OPTIONS], ['cardStyle', '명식 카드 모양', CARD_STYLE_OPTIONS]].map(([key,label,options]) => <label key={key}>{label}<select aria-label={label} value={a[key]} onChange={e => set({[key]: e.target.value})}>{Object.entries(options).map(([value,text]) => <option key={value} value={value}>{text}</option>)}</select></label>)}</div>
      <div className="personal-preview" aria-label="화면 미리보기"><span>나의 명식</span><strong>癸 · 계수</strong><small>색상과 글꼴을 미리 확인하세요.</small></div>
      <h3>명식표 표시</h3>
      {[['tenGods', '십성 표시'], ['hiddenStems', '지장간 표시'], ['growth', '12운성 표시']].map(([key,label]) => <label className="checkbox-line" key={key}><input type="checkbox" checked={a[key]} onChange={e => set({[key]: e.target.checked})}/><span>{label}</span></label>)}
      <p className="field-hint">명식표의 표시만 바뀝니다. 계산 결과와 설명은 유지됩니다.</p>
      <button type="button" className="secondary" onClick={() => enqueue(() => ({...DEFAULT_APPEARANCE}))}>화면 설정 초기화</button>
    </fieldset>
  </section>;
}
