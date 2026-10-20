import React, {useRef, useState} from 'react';
import {AGE_NOTATIONS} from '../vault/age-notation.js';
import {savePreferences} from '../vault/workspace-actions.js';

export default function AgeNotationSettings({value, change, busy}) {
  const [draft, setDraft] = useState(null);
  const pending = useRef(Promise.resolve());
  const count = useRef(0);
  const save = next => {
    setDraft(next);
    count.current++;
    pending.current = pending.current.then(() => change(state => savePreferences(state, {ageNotation: next})))
      .finally(() => { if (--count.current === 0) setDraft(null); });
  };
  return <section className="panel" aria-labelledby="age-notation-title">
    <h2 id="age-notation-title">표시 나이 기준</h2>
    <label>보관함 나이<select aria-label="보관함 나이 기준" value={draft ?? value} disabled={busy} onChange={event => save(event.target.value)}>
      {Object.entries(AGE_NOTATIONS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select></label>
    <p className="muted">목록의 나이와 나이 검색·정렬에 적용됩니다. 한국 나이는 태어난 해에 1세, 만 나이는 생일에 한 살씩 늘어납니다. 대운·세운의 나이는 해당 계산 기준을 따릅니다.</p>
  </section>;
}
