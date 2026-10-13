/** Explicit manual pillars. Kept separate from calendar birth data and its provenance. */
export const PILLAR_STEMS = Object.freeze([... '甲乙丙丁戊己庚辛壬癸']);
export const PILLAR_BRANCHES = Object.freeze([... '子丑寅卯辰巳午未申酉戌亥']);
export const PILLAR_FIELDS = Object.freeze([
  { key: 'hour', label: '시주' }, { key: 'day', label: '일주' },
  { key: 'month', label: '월주' }, { key: 'year', label: '연주' },
]);
export const SIXTY_PILLARS = Object.freeze(Array.from({ length: 60 }, (_, i) =>
  Object.freeze({ stem: PILLAR_STEMS[i % 10], branch: PILLAR_BRANCHES[i % 12] })));
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
export const isManualBirth = birth => birth?.pillar_input != null;
export const pillarText = pillar => pillar ? pillar.stem + pillar.branch : '미상';
export function validInputPillar(p) {
  return plain(p) && Object.keys(p).length === 2 && Object.hasOwn(p, 'stem') && Object.hasOwn(p, 'branch')
    && PILLAR_STEMS.includes(p.stem) && PILLAR_BRANCHES.includes(p.branch)
    && PILLAR_STEMS.indexOf(p.stem) % 2 === PILLAR_BRANCHES.indexOf(p.branch) % 2;
}
export function pillarInputErrors(input) {
  if (!plain(input) || input.version !== 1 || Object.keys(input).length !== 2 || !plain(input.pillars)) {
    return ['간지 입력 형식 또는 버전을 확인해 주세요.'];
  }
  if (Object.keys(input.pillars).length !== 4 || PILLAR_FIELDS.some(({ key }) => !Object.hasOwn(input.pillars, key))) {
    return ['시·일·월·연주 네 칸이 필요합니다. 시주만 미상으로 둘 수 있습니다.'];
  }
  return PILLAR_FIELDS.flatMap(({ key, label }) => key === 'hour' && input.pillars[key] === null ? []
    : validInputPillar(input.pillars[key]) ? [] : [`${label}는 육십갑자 중 하나를 선택해 주세요.`]);
}
export function assertPillarInput(input) {
  const errors = pillarInputErrors(input);
  if (errors.length) throw new Error(errors.join(' '));
  return input;
}
export function manualBirth(input, sex = null) {
  assertPillarInput(input);
  return {
    input_year: null, input_month: null, input_day: null, date_raw: null,
    calendar_type: null, calendar_symbol_raw: null, lunar_leap_month: null,
    input_hour: null, input_minute: null, time_raw: null, time_status: 'unknown',
    sex, timezone: null, birthplace: null, longitude: null, correction_raw: null,
    correction_settings: null, pillar_input: JSON.parse(JSON.stringify(input)),
  };
}
export function manualBirthLabel(birth) {
  const errors = pillarInputErrors(birth?.pillar_input);
  if (errors.length) return '간지 직접 입력 · 확인 필요';
  return '직접 입력 · ' + ['year', 'month', 'day', 'hour'].map(key => pillarText(birth.pillar_input.pillars[key])).join(' ');
}
const normalizedName = name => typeof name === 'string' ? name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko') : '';
function comparableBirth(birth) {
  if (!birth) return null;
  if (isManualBirth(birth)) {
    if (pillarInputErrors(birth.pillar_input).length || birth.pillar_input.pillars.hour === null) return null;
    return ['pillars', ...['year', 'month', 'day', 'hour'].map(key => pillarText(birth.pillar_input.pillars[key]))].join('|');
  }
  if (!['solar', 'lunar'].includes(birth.calendar_type) || birth.time_status !== 'known'
    || ![birth.input_year, birth.input_month, birth.input_day, birth.input_hour, birth.input_minute].every(Number.isInteger)
    || (birth.calendar_type === 'lunar' && typeof birth.lunar_leap_month !== 'boolean')) return null;
  // Same *input* only. Do not infer lunar/solar equivalence or compare an unknown time to midnight.
  return JSON.stringify([birth.calendar_type, birth.calendar_type === 'lunar' ? birth.lunar_leap_month : false,
    birth.input_year, birth.input_month, birth.input_day, birth.input_hour, birth.input_minute,
    birth.timezone ?? null, birth.longitude ?? null, birth.correction_raw ?? null]);
}
export function duplicateCandidates(state, draft) {
  const name = normalizedName(draft.name), birth = comparableBirth(draft.birth);
  const previous = state.entries.find(entry => entry.id === draft.id && !entry.deletedAt);
  if (previous && normalizedName(draft.name ?? previous.name) === normalizedName(previous.name)) {
    const next = { ...previous.birth, ...draft.birth };
    const identityKeys = ['calendar_type', 'lunar_leap_month', 'input_year', 'input_month', 'input_day',
      'time_status', 'input_hour', 'input_minute', 'sex', 'timezone', 'longitude', 'correction_raw'];
    const sameValues = identityKeys.every(key => (next[key] ?? null) === (previous.birth[key] ?? null));
    const samePillars = isManualBirth(next) === isManualBirth(previous.birth)
      && (!isManualBirth(next) || ['year', 'month', 'day', 'hour'].every(key =>
        pillarText(next.pillar_input.pillars?.[key]) === pillarText(previous.birth.pillar_input.pillars?.[key])));
    // Previously confirmed duplicates must not prevent a memo-only edit or a no-op save.
    if (sameValues && samePillars) return [];
  }
  return state.entries.filter(entry => !entry.deletedAt && entry.id !== draft.id).flatMap(entry => {
    const sameName = Boolean(name) && normalizedName(entry.name) === name;
    const sameBirth = birth !== null && comparableBirth(entry.birth) === birth;
    return sameName || sameBirth ? [{ id: entry.id, name: entry.name,
      reason: sameBirth ? isManualBirth(draft.birth) ? '네 기둥 입력이 같음' : '날짜·시각 입력이 같음' : '이름이 같음' }] : [];
  });
}
