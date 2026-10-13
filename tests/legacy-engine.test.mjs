import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

/**
 * Synthetic compatibility fixtures, not independently certified calendar results.
 * Baseline: newwonwoo/saju, commit 6389ec7125a36897e0755e5aa637609113bc99d7,
 * src/App.jsx, before the mobile exports and adapter were added.
 * https://github.com/newwonwoo/saju/blob/6389ec7125a36897e0755e5aa637609113bc99d7/src/App.jsx
 *
 * Fixtures were captured by reading `git show <commit>:src/App.jsx`, appending
 * named exports for the original functions, and bundling with esbuild as Node
 * ESM with write:false. No baseline logic was edited and no React component was
 * rendered. CI uses the fixed fixtures below, so it needs no Git history or network.
 * The whole-result digests cover calcSaju, calcDaeun, calcStrengthDetail, calcTCPA,
 * and calcYongsin. Eight decimal places avoid insignificant floating point drift.
 * These checks establish compatibility with that source, not the astronomical
 * accuracy of day pillars, lunar conversion, solar terms, or interpretation scores.
 * Known baseline limitations have explicit observation tests below.
 * No personal records, screenshot values, or private import packages are used.
 */

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const bundled = await build({
  stdin: {
    contents: `
      export {
        calcSaju, calcDaeun, calcStrengthDetail, calcTCPA, calcYongsin,
        getDP, getMP, getYP, getMaxDay,
      } from './src/App.jsx';
      export { calculateEntry, ENGINE_VERSION } from './src/mobile/engine.js';
    `,
    resolveDir: repositoryRoot,
    sourcefile: 'legacy-engine-test-entry.mjs',
    loader: 'js',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  logLevel: 'silent',
  define: {
    'import.meta.env.VITE_APP_MODE': '"mobile"',
    'import.meta.env.VITE_GEMINI_API_KEY': '""',
  },
});
const engine = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

function canonical(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? Number(value.toFixed(8)) : String(value);
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

function legacySnapshot(args, sex) {
  const saju = engine.calcSaju(...args);
  const tcpa = engine.calcTCPA(saju.pillars);
  return {
    saju,
    daeun: engine.calcDaeun(...args.slice(0, 3), sex, saju.pillars[2]),
    strength: engine.calcStrengthDetail(saju.pillars),
    tcpa,
    yongsin: engine.calcYongsin(saju.pillars, tcpa.sBase),
  };
}

const GOLDEN = [
  {
    id: 'lower solar range; legacy pre-new-year lunar fallback',
    args: [1900, 1, 1, 0, 0], sex: 'male',
    pillars: ['甲子', '甲戌', '丙子', '己亥'],
    lunar: { year: 1900, month: 1, day: 1, isLeap: false },
    sha256: '1f56d47275c174276d244d456e14f79a9919223f3c5ca7cbf8932dcc1535a107',
  },
  {
    id: 'Gregorian leap day before 01:30',
    args: [2000, 2, 29, 1, 29], sex: 'male',
    pillars: ['庚子', '丁巳', '戊寅', '庚辰'],
    lunar: { year: 2000, month: 1, day: 25, isLeap: false },
    sha256: 'bbd4296e3d6b3980cc3f8508f97decff15be0413c16d2e02c2f4209f016e897a',
  },
  {
    id: 'Gregorian leap day at 01:30',
    args: [2000, 2, 29, 1, 30], sex: 'female',
    pillars: ['辛丑', '丁巳', '戊寅', '庚辰'],
    lunar: { year: 2000, month: 1, day: 25, isLeap: false },
    sha256: 'fa013bd68c8efb596798da36b4868d70018a2dd7e69905fd7a77a38792d7f9be',
  },
  {
    id: 'day preceding the baseline spring-term change',
    args: [2024, 2, 3, 23, 29], sex: 'female',
    pillars: ['辛亥', '丁酉', '乙丑', '癸卯'],
    lunar: { year: 2023, month: 12, day: 24, isLeap: false },
    sha256: 'c807a939863cb7cf73890be83639edf2a371a374c01384c2253704be8cbce85d',
  },
  {
    id: 'baseline spring-term calendar day at midnight',
    args: [2024, 2, 4, 0, 0], sex: 'male',
    pillars: ['壬子', '戊戌', '丙寅', '甲辰'],
    lunar: { year: 2023, month: 12, day: 25, isLeap: false },
    sha256: 'f0ba8ff7c340f032160a02ea970ebc6295c12fe29f84b1a747d3c62d92f23e0c',
  },
  {
    id: 'same spring-term calendar day before midnight',
    args: [2024, 2, 4, 23, 59], sex: 'female',
    pillars: ['壬子', '戊戌', '丙寅', '甲辰'],
    lunar: { year: 2023, month: 12, day: 25, isLeap: false },
    sha256: '9b688e8579f3fc0e1368f4bd87cfb6e3a659332cec64e2e7278c929fcf181710',
  },
  {
    id: 'year end before 23:30',
    args: [2025, 12, 31, 23, 29], sex: 'male',
    pillars: ['乙亥', '甲戌', '戊子', '乙巳'],
    lunar: { year: 2025, month: 11, day: 12, isLeap: false },
    sha256: 'c6336aa0518767a858f124c8badb58e8250d11dba9842bd98b0e3c085b18bbe4',
  },
  {
    id: 'year end at 23:30; legacy empty forward daeun',
    args: [2025, 12, 31, 23, 30], sex: 'female',
    pillars: ['甲子', '甲戌', '戊子', '乙巳'],
    lunar: { year: 2025, month: 11, day: 12, isLeap: false },
    sha256: 'b5b3746304afcaf5ab38c197896deb51e9379dc74bf355695f8f8d12e1fffcf3',
  },
  {
    id: 'new Gregorian year at midnight',
    args: [2026, 1, 1, 0, 0], sex: 'male',
    pillars: ['丙子', '乙亥', '戊子', '乙巳'],
    lunar: { year: 2025, month: 11, day: 13, isLeap: false },
    sha256: '931aaccde5ace35a4fa79ea555b9c4b5159840fdc7de648921f526623e8ef490',
  },
  {
    id: 'upper solar range before midnight',
    args: [2030, 12, 31, 23, 59], sex: 'female',
    pillars: ['丙子', '庚子', '戊子', '庚戌'],
    lunar: { year: 2030, month: 12, day: 7, isLeap: false },
    sha256: '1e51d7c886110ff8f1dba7883a5a260b5884dc6b56d94520b3699fd256332ab8',
  },
];

for (const fixture of GOLDEN) {
  test(`original engine regression: ${fixture.id}`, () => {
    const actual = legacySnapshot(fixture.args, fixture.sex);
    assert.deepEqual(actual.saju.pillars.map(pillar => pillar.stem + pillar.branch), fixture.pillars);
    assert.deepEqual(actual.saju.lunar, fixture.lunar);
    assert.equal(digest(actual), fixture.sha256, 'Calculation outputs changed from source commit 6389ec7.');
  });
}

test('all twelve fixed legacy hour boundaries change at minute 30, not minute 29', () => {
  const boundaries = [
    [1, '子', '丑'], [3, '丑', '寅'], [5, '寅', '卯'], [7, '卯', '辰'],
    [9, '辰', '巳'], [11, '巳', '午'], [13, '午', '未'], [15, '未', '申'],
    [17, '申', '酉'], [19, '酉', '戌'], [21, '戌', '亥'], [23, '亥', '子'],
  ];
  for (const [hour, beforeBranch, afterBranch] of boundaries) {
    const before = engine.calcSaju(2000, 2, 29, hour, 29);
    const after = engine.calcSaju(2000, 2, 29, hour, 30);
    assert.equal(before.pillars[0].branch, beforeBranch, `${hour}:29`);
    assert.equal(after.pillars[0].branch, afterBranch, `${hour}:30`);
    assert.deepEqual(before.pillars.slice(1), after.pillars.slice(1));
  }
});

test('legacy day rollover stays at the calendar date despite the 23:30 hour boundary', () => {
  const early = engine.calcSaju(2025, 12, 31, 23, 29);
  const late = engine.calcSaju(2025, 12, 31, 23, 59);
  const next = engine.calcSaju(2026, 1, 1, 0, 0);
  assert.deepEqual(early.pillars[1], late.pillars[1]);
  assert.equal(late.pillars[1].stem + late.pillars[1].branch, '甲戌');
  assert.equal(next.pillars[1].stem + next.pillars[1].branch, '乙亥');
});

test('known legacy limitation: year and month pillars ignore time within the spring-term day', () => {
  const before = engine.calcSaju(2024, 2, 3, 23, 59);
  const start = engine.calcSaju(2024, 2, 4, 0, 0);
  const end = engine.calcSaju(2024, 2, 4, 23, 59);
  assert.notDeepEqual(before.pillars.slice(2), start.pillars.slice(2));
  assert.deepEqual(start.pillars.slice(2), end.pillars.slice(2));
});

test('known legacy limitations: pre-table lunar fallback and year-end empty daeun are observations', () => {
  // This fallback is NOT an assertion that solar 1900-01-01 is lunar 1900-01-01.
  assert.deepEqual(engine.calcSaju(1900, 1, 1, 0, 0).lunar, { year: 1900, month: 1, day: 1, isLeap: false });
  const saju = engine.calcSaju(2025, 12, 31, 23, 30);
  // The old engine searches same-year terms; this empty result is not a validated fate calculation.
  assert.deepEqual(engine.calcDaeun(2025, 12, 31, 'female', saju.pillars[2]), []);
});

function entry(birthOverrides = {}) {
  return {
    id: 'synthetic-engine-only',
    name: '합성 계산 테스트',
    birth: {
      calendar_type: 'solar', calendar_symbol_raw: '+', lunar_leap_month: false,
      input_year: 2000, input_month: 2, input_day: 29,
      input_hour: 1, input_minute: 29, time_status: 'known',
      sex: 'male', correction_raw: null, correction_settings: null,
      ...birthOverrides,
    },
  };
}

function freezeEntry(value) {
  if (value.birth.correction_settings) Object.freeze(value.birth.correction_settings);
  Object.freeze(value.birth);
  return Object.freeze(value);
}

test('confirmed solar adapter results preserve every original calculation result', () => {
  for (const fixture of GOLDEN) {
    const [year, month, day, hour, minute] = fixture.args;
    const input = freezeEntry(entry({ input_year: year, input_month: month, input_day: day, input_hour: hour, input_minute: minute, sex: fixture.sex }));
    const before = structuredClone(input);
    const actual = engine.calculateEntry(input);
    assert.equal(actual.status, 'ready', fixture.id);
    const projection = { saju: actual.saju, daeun: actual.daeun, strength: actual.strength, tcpa: actual.tcpa, yongsin: actual.yongsin };
    assert.equal(digest(projection), fixture.sha256, fixture.id);
    assert.deepEqual(input, before, 'Calculating must not overwrite the source birth record.');
  }
  assert.match(engine.ENGINE_VERSION, /6389ec7/);
});

test('user solar default fills previously unspecified calendar without deriving it from a raw symbol', () => {
  for (const calendar_type of [null, undefined]) {
    const birthRecord=entry({ calendar_type, calendar_symbol_raw: '-' });
    const result=engine.calculateEntry(birthRecord);
    assert.equal(result.status,'ready',JSON.stringify(result));
    assert.equal(result.assumedSolar,true);
    assert.deepEqual(result.saju,engine.calculateEntry(entry({calendar_type:'solar'})).saju);
    assert.equal(birthRecord.birth.calendar_type,calendar_type);
    assert.equal(birthRecord.birth.calendar_symbol_raw,'-');
  }
  const invalid=engine.calculateEntry(entry({calendar_type:'unverified'}));
  assert.equal(invalid.status,'needs_confirmation');
});

test('unknown or unseen time stays null and does not create an hour pillar or noon form', () => {
  for (const time_status of ['unknown', 'not_visible']) {
    // Include stale numeric values to prove that an unconfirmed time is never used.
    for (const [input_hour, input_minute] of [[null, null], [12, 0], [0, 0]]) {
      const input = freezeEntry(entry({ time_status, input_hour, input_minute }));
      const before = structuredClone(input);
      const result = engine.calculateEntry(input);
      assert.equal(result.status, 'partial');
      assert.deepEqual(result.saju.solar, { year: 2000, month: 2, day: 29, hour: null, minute: null });
      assert.deepEqual(result.saju.pillars[0], { label: '시', unknown: true });
      assert.deepEqual(result.saju.pillars.slice(1), [
        { label: '일', ...engine.getDP(2000, 2, 29) },
        { label: '월', ...engine.getMP(2000, 2, 29) },
        { label: '년', ...engine.getYP(2000, 2, 29) },
      ]);
      assert.deepEqual(result.daeun, []);
      assert.equal(result.strength, null);
      assert.equal(result.tcpa, null);
      assert.equal(result.yongsin, null);
      assert.equal(result.legacyForm, null);
      assert.deepEqual(input, before);
    }
  }
});

test('unconfirmed sex allows the known-time pillars but leaves daeun empty', () => {
  const input = freezeEntry(entry({ sex: null }));
  const result = engine.calculateEntry(input);
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.saju, engine.calcSaju(2000, 2, 29, 1, 29));
  assert.deepEqual(result.daeun, []);
  assert.match(result.message, /성별 미확인/);
  assert.equal(result.legacyForm.gender, '');
  assert.equal(input.birth.sex, null);
});

test('explicit male and female values retain the original opposite daeun directions', () => {
  const male = engine.calculateEntry(entry({ sex: 'male' }));
  const female = engine.calculateEntry(entry({ sex: 'female' }));
  assert.deepEqual(male.saju, female.saju);
  assert.deepEqual(male.daeun[0], { stem: '己', branch: '卯', stemIdx: 5, branchIdx: 3, startAge: 2, startYear: 2002 });
  assert.deepEqual(female.daeun[0], { stem: '丁', branch: '丑', stemIdx: 3, branchIdx: 1, startAge: 8, startYear: 2008 });
});

test('a recorded correction is never guessed or applied, but does not conceal calculable pillars', () => {
  for (const correction_settings of [null, {}, { legacy_confirmed: false }, { legacy_confirmed:true }]) {
    const input=freezeEntry(entry({correction_raw:"(-5' -11')",correction_settings}));
    const result=engine.calculateEntry(input);
    assert.equal(result.status,'ready',result.message);
    assert.equal(result.correctionUnapplied,true);
    assert.deepEqual(result.saju,engine.calculateEntry(entry()).saju);
    assert.equal(input.birth.correction_raw,"(-5' -11')");
    assert.match(result.message,/보정/);
  }
});

test('invalid solar dates, noninteger fields, and unsupported years are rejected before calculation', () => {
  const invalid = [
    { input_year: 1899 }, { input_year: 2031 },
    { input_year: 1900, input_month: 2, input_day: 29 },
    { input_year: 2023, input_month: 2, input_day: 29 },
    { input_month: 4, input_day: 31 }, { input_month: 0 }, { input_month: 13 },
    { input_day: 0 }, { input_day: 32 }, { input_year: '2000' }, { input_month: 2.5 }, { input_day: null },
  ];
  for (const fields of invalid) {
    const result = engine.calculateEntry(entry(fields));
    assert.equal(result.status, 'needs_confirmation', JSON.stringify(fields));
    assert.equal(result.saju, undefined);
  }
  assert.equal(engine.getMaxDay(1900, 2), 28);
  assert.equal(engine.getMaxDay(2000, 2), 29);
  assert.equal(engine.calculateEntry(entry()).status, 'ready');
});

test('a known time must contain real integer hours and minutes, including valid midnight', () => {
  const invalid = [
    { input_hour: null }, { input_minute: null }, { input_hour: -1 }, { input_hour: 24 },
    { input_minute: -1 }, { input_minute: 60 }, { input_hour: '0' }, { input_minute: 0.5 },
  ];
  for (const fields of invalid) {
    const result = engine.calculateEntry(entry(fields));
    assert.equal(result.status, 'needs_confirmation', JSON.stringify(fields));
    assert.match(result.message, /시각/);
    assert.equal(result.saju, undefined);
  }
  const midnight = engine.calculateEntry(entry({ input_hour: 0, input_minute: 0 }));
  assert.equal(midnight.status, 'ready');
  assert.equal(midnight.saju.solar.hour, 0);
  assert.equal(midnight.saju.solar.minute, 0);
});

test('lunar new year and ordinary/leap months round trip through baseline solar fixtures', () => {
  // All expected dates below were obtained from the original source, not a live calendar API.
  const conversions = [
    { lunar: [2024, 1, 1], leap: false, solar: [2024, 2, 10] },
    { lunar: [2023, 2, 1], leap: false, solar: [2023, 2, 20] },
    { lunar: [2023, 2, 1], leap: true, solar: [2023, 3, 22] },
    { lunar: [2025, 6, 1], leap: true, solar: [2025, 7, 25] },
  ];
  for (const fixture of conversions) {
    const [year, month, day] = fixture.lunar;
    const input = freezeEntry(entry({
      calendar_type: 'lunar', calendar_symbol_raw: fixture.leap ? '=' : '-', lunar_leap_month: fixture.leap,
      input_year: year, input_month: month, input_day: day, input_hour: 8, input_minute: 15,
    }));
    const before = structuredClone(input);
    const result = engine.calculateEntry(input);
    assert.equal(result.status, 'ready', JSON.stringify(fixture));
    assert.deepEqual(result.saju.solar, { year: fixture.solar[0], month: fixture.solar[1], day: fixture.solar[2], hour: 8, minute: 15 });
    assert.deepEqual(result.saju.lunar, { year, month, day, isLeap: fixture.leap });
    assert.deepEqual(result.saju, engine.calcSaju(...fixture.solar, 8, 15));
    assert.equal(result.legacyForm.year, String(fixture.solar[0]));
    assert.equal(result.legacyForm.month, String(fixture.solar[1]));
    assert.equal(result.legacyForm.day, String(fixture.solar[2]));
    assert.deepEqual(input, before, 'Conversion must retain the entered lunar date and leap-month flag.');
  }
});

test('unconfirmed or impossible leap-month inputs and out-of-range converted dates remain blocked', () => {
  const lunar = { calendar_type: 'lunar', input_year: 2023, input_month: 2, input_day: 1, lunar_leap_month: false };
  const invalid = [
    { lunar_leap_month: null }, { lunar_leap_month: undefined }, { lunar_leap_month: 'false' },
    { input_year: 2024, lunar_leap_month: true },
    { input_month: 3, lunar_leap_month: true },
    { input_day: 30, lunar_leap_month: true },
    { input_day: 31 },
    { input_year: 2030, input_month: 12, input_day: 8 },
  ];
  for (const fields of invalid) {
    const input = freezeEntry(entry({ ...lunar, ...fields }));
    const before = structuredClone(input);
    const result = engine.calculateEntry(input);
    assert.equal(result.status, 'needs_confirmation', JSON.stringify(fields));
    assert.equal(result.saju, undefined);
    assert.deepEqual(input, before);
  }
});
