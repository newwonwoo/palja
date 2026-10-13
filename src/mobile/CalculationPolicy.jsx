import React from 'react';
import {DEFAULT_POLICY} from '../calendar/policy.js';
export default function CalculationPolicy({value,onChange}) {
 const set=(key,v)=>onChange({...value,[key]:v});
 return <section className="panel integration-policy"><h2>역법·출생 시각 기준</h2>
 <label>계산 엔진<select aria-label="계산 엔진" value={value?'astronomical':'legacy'} onChange={e=>onChange(e.target.value==='legacy'?null:{...DEFAULT_POLICY})}><option value="legacy">기존 사이트 기준 · 저장값 유지</option><option value="astronomical">절입 시각·한국 시간대 반영</option></select></label>
 {value&&<><p className="field-hint">원본 입력은 보존합니다. 아래 기준을 선택한 이 명식에만 적용합니다. 원본 앱 계산식 복원이 아닌 독립 구현입니다.</p>
 <label>시간대<select aria-label="시간대" value={value.zone} onChange={e=>set('zone',e.target.value)}><option value="Asia/Seoul">한국 · 역사적 표준시/서머타임 자동</option><option value="fixed">고정 UTC 차이 직접 입력</option></select></label>
 {value.zone==='fixed'&&<label>UTC 차이(분)<input type="number" aria-label="UTC 차이" min="-720" max="840" value={value.offsetMinutes} onChange={e=>set('offsetMinutes',e.target.value===''?null:Number(e.target.value))}/></label>}
 <label>시각 보정<select aria-label="시각 보정" value={value.clock} onChange={e=>set('clock',e.target.value)}><option value="standard">표준시 · 서머타임만 제거</option><option value="mean-solar">평균태양시 · 경도 반영</option><option value="apparent-solar">진태양시 · 경도+균시차(근사)</option></select></label>
 {value.clock!=='standard'&&<label>출생지 경도(동경 + / 서경 −)<input type="number" aria-label="출생지 경도" min="-180" max="180" step="any" required value={value.longitude??''} onChange={e=>set('longitude',e.target.value===''?null:Number(e.target.value))}/></label>}
 <label>일주 경계<select aria-label="일주 경계" value={value.dayBoundary} onChange={e=>set('dayBoundary',e.target.value)}><option value="midnight">00:00 교체 · 23시 일주 유지</option><option value="zi23">23:00 교체 · 다음 날 일주</option></select></label>
 <label>연주 시작<select aria-label="연주 시작" value={value.yearBoundary} onChange={e=>set('yearBoundary',e.target.value)}><option value="lichun">입춘 절입 순간</option><option value="jan1">양력 1월 1일 · 월간은 절기년 기준</option></select></label>
 <label>중복 현지 시각<select aria-label="중복 현지 시각" value={value.fold} onChange={e=>set('fold',e.target.value)}><option value="reject">확인 전 계산 차단</option><option value="earlier">시계 되돌리기 전(먼저)</option><option value="later">시계 되돌리기 후(나중)</option></select></label>
 <p className="field-hint">지원 1900~2050년. 절기는 천문 계산값, 균시차와 대운 시작일은 근사값입니다. 출생시각 미상일 때 경계에 걸친 기둥은 비워 둡니다.</p></>}
 </section>;
}
