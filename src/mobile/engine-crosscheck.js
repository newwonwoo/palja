/** Side-by-side existing vs astronomical engines. Read-only comparison, no external original app calls. */
import { calculateEntry } from './engine.js';
import { DEFAULT_POLICY } from '../calendar/policy.js';
import { isManualBirth } from '../vault/pillar-input.js';
import { birthForCalculation, isDefaultSolar } from './birth-defaults.js';
const LABELS=['시주','일주','월주','연주'];
const SAME=(a,b)=>a?.stem===b?.stem && a?.branch===b?.branch;
const yearSupported=year=>Number.isInteger(year)&&year>=1900&&year<=2030;
const compatibleInput=b=>b&&b.time_status==='known'&&['solar','lunar'].includes(b.calendar_type)
  && (b.calendar_type!=='lunar'||typeof b.lunar_leap_month==='boolean')
  && [b.input_year,b.input_month,b.input_day,b.input_hour,b.input_minute].every(Number.isInteger);
export function compareIndependentEngines(entry){
  const sourceBirth=entry?.birth;
  if(!sourceBirth||isManualBirth(sourceBirth))return {status:'unavailable',reason:'간지 직접입력은 실제 생년월일시를 가정하지 않아 교차 계산하지 않습니다.'};
  const b=birthForCalculation(sourceBirth);
  if(!yearSupported(b.input_year))return {status:'unavailable',reason:'두 엔진의 공통 비교 범위는 1900~2030년입니다.'};
  if(!compatibleInput(b))return {status:'unavailable',reason:'출생 연월일·역법·평윤달·시각을 확인해야 두 엔진을 비교할 수 있습니다.'};
  // Normalize both engines to their supported defaults. Existing user policy is not modified.
  // The two implementations intentionally differ near solar terms and Zi-clock boundaries.
  const existing=calculateEntry({...entry,birth:{...b,calculation_policy:null}});
  const astronomical=calculateEntry({...entry,birth:{...b,calculation_policy:{...DEFAULT_POLICY}}});
  if(existing.status!=='ready'||astronomical.status!=='ready')return {status:'unavailable',reason:[existing.message,astronomical.message].filter(Boolean).join(' / ') ||'한 엔진에서 명식을 계산할 수 없습니다.'};
  const rows=LABELS.map((name,i)=>({name,legacy:existing.saju.pillars[i].stem+existing.saju.pillars[i].branch,astronomical:astronomical.saju.pillars[i].stem+astronomical.saju.pillars[i].branch,equal:SAME(existing.saju.pillars[i],astronomical.saju.pillars[i])}));
  return {status:'comparable',rows,matching:rows.filter(r=>r.equal).length,differences:rows.filter(r=>!r.equal).map(r=>r.name),
    explanation:(isDefaultSolar(sourceBirth)?'역법 미지정: 기본 양력으로 비교합니다. 원본은 보존됩니다. ':'')+'기존 saju 엔진은 날짜 중심 절입과 23:30 자시 기준입니다. 독립 엔진은 태양 황경 절입 시각과 역사적 한국 시간대, 자정 기준으로 계산합니다. 다른 결과는 오류 확정이 아니라 기준·경계값 검토 대상입니다.',
    policies:{existing:'기존 기준 (23:30 자시)',astronomical:'천문 기준 (절입 시각·Asia/Seoul·자정 경계)'}};
}
