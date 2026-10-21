import React from 'react';
import { upsertEntry } from '../vault/model.js';

export default function DaeunSetup({ entry, result, change, busy, onEdit, onMappings }) {
  if (result.daeun?.length || entry.birth.pillar_input) return null;
  const birth = entry.birth;
  const missingSex = !['male', 'female'].includes(birth.sex);
  const missingTime = birth.time_status !== 'known';
  const missingDate = ![birth.input_year, birth.input_month, birth.input_day].every(Number.isInteger);
  const color = { teal: '청록색', pink: '분홍색' }[entry.referenceDisplay?.badge_color];
  const confirmSex = sex => change(state => upsertEntry(state, {
    id: entry.id,
    birth: { sex, settings_status: { sex: 'user_confirmed' } },
  }), '성별을 확인했습니다. 대운을 다시 계산합니다.');
  return <section className="rr-daeun-setup" aria-label="대운 계산에 필요한 정보">
    <h2>대운 계산에 필요한 정보</h2>
    {missingSex && <>
      <p>성별을 확인하면 대운의 순행·역행을 계산합니다.{color ? ` 원본 ${color} 표시의 뜻은 아직 확인되지 않았습니다.` : ''}</p>
      <div className="rr-daeun-actions">
        <button type="button" disabled={busy} onClick={() => confirmSex('male')}>남성으로 확인</button>
        <button type="button" disabled={busy} onClick={() => confirmSex('female')}>여성으로 확인</button>
      </div>
      {entry.source && <button type="button" className="rr-daeun-link" disabled={busy} onClick={onMappings}>가져온 색상·역법을 여러 명식에 적용</button>}
    </>}
    {missingTime && <p>출생시각이 {birth.time_status === 'unknown' ? '모름' : '미확인'}으로 저장되어 있습니다. 대운 시작 나이를 계산하려면 시각을 확인해 주세요.</p>}
    {missingDate && <p>원본에 생년월일이 없습니다. 날짜를 확인해야 대운을 계산할 수 있습니다.</p>}
    {!missingSex && !missingTime && !missingDate && <p>{result.status === 'ready' && result.origin !== 'astronomical'
      ? '기존 산식이 연초·연말의 절기 경계를 찾지 못해 대운이 비어 있습니다. 출생정보 수정에서 독립 절입·시각 계산을 선택해 계산 기준을 확인해 주세요.'
      : result.message || '계산 조건을 확인해 주세요.'}</p>}
    <button type="button" className="rr-daeun-link" disabled={busy} onClick={onEdit}>출생정보 수정</button>
  </section>;
}
