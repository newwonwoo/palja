import {manualDaeun} from '../vault/manual-daewoon.js';
import {preciseEntryBase} from '../calendar/precise.js';
import { assertPillarInput, isManualBirth, manualBirthLabel } from '../vault/pillar-input.js';
import {
  calcSaju, calcDaeun, calcStrengthDetail, calcTCPA, calcYongsin,
  getDP, getMP, getYP, buildLunarYear, jdToDate, getMaxDay,
  HS, EB, HS_EL, EB_EL, EBH, getSS, getUnsung,
} from '../App.jsx';

export { HS, EB, HS_EL, EB_EL, EBH, getSS, getUnsung };
export const STEM_KO = ['갑','을','병','정','무','기','경','신','임','계'];
export const BRANCH_KO = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
export const ENGINE_VERSION = 'legacy-saju-6389ec7-v1';

export function solarDate(birth) {
  const { input_year: year, input_month: month, input_day: day, calendar_type: calendar } = birth;
  if (![year, month, day].every(Number.isInteger)) throw new Error('생년월일을 확인해 주세요.');
  if (year < 1900 || year > 2030) throw new Error('현재 계산 범위는 1900~2030년입니다. 기록은 그대로 보관됩니다.');
  if (month < 1 || month > 12 || day < 1 || day > 31) throw new Error('생년월일을 확인해 주세요.');
  if (calendar === 'solar') {
    if (day > getMaxDay(year, month)) throw new Error('존재하지 않는 양력 날짜입니다.');
    return { year, month, day };
  }
  if (calendar !== 'lunar') throw new Error('수정 화면에서 양력·음력을 확인해 주세요.');
  if (typeof birth.lunar_leap_month !== 'boolean') throw new Error('음력의 평달·윤달 여부를 확인해 주세요.');
  const data = buildLunarYear(year);
  if (!data) throw new Error('이 음력 연도의 변환 자료가 없습니다.');
  const hasLeap = data.months.length === 13 && data.leapM > 0;
  if (birth.lunar_leap_month && (!hasLeap || data.leapM !== month)) throw new Error('선택한 달은 이 해의 윤달과 일치하지 않습니다.');
  let index = month - 1;
  if (hasLeap && month > data.leapM) index += 1;
  if (birth.lunar_leap_month) index = data.leapM;
  const start = data.months[index];
  const end = data.months[index + 1] ?? data.endJD;
  if (start == null || day > end - start) throw new Error('이 음력 달의 날짜 범위를 넘었습니다.');
  const converted = jdToDate(start + day - 1);
  if (converted.year < 1900 || converted.year > 2030) throw new Error('변환한 양력 날짜가 계산 범위를 벗어났습니다.');
  return converted;
}

export function calculateEntry(entry) {
  const birth = entry.birth;
  try {
    if (isManualBirth(birth)) return calculateManualEntry(entry);
    if(birth.calculation_policy?.engine==='astronomical-v1') {
      const {saju,daeun,partial}=preciseEntryBase(birth);
      const complete=!partial&&saju.pillars.every(p=>!p.unknown);
      const tcpa=complete?calcTCPA(saju.pillars):null;
      return {status:complete?'ready':'partial',origin:'astronomical',saju,daeun,tcpa,strength:complete?calcStrengthDetail(saju.pillars):null,yongsin:complete?calcYongsin(saju.pillars,tcpa.sBase):null,legacyForm:null,message:partial?'시각 미상: 날짜 안에서 변할 수 있는 기둥은 표시하지 않습니다.':'독립 절입·시각 계산 · 원본 8자어때 산식 동일성은 미검증'};
    }
    const solar = solarDate(birth);
    if (birth.correction_raw && !birth.correction_settings?.legacy_confirmed) {
      throw new Error('원본에 시각 보정표시가 있습니다. 수정 화면에서 적용할 계산 기준을 확인해 주세요.');
    }
    const hasTime = birth.time_status === 'known';
    if (hasTime && (!Number.isInteger(birth.input_hour) || !Number.isInteger(birth.input_minute) || birth.input_hour < 0 || birth.input_hour > 23 || birth.input_minute < 0 || birth.input_minute > 59)) {
      throw new Error('출생 시각을 확인해 주세요.');
    }
    const saju = hasTime
      ? calcSaju(solar.year, solar.month, solar.day, birth.input_hour, birth.input_minute)
      : {
          pillars: [{ label: '시', unknown: true }, { label: '일', ...getDP(solar.year, solar.month, solar.day) }, { label: '월', ...getMP(solar.year, solar.month, solar.day) }, { label: '년', ...getYP(solar.year, solar.month, solar.day) }],
          dayStem: getDP(solar.year, solar.month, solar.day).stem,
          solar: { ...solar, hour: null, minute: null },
        };
    const hasSex = birth.sex === 'male' || birth.sex === 'female';
    const daeun = hasTime && hasSex ? calcDaeun(solar.year, solar.month, solar.day, birth.sex, saju.pillars[2]) : [];
    const strength = hasTime ? calcStrengthDetail(saju.pillars) : null;
    const tcpa = hasTime ? calcTCPA(saju.pillars) : null;
    const yongsin = hasTime ? calcYongsin(saju.pillars, tcpa.sBase) : null;
    return {
      status: hasTime ? 'ready' : 'partial', saju, daeun, strength, yongsin, tcpa,
      message: !hasTime ? '출생시각 미상 · 시주와 시각이 필요한 분석은 표시하지 않습니다.' : !hasSex ? '성별 미확인 · 대운 방향은 확인 후 계산합니다.' : '',
      legacyForm: hasTime ? { name: entry.name, year: String(solar.year), month: String(solar.month), day: String(solar.day), hour: String(birth.input_hour), minute: String(birth.input_minute), gender: birth.sex || '' } : null,
    };
  } catch (error) {
    return { status: 'needs_confirmation', message: error.message };
  }
}

