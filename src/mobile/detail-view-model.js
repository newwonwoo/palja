/** Presentation-only helpers. Never claim the imported screenshot or legacy engine is authoritative. */
export const FIVE_ELEMENTS = Object.freeze([
  { key: '木', name: '목', tone: 'wood' },
  { key: '火', name: '화', tone: 'fire' },
  { key: '土', name: '토', tone: 'earth' },
  { key: '金', name: '금', tone: 'metal' },
  { key: '水', name: '수', tone: 'water' },
]);

export function normalizeElementScores(scores) {
  if (!scores || typeof scores !== 'object') return [];
  const safe = FIVE_ELEMENTS.map(element => ({ ...element, score: Number.isFinite(scores[element.key]) && scores[element.key] > 0 ? scores[element.key] : 0 }));
  const total = safe.reduce((sum, entry) => sum + entry.score, 0);
  return safe.map(entry => ({ ...entry, percentage: total ? Math.round(entry.score / total * 100) : 0 }));
}

export function isSourceDayDifferent(entry, result, stems, branches) {
  const displayed = entry?.referenceDisplay;
  const calculated = result?.saju?.pillars?.[1];
  if (!calculated || calculated.unknown || !displayed) return false;
  const stem = stems[calculated.stemIdx];
  const branch = branches[calculated.branchIdx];
  if (!stem || !branch) return false;
  return Boolean((displayed.day_stem_ko && displayed.day_stem_ko !== stem)
    || (displayed.day_branch_ko && displayed.day_branch_ko !== branch));
}

export function displayCertainty(entry, result) {
  if(result?.origin==='astronomical')return {title:result.status==='ready'?'독립 절입·시각 계산':'절입·시각 경계 미확인',tone:'neutral',body:result.message};
  if (result?.origin === 'manual') return {
    title: result.status === 'partial' ? '간지 직접 입력 · 시주 미상' : '간지 직접 입력', tone: 'neutral',
    body: result.message + ' 네 기둥의 오행·관계는 기존 산식으로 표시하며, 실제 날짜에 존재하는 조합인지는 역검색으로 확인하세요.',
  };
  if (result?.status === 'needs_confirmation') {
    return {
      title: '계산 기준 확인 필요', tone: 'warning',
      body: result.message || '입력정보를 먼저 확인해 주세요. 저장한 원본 정보는 그대로 유지됩니다.',
    };
  }
  if (result?.status === 'partial') return {
    title: '부분 명식', tone: 'warning',
    body: '출생시각을 확인하기 전에는 시주와 시각을 사용하는 해석을 표시하지 않습니다.',
  };
  return {
    title: '기존 계산기 결과', tone: 'neutral',
    body: '8자어때 18.2.8과 동일한 산식이라고 검증된 결과는 아닙니다. 절입 시각·시간 보정 등 기존 계산기의 한계가 있습니다.' + (result?.message ? ' ' + result.message : ''),
  };
}

export function chartSlots(entry, result) {
  const labels = ['시', '일', '월', '년'];
  const calculated = result?.saju?.pillars || [];
  return labels.map((label, index) => {
    const pillar = calculated[index];
    if (pillar && !pillar.unknown) return { label, index, pillar, kind: 'calculated' };
    if (index === 1 && entry?.referenceDisplay?.day_stem_ko && entry?.referenceDisplay?.day_branch_ko) {
      return { label, index, kind: 'reference', stem: entry.referenceDisplay.day_stem_ko, branch: entry.referenceDisplay.day_branch_ko };
    }
    return { label, index, kind: 'unknown' };
  });
}
