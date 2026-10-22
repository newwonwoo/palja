import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { createEmptyVault, upsertEntry, createBackup, restoreBackup } from '../src/vault/model.js';

const bundle = await build({ stdin: { contents: `export {calculateEntry} from './src/mobile/engine.js'; export {calcSaju,calcDaeun} from './src/App.jsx';`, resolveDir: new URL('../', import.meta.url).pathname }, bundle: true, write: false, platform: 'node', format: 'esm', logLevel: 'silent', define: { 'import.meta.env.VITE_APP_MODE': '"mobile"', 'import.meta.env.VITE_GEMINI_API_KEY': '""' } });
const engine = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const birth = (year, month, day, sex) => ({ name: '합성 연경계 회귀', birth: {
  input_year: year, input_month: month, input_day: day, input_hour: 12, input_minute: 0,
  time_status: 'known', calendar_type: 'solar', lunar_leap_month: false, sex,
} });

test('all 131 supported years, both sexes and 22 year-edge dates produce eight legacy decades without changing natal pillars', () => {
  let repaired = 0, preserved = 0;
  for (let year = 1900; year <= 2030; year++) {
    for (const [month, days] of [[1, Array.from({ length: 10 }, (_, i) => i + 1)], [12, Array.from({ length: 12 }, (_, i) => i + 20)]]) {
      for (const day of days) for (const sex of ['male', 'female']) {
        const entry = birth(year, month, day, sex), before = structuredClone(entry);
        const originalChart = engine.calcSaju(year, month, day, 12, 0);
        const originalDaeun = engine.calcDaeun(year, month, day, sex, originalChart.pillars[2]);
        const result = engine.calculateEntry(entry);
        assert.equal(result.status, 'ready');
        assert.equal(result.daeun.length, 8, [year, month, day, sex].join('/'));
        assert.deepEqual(result.saju, originalChart);
        assert.deepEqual(entry, before);
        if (originalDaeun.length) {
          preserved++;
          assert.deepEqual(result.daeun, originalDaeun);
          assert.equal(result.daeunBoundaryRepair, false);
        } else {
          repaired++;
          assert.equal(result.daeunBoundaryRepair, true);
          assert.ok(result.daeun[0].gapDays > 0 && result.daeun[0].gapDays < 35);
          assert.ok(result.daeun[0].startAge >= 0 && result.daeun[0].startAge <= 12);
          assert.match(result.daeun[0].basis, /UTC 정오/);
          for (let i = 1; i < 8; i++) assert.equal(result.daeun[i].startYear - result.daeun[i - 1].startYear, 10);
        }
      }
    }
  }
  assert.ok(repaired > 0 && preserved > 0);
});

test('repaired adjacent-year boundaries agree with independent Swiss Moshier event fixtures', () => {
  const reference = JSON.parse(readFileSync(new URL('./fixtures/independent-calendar.json', import.meta.url)));
  for (const [year, month, day, sex, eventYear, eventIndex] of [
    [1909, 12, 31, 'female', 1910, 0], [2019, 12, 31, 'female', 2020, 0],
    [2023, 12, 31, 'female', 2024, 0], [2029, 12, 31, 'female', 2030, 0],
    [1931, 1, 1, 'female', 1930, 22], [2001, 1, 1, 'female', 2000, 22], [2021, 1, 1, 'female', 2020, 22],
  ]) {
    const expected = reference.terms.find(row => row[0] === eventYear && row[1] === eventIndex);
    assert.ok(expected);
    const result = engine.calculateEntry(birth(year, month, day, sex));
    assert.equal(result.daeunBoundaryRepair, true);
    const gap = Math.abs(expected[2] - Date.UTC(year, month - 1, day, 12)) / 86400000;
    assert.ok(Math.abs(result.daeun[0].gapDays - gap) < 60 / 86400);
    assert.equal(result.daeun[0].startAge, Math.round(gap / 3));
    assert.equal(result.daeun[0].startYear, year + Math.round(gap / 3));
  }
});

test('the boundary repair cannot invent birth time, sex or missing dates', () => {
  for (const patch of [ { sex: null }, { time_status: 'unknown', input_hour: null, input_minute: null }, { input_year: null } ]) {
    const entry = birth(2025, 12, 31, 'female');Object.assign(entry.birth, patch);
    const result = engine.calculateEntry(entry);
    assert.equal(result.daeun?.length || 0, 0);
    assert.notEqual(result.daeunBoundaryRepair, true);
  }
});

test('backup restore retains original birth data and regenerates the same repaired decades', () => {
  const state = upsertEntry(createEmptyVault(), birth(2025, 12, 31, 'female'));
  const before = engine.calculateEntry(state.entries[0]);
  const backup = JSON.parse(JSON.stringify(createBackup(state)));
  const restored = restoreBackup(createEmptyVault(), backup).state;
  assert.deepEqual(restored.entries[0].birth, state.entries[0].birth);
  assert.deepEqual(engine.calculateEntry(restored.entries[0]), before);
  assert.equal(before.daeun.length, 8);
  assert.equal(before.daeunBoundaryRepair, true);
});