function calculateManualEntry(entry) {
  const input = assertPillarInput(entry.birth.pillar_input);
  const pillars = ['hour', 'day', 'month', 'year'].map((key, i) => {
    const p = input.pillars[key], label = ['시', '일', '월', '년'][i];
    return p ? { label, ...p, stemIdx: HS.indexOf(p.stem), branchIdx: EB.indexOf(p.branch) }
      : { label, unknown: true };
  });
  const complete = Boolean(input.pillars.hour);
  const tcpa = complete ? calcTCPA(pillars) : null;
  return {
    status: complete ? 'ready' : 'partial', origin: 'manual',
    saju: { pillars, dayStem: pillars[1].stem, solar: null, lunar: null },
    daeun: manualDaeun(pillars[2],entry.birth.manual_daeun), strength: complete ? calcStrengthDetail(pillars) : null, tcpa,
    yongsin: complete ? calcYongsin(pillars, tcpa.sBase) : null,
    message: entry.birth.manual_daeun?'간지와 대운 시작 조건을 직접 입력한 기록입니다. 생일과 실제 기산일은 계산하지 않았습니다.':'간지를 직접 입력한 기록입니다. 실제 생년월일·시각은 확정하지 않았으며 나이와 대운 기산은 계산하지 않습니다.',
    legacyForm: null,
  };
}

export function referenceDay(entry) {
  const reference = isManualBirth(entry.birth) ? null : entry.referenceDisplay;
  const stem = reference?.day_stem_ko;
  const branch = reference?.day_branch_ko;
  if (stem || branch) return { stem: stem || '·', branch: branch || '·', isReference: true };
  const result = calculateEntry(entry);
  const day = result.saju?.pillars[1];
  return day ? { stem: STEM_KO[day.stemIdx], branch: BRANCH_KO[day.branchIdx], isReference: false } : { stem: '·', branch: '·', isReference: false };
}

export function birthSummary(birth) {
  if (isManualBirth(birth)) return manualBirthLabel(birth);
  const date = birth.date_raw || [birth.input_year, birth.input_month, birth.input_day].filter(x => x != null).join('/');
  const calendar = birth.calendar_type === 'solar' ? '양력' : birth.calendar_type === 'lunar' ? `음력${birth.lunar_leap_month === true ? ' 윤달' : ''}` : birth.calendar_symbol_raw || '달력 미확인';
  const time = birth.time_status === 'unknown' ? '시간 모름' : birth.time_status === 'not_visible' ? '시간 미확인' : birth.time_raw || `${String(birth.input_hour).padStart(2, '0')}:${String(birth.input_minute).padStart(2, '0')}`;
  return `${calendar} ${date || '생년월일 미확인'} · ${time}`;
}
