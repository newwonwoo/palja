/** All candidates use the pinned legacy calculator. This is not recovered 8ja AOT logic. */
import { calcSaju, getDP, getYP, getMP } from '../App.jsx';
import { solarDate, ENGINE_VERSION } from './engine.js';
import { parseCalendarDate, dateKey } from './calendar-model.js';
import { assertPillarInput, isManualBirth, pillarText } from '../vault/pillar-input.js';
const MINUTE = 60000, DAY = MINUTE * 1440;
const time = minute => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
const starts = [0, ...Array.from({ length: 12 }, (_, i) => 90 + i * 120)];
// The old engine uses 01:30,...,23:30 boundaries and a civil-midnight day change.
// Separate early/late 子 on the SAME civil date rather than losing either interval.
export const LEGACY_HOUR_WINDOWS = Object.freeze(starts.map((startMinute, i) => {
  const endMinute = (starts[i + 1] ?? 1440) - 1;
  return Object.freeze({ startMinute, endMinute, start: time(startMinute), end: time(endMinute) });
}));
export const PILLAR_SEARCH_NOTE = '기존 계산기 기준 후보입니다. 23:30 자시·자정 일주 변경을 적용하며, 정확한 절입시각·역사적 시간 보정은 미반영입니다. 원본 앱과의 동일성은 미검증입니다.';
const abort = signal => { if (signal?.aborted) throw new DOMException('검색을 취소했습니다.', 'AbortError'); };
const same = (left, right) => left.stem === right.stem && left.branch === right.branch;
const tuple = saju => saju.pillars.map(pillarText).join('|');
export function dateCandidates(value) {
  const { year, month, day } = parseCalendarDate(value);
  return LEGACY_HOUR_WINDOWS.map(window => {
    const h = Math.floor(window.startMinute / 60), m = window.startMinute % 60;
    const saju = calcSaju(year, month, day, h, m);
    return { ...window, date: value, saju, engineVersion: ENGINE_VERSION, certainty: 'candidate' };
  });
}
export function unknownTimeCandidates(birth) {
  if (isManualBirth(birth)) throw new Error('간지 입력에는 확정된 날짜가 없습니다. 먼저 네 기둥 역검색을 사용하세요.');
  if (birth?.correction_raw && !birth.correction_settings?.legacy_confirmed) {
    throw new Error('보정 기준이 미확인입니다. 출생정보에서 적용할 기준을 먼저 확인해 주세요.');
  }
  const { year, month, day } = solarDate(birth);
  return dateCandidates(dateKey(year, month, day));
}
export async function findFourPillars({ input, start, end, limit = 100, signal, onProgress = () => {} }) {
  const query = JSON.parse(JSON.stringify(assertPillarInput(input))).pillars;
  const a = parseCalendarDate(start), b = parseCalendarDate(end);
  const first = Date.UTC(a.year, a.month - 1, a.day), last = Date.UTC(b.year, b.month - 1, b.day);
  if (first > last) throw new Error('시작일은 종료일보다 늦을 수 없습니다.');
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000) throw new Error('결과 한도는 1~1,000이어야 합니다.');
  const total = (last - first) / DAY + 1, results = [];
  let checked = 0, truncated = false;
  abort(signal);
  // Yield once even for a small search so route/field changes can cancel before results are displayed.
  await new Promise(resolve => setTimeout(resolve, 0));
  for (let ms = first; ms <= last; ms += DAY) {
    abort(signal);
    const d = new Date(ms), year = d.getUTCFullYear(), month = d.getUTCMonth() + 1, day = d.getUTCDate();
    checked += 1;
    // Cheap day filter first; avoid thousands of redundant solar-term calculations.
    if (same(getDP(year, month, day), query.day) && same(getYP(year, month, day), query.year)
      && same(getMP(year, month, day), query.month)) {
      const date = dateKey(year, month, day);
      const windows = dateCandidates(date).filter(candidate => !query.hour || same(candidate.saju.pillars[0], query.hour));
      if (windows.length) {
        if (results.length === limit) { truncated = true; break; }
        results.push({ date, windows, certainty: 'candidate' });
      }
    }
    if (checked % 128 === 0) { onProgress({ checked, total }); await new Promise(resolve => setTimeout(resolve, 0)); }
  }
  onProgress({ checked, total }); abort(signal);
  return { results, checked, total, truncated, engineVersion: ENGINE_VERSION, note: PILLAR_SEARCH_NOTE };
}
/** A reverse-search hit is NOT a known birth time. Calendar creation deliberately leaves it unknown. */
export function candidateDateSeed(candidate) {
  const { year, month, day } = parseCalendarDate(candidate.date);
  return { input_year: year, input_month: month, input_day: day, calendar_type: 'solar',
    lunar_leap_month: false, time_status: 'unknown', input_hour: null, input_minute: null };
}
export function candidateTuple(candidate) { return tuple(candidate.saju); }
