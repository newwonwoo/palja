import { solarTerms } from '../calendar/precise.js';

const DAY = 86400000;
const STEMS = [...'甲乙丙丁戊己庚辛壬癸'];
const BRANCHES = [...'子丑寅卯辰巳午未申酉戌亥'];
const mod = (n, m) => ((n % m) + m) % m;

/** Repair only the legacy empty result at a calendar-year boundary.
 * The legacy calculator measures from the birth date's integer Julian day
 * (UTC noon), rounds days/3 and emits eight decades. Keep those conventions,
 * the legacy natal pillars and all nonempty results. Missing adjacent-year
 * jie are supplied by the independently verified solar-longitude engine.
 */
export function repairLegacyDaeunBoundary(original, solar, sex, yearPillar, monthPillar) {
  if (original.length || !['male', 'female'].includes(sex)) return { daeun: original, repaired: false };
  const forward = (yearPillar.stemIdx % 2 === 0) === (sex === 'male');
  const birthNoon = Date.UTC(solar.year, solar.month - 1, solar.day, 12);
  const candidates = [solar.year - 1, solar.year, solar.year + 1]
    .flatMap(solarTerms).filter(term => term.jie)
    .map(term => ({ term, gapDays: (forward ? term.instant - birthNoon : birthNoon - term.instant) / DAY }))
    .filter(item => item.gapDays > 0).sort((a, b) => a.gapDays - b.gapDays);
  const nearest = candidates[0];
  if (!nearest || nearest.gapDays > 35) throw new Error('대운 기산에 필요한 인접 절기를 찾지 못했습니다.');
  const startAge = Math.round(nearest.gapDays / 3);
  const basis = '기본 대운 연경계 보완: 독립 태양 황경 절기 · 출생일 UTC 정오 기준 · 3일=1년 반올림 · 출생시각 미반영';
  const daeun = Array.from({ length: 8 }, (_, i) => {
    const step = (forward ? 1 : -1) * (i + 1);
    const stemIdx = mod(monthPillar.stemIdx + step, 10), branchIdx = mod(monthPillar.branchIdx + step, 12);
    return { stem: STEMS[stemIdx], branch: BRANCHES[branchIdx], stemIdx, branchIdx,
      startAge: startAge + i * 10, startYear: solar.year + startAge + i * 10,
      direction: forward ? 'forward' : 'backward', boundary: nearest.term.name + ' · ' + nearest.term.iso,
      gapDays: nearest.gapDays, basis, boundaryRepair: true };
  }).filter(item => item.startAge <= 100);
  return { daeun, repaired: true };
}
