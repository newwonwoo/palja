import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEmptyVault, validateVault, upsertEntry, toggleFavorite, setSelf,
  deleteEntry, restoreEntry, recordOpen, importScreenshotPackage,
  applyImportMappings, createBackup, restoreBackup,
} from '../src/vault/model.js';

const clone = value => JSON.parse(JSON.stringify(value));
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

// All names and records in these tests are synthetic, unrelated to the user's data.
function birth(overrides = {}) {
  return {
    birth_record_id: 'fixture-birth', version: 1, source_observation_id: null,
    date_raw: '2000/02/29', input_year: 2000, input_month: 2, input_day: 29,
    calendar_symbol_raw: '+', calendar_type: null, lunar_leap_month: null,
    time_raw: '23:45', time_status: 'known', input_hour: 23, input_minute: 45,
    sex: null, timezone: null, birthplace: null, longitude: null,
    correction_raw: "(-3' -13')", correction_settings: null,
    calculation_status: 'needs_settings_confirmation', settings_status: {},
    ...overrides,
  };
}

function screenshotPackage(namespace = 'synthetic-vault') {
  const saved_entries = [
    { entry_id: 'favorite-1', display_name: '합성 기록', favorite: true, is_self: true, source_section: 'favorites', birth_record: birth() },
    { entry_id: 'friend-1', display_name: '합성 기록', favorite: false, is_self: false, source_section: 'friends', birth_record: birth() },
    { entry_id: 'friend-2', display_name: '합성 기록', favorite: false, is_self: false, source_section: 'friends', birth_record: birth({ time_status: 'unknown', time_raw: '--:--', input_hour: null, input_minute: null }) },
    { entry_id: 'partial-1', display_name: '일부 합성 기록', favorite: null, is_self: false, source_section: 'friends', birth_record: birth({ date_raw: null, input_year: null, input_month: null, input_day: null, calendar_symbol_raw: null, time_raw: null, time_status: 'not_visible', input_hour: null, input_minute: null, correction_raw: null }) },
  ].map((entry, index) => ({
    ...entry, memo: null, source_list_position: index + 1, primary_observation_id: `observation-${index + 1}`,
    reference_display: { badge_text: '25', badge_color: 'pink', day_stem_ko: '갑', day_branch_ko: '자', status: 'screenshot_transcription_not_recalculated' },
    birth_record: { ...entry.birth_record, birth_record_id: `birth-${entry.entry_id}`, source_observation_id: `observation-${index + 1}` },
  }));
  const source_observations = saved_entries.map(entry => ({ observation_id: entry.primary_observation_id, source_id: 'source-1', name: entry.display_name, section: entry.source_section, partial: false }));
  source_observations.push({ observation_id: 'observation-self', source_id: 'source-1', name: '합성 기록', section: 'me', partial: false });
  source_observations.push({ observation_id: 'observation-overlap', source_id: 'source-2', name: null, section: 'friends', partial: true });
  const entry_observation_links = saved_entries.map(entry => ({ observation_id: entry.primary_observation_id, entry_id: entry.entry_id, link_kind: 'canonical' }));
  entry_observation_links.push({ observation_id: 'observation-self', entry_id: 'favorite-1', link_kind: 'self_view' });
  entry_observation_links.push({ observation_id: 'observation-overlap', entry_id: 'friend-1', link_kind: 'partial_overlap' });
  return {
    format: 'saju-vault-screenshot-import', format_version: '1.0.0',
    metadata: { identifier_namespace: namespace, note: 'Synthetic test data only.' },
    source_files: [{ source_id: 'source-1', file_name: 'synthetic-1.jpg' }, { source_id: 'source-2', file_name: 'synthetic-2.jpg' }],
    source_observations, saved_entries, entry_observation_links,
    self_view_alias: { source_observation_id: 'observation-self', entry_id: 'favorite-1', basis: 'matching_visible_fields_import_assumption' },
    count_reconciliation: { source_screenshots: 2, source_observations: 6, saved_entries: 4 },
  };
}

const imported = () => importScreenshotPackage(createEmptyVault(), screenshotPackage()).state;
const healthy = state => assert.deepEqual(validateVault(state), { valid: true, errors: [] });

test('empty states are independent and valid', () => {
  const one = createEmptyVault();
  const two = createEmptyVault();
  healthy(one);
  assert.equal(one.revision, 0);
  assert.notEqual(one.entries, two.entries);
  assert.deepEqual(one.recent, []);
});

test('import preserves every observation, raw birth value, and separate same-name record', () => {
  const payload = freeze(screenshotPackage());
  const empty = freeze(createEmptyVault());
  const { state, stats } = importScreenshotPackage(empty, payload);
  assert.equal(state.revision, 1);
  assert.equal(stats.added, 4);
  assert.equal(state.entries.length, 4);
  assert.equal(state.entries.filter(entry => entry.name === '합성 기록').length, 3);
  assert.equal(new Set(state.entries.map(entry => entry.id)).size, 4);
  assert.equal(state.sources.length, 1);
  assert.equal(state.sources[0].payload.source_observations.length, 6);
  assert.deepEqual(state.sources[0].payload, payload);
  assert.notEqual(state.sources[0].payload, payload);
  assert.deepEqual(state.entries[0].birth, payload.saved_entries[0].birth_record);
  assert.equal(state.entries[0].birth.calendar_type, null);
  assert.equal(state.entries[0].birth.sex, null);
  assert.equal(state.entries[0].birth.input_hour, 23);
  assert.equal(state.entries[0].birth.correction_raw, "(-3' -13')");
  assert.equal(state.entries[2].birth.time_status, 'unknown');
  assert.equal(state.entries[2].birth.time_raw, '--:--');
  assert.equal(state.entries[3].birth.time_status, 'not_visible');
  assert.equal(state.entries[3].birth.time_raw, null);
  assert.equal(state.entries[3].favorite, false);
  assert.equal(state.sources[0].payload.saved_entries[3].favorite, null);
  assert.equal(state.selfId, state.entries[0].id);
  assert.deepEqual(state.recent, []);
  assert.equal(empty.entries.length, 0);
  healthy(state);
});

test('re-import is idempotent even when JSON property order changes', () => {
  const payload = screenshotPackage();
  const state = freeze(importScreenshotPackage(createEmptyVault(), payload).state);
  const reordered = Object.fromEntries(Object.entries(payload).reverse());
  const result = importScreenshotPackage(state, JSON.stringify(reordered));
  assert.equal(result.state, state);
  assert.equal(result.stats.added, 0);
  assert.equal(result.stats.skipped, 4);
  assert.equal(result.stats.sourcesAdded, 0);
  assert.deepEqual(result.stats.conflicts, []);
});

test('local edits, favorites, explicit self removal, and tombstones survive re-import', () => {
  let state = imported();
  const firstId = state.entries[0].id;
  const deletedId = state.entries[1].id;
  state = upsertEntry(state, { id: firstId, name: '사용자 수정', memo: '기기 내부 메모', birth: { calendar_type: 'solar', sex: 'male' } });
  state = toggleFavorite(state, firstId);
  state = setSelf(state, null);
  state = deleteEntry(state, deletedId);
  const result = importScreenshotPackage(freeze(state), screenshotPackage());
  assert.equal(result.state, state);
  assert.equal(result.state.entries[0].name, '사용자 수정');
  assert.equal(result.state.entries[0].memo, '기기 내부 메모');
  assert.equal(result.state.entries[0].favorite, false);
  assert.equal(result.state.entries[0].birth.sex, 'male');
  assert.equal(result.state.selfId, null);
  assert.ok(result.state.entries[1].deletedAt);
  assert.equal(result.state.sources[0].payload.saved_entries[0].display_name, '합성 기록');
});

test('a changed payload in the same namespace is a conflict, not an overwrite', () => {
  const state = freeze(imported());
  const changed = screenshotPackage();
  changed.metadata.note = 'Changed source contents.';
  changed.saved_entries[0].display_name = '다른 원문';
  const result = importScreenshotPackage(state, changed);
  assert.equal(result.state, state);
  assert.equal(result.stats.added, 0);
  assert.equal(result.stats.skipped, 4);
  assert.equal(result.stats.conflicts[0].kind, 'source');
  assert.equal(result.stats.conflicts[0].namespace, 'synthetic-vault');
});

test('different namespaces retain distinct identities and do not overwrite the current self', () => {
  const state = imported();
  const { state: next } = importScreenshotPackage(freeze(state), screenshotPackage('other-synthetic-vault'));
  assert.equal(next.entries.length, 8);
  assert.equal(next.sources.length, 2);
  assert.equal(new Set(next.entries.map(entry => entry.id)).size, 8);
  assert.equal(next.selfId, state.selfId);
  assert.equal(next.revision, state.revision + 1);
  healthy(next);
});

test('native incomplete records can be saved without inventing birth data', () => {
  const state = upsertEntry(freeze(createEmptyVault()), { name: '합성ㅇ기록' });
  assert.equal(state.entries.length, 1);
  const entry = state.entries[0];
  assert.equal(entry.birth.calendar_type, null);
  assert.equal(entry.birth.sex, null);
  assert.equal(entry.birth.input_year, null);
  assert.equal(entry.birth.input_hour, null);
  assert.equal(entry.birth.time_status, 'not_visible');
  assert.equal(entry.source, null);
  assert.equal(entry.referenceDisplay, null);
  assert.deepEqual(entry.birthRevisions, []);
  assert.throws(() => upsertEntry(state, { id: 'missing-id', name: '실수' }), /does not exist/);
  healthy(state);
});

test('solar dates are validated without JavaScript date rollover', () => {
  for (const [year, month, day] of [[1900, 2, 29], [2023, 2, 29], [2000, 4, 31], [2000, 13, 1], [0, 1, 1], [2000, 1, 0]]) {
    const state = freeze(createEmptyVault());
    assert.throws(() => upsertEntry(state, { name: '합성', birth: birth({ calendar_type: 'solar', input_year: year, input_month: month, input_day: day }) }), /Invalid/);
    assert.equal(state.entries.length, 0);
  }
  const valid = upsertEntry(createEmptyVault(), { name: '윤년 합성', birth: birth({ calendar_type: 'solar' }) });
  assert.equal(valid.entries[0].birth.input_day, 29);
  healthy(valid);
});

test('lunar dates use lunar ranges and unresolved dates are not coerced to solar', () => {
  const lunar = upsertEntry(createEmptyVault(), { name: '음력 합성', birth: birth({ calendar_type: 'lunar', input_day: 30, lunar_leap_month: true }) });
  healthy(lunar);
  assert.throws(() => upsertEntry(createEmptyVault(), { name: '합성', birth: birth({ calendar_type: 'lunar', input_day: 31 }) }), /input_day/);
  assert.throws(() => upsertEntry(createEmptyVault(), { name: '합성', birth: birth({ calendar_type: 'solar', lunar_leap_month: true }) }), /solar date cannot/);
  const unresolved = upsertEntry(createEmptyVault(), { name: '미확인 합성', birth: birth({ calendar_type: null, input_day: 30 }) });
  assert.equal(unresolved.entries[0].birth.calendar_type, null);
  assert.equal(unresolved.entries[0].birth.input_day, 30);
});

test('time boundaries, known versus unknown, and enum values are validated', () => {
  for (const patch of [
    { input_hour: 24 }, { input_hour: -1 }, { input_minute: 60 }, { input_minute: 0.5 },
    { input_hour: null }, { time_status: 'unknown' }, { time_status: 'not_visible', input_hour: null },
    { calendar_type: 'gregorian' }, { sex: 'pink' }, { time_status: 'estimated' },
    { input_year: '2000' }, { longitude: 181 },
  ]) assert.throws(() => upsertEntry(createEmptyVault(), { name: '합성', birth: birth(patch) }), /Invalid/);
  const midnight = upsertEntry(createEmptyVault(), { name: '자정 합성', birth: birth({ input_hour: 0, input_minute: 0 }) });
  assert.equal(midnight.entries[0].birth.input_hour, 0);
  const unknown = upsertEntry(createEmptyVault(), { name: '시간 미상', birth: birth({ time_status: 'unknown', input_hour: null, input_minute: null, time_raw: '--:--' }) });
  assert.equal(unknown.entries[0].birth.input_hour, null);
});

test('birth edits create ordered snapshots and preserve raw reference data', () => {
  const original = freeze(imported());
  const id = original.entries[0].id;
  const draft = freeze({ id, birth: { input_hour: 22 } });
  const one = upsertEntry(original, draft);
  assert.equal(one.entries[0].birth.version, 2);
  assert.deepEqual(one.entries[0].birthRevisions[0].birth, original.entries[0].birth);
  assert.equal(one.entries[0].birth.time_raw, '23:45');
  assert.equal(one.entries[0].birth.correction_raw, "(-3' -13')");
  assert.deepEqual(one.entries[0].referenceDisplay, original.entries[0].referenceDisplay);
  assert.equal(original.entries[0].birth.input_hour, 23);
  const two = upsertEntry(one, { id, birth: { calendar_type: 'solar' } });
  assert.deepEqual(two.entries[0].birthRevisions.map(item => item.birth.version), [1, 2]);
  assert.equal(two.entries[0].birth.version, 3);
  const nameOnly = upsertEntry(two, { id, name: '이름만 수정' });
  assert.equal(nameOnly.entries[0].birthRevisions.length, 2);
  assert.equal(upsertEntry(nameOnly, clone(nameOnly.entries[0])), nameOnly);
  assert.throws(() => upsertEntry(nameOnly, { id, birth: { version: 100 } }), /managed by the vault/);
  assert.throws(() => upsertEntry(nameOnly, { id, source: null }), /not an editable field/);
  healthy(nameOnly);
});

test('favorite and self selection change the same entry instead of creating copies', () => {
  const state = freeze(imported());
  const id = state.entries[1].id;
  const favorite = toggleFavorite(state, id);
  assert.equal(favorite.entries.length, state.entries.length);
  assert.equal(favorite.entries[1].favorite, true);
  assert.equal(favorite.entries[1].id, id);
  assert.equal(favorite.revision, state.revision + 1);
  const self = setSelf(favorite, id);
  assert.equal(self.selfId, id);
  assert.equal(setSelf(self, id), self);
  assert.throws(() => setSelf(self, 'missing'), /does not exist/);
});

test('correction settings retain unknown fields while an explicit legacy confirmation is added', () => {
  let state = upsertEntry(createEmptyVault(), { name: '설정 합성', birth: birth({ correction_settings: { custom_policy: 'keep', longitude_minutes: -12 } }) });
  const id = state.entries[0].id;
  state = upsertEntry(state, { id, birth: { correction_settings: { legacy_confirmed: true } } });
  assert.deepEqual(state.entries[0].birth.correction_settings, { custom_policy: 'keep', longitude_minutes: -12, legacy_confirmed: true });
  assert.equal(state.entries[0].birth.correction_raw, "(-3' -13')");
  assert.throws(() => upsertEntry(state, { id, birth: { correction_settings: { legacy_confirmed: 'true' } } }), /must be a boolean/);
  healthy(state);
});

test('deletion keeps tombstones, clears dangling self and recent references, and is explicitly reversible', () => {
  let state = imported();
  const id = state.selfId;
  state = recordOpen(state, id);
  const deleted = deleteEntry(freeze(state), id);
  assert.equal(deleted.entries.length, state.entries.length);
  assert.equal(deleted.selfId, null);
  assert.deepEqual(deleted.recent, []);
  assert.ok(deleted.entries[0].deletedAt);
  assert.equal(deleteEntry(deleted, id), deleted);
  assert.throws(() => recordOpen(deleted, id), /deleted/);
  assert.throws(() => setSelf(deleted, id), /deleted/);
  assert.throws(() => toggleFavorite(deleted, id), /deleted/);
  assert.throws(() => upsertEntry(deleted, { id, name: '변경' }), /deleted/);
  assert.ok(createBackup(deleted).state.entries[0].deletedAt);
  const restored = restoreEntry(freeze(deleted), id);
  assert.equal(restored.entries[0].deletedAt, null);
  assert.equal(restored.selfId, null);
  assert.deepEqual(restored.recent, []);
  assert.equal(restoreEntry(restored, id), restored);
  healthy(restored);
});

test('recent openings are deduplicated in most recent order and never fabricate import history', () => {
  let state = imported();
  const [first, second] = state.entries;
  state = recordOpen(freeze(state), first.id);
  state = recordOpen(freeze(state), second.id);
  state = recordOpen(freeze(state), first.id);
  assert.deepEqual(state.recent.map(item => item.entryId), [first.id, second.id]);
  const repeat = recordOpen(state, first.id);
  assert.equal(repeat.recent.length, 2);
  assert.ok(repeat.recent.every(item => Number.isFinite(Date.parse(item.openedAt))));
  healthy(repeat);
});

test('backup roundtrip includes sources, birth history, favorites, self, recents, and deleted entries', () => {
  let state = imported();
  state = upsertEntry(state, { id: state.entries[0].id, memo: '백업 메모', birth: { calendar_type: 'solar' } });
  state = recordOpen(state, state.entries[0].id);
  state = deleteEntry(state, state.entries[3].id);
  const backup = createBackup(freeze(state));
  assert.notEqual(backup.state, state);
  const result = restoreBackup(freeze(createEmptyVault()), JSON.stringify(backup));
  assert.equal(result.stats.added, 4);
  assert.equal(result.state.revision, 1);
  for (const key of ['entries', 'sources', 'selfId', 'recent']) assert.deepEqual(result.state[key], state[key]);
  const duplicate = restoreBackup(freeze(result.state), backup);
  assert.equal(duplicate.state, result.state);
  assert.equal(duplicate.stats.added, 0);
  backup.state.entries[0].memo = '별도 복사본';
  assert.equal(state.entries[0].memo, '백업 메모');
  healthy(result.state);
});

test('backup merge keeps local edits and deletions rather than restoring older values', () => {
  const initial = imported();
  const backup = createBackup(initial);
  let local = upsertEntry(initial, { id: initial.entries[0].id, name: '최신 이름', memo: '최신 메모' });
  local = toggleFavorite(local, local.entries[0].id);
  local = deleteEntry(local, local.entries[1].id);
  local = setSelf(local, null);
  const result = restoreBackup(freeze(local), backup);
  assert.equal(result.state, local);
  assert.equal(result.stats.updated, 0);
  assert.equal(result.state.entries[0].name, '최신 이름');
  assert.equal(result.state.entries[0].favorite, false);
  assert.ok(result.state.entries[1].deletedAt);
  assert.equal(result.state.selfId, null);
  assert.ok(result.stats.conflicts.some(conflict => conflict.kind === 'entry'));
  assert.ok(result.stats.conflicts.some(conflict => conflict.kind === 'self'));
});

test('backup namespace conflicts block dependent records while independent new records can merge', () => {
  const local = imported();
  const changedPackage = screenshotPackage();
  changedPackage.metadata.note = 'Conflicting source revision.';
  let incoming = importScreenshotPackage(createEmptyVault(), changedPackage).state;
  incoming = upsertEntry(incoming, { name: '별도 로컬 합성' });
  incoming = recordOpen(incoming, incoming.entries.at(-1).id);
  const result = restoreBackup(freeze(local), createBackup(incoming));
  assert.equal(result.stats.added, 1);
  assert.equal(result.state.entries.length, 5);
  assert.equal(result.state.sources.length, 1);
  assert.equal(result.state.sources[0].payload.metadata.note, 'Synthetic test data only.');
  assert.equal(result.stats.conflicts[0].kind, 'source');
  assert.equal(result.state.recent[0].entryId, incoming.entries.at(-1).id);
  healthy(result.state);
});

test('merged recent records retain local timestamps and are ordered by the saved opening time', () => {
  let local = upsertEntry(createEmptyVault(), { name: '로컬 합성' });
  local = recordOpen(local, local.entries[0].id);
  local.recent[0].openedAt = '2020-01-01T00:00:00.000Z';
  let incoming = upsertEntry(createEmptyVault(), { name: '복원 합성' });
  incoming = recordOpen(incoming, incoming.entries[0].id);
  incoming.recent[0].openedAt = '2021-01-01T00:00:00.000Z';
  const result = restoreBackup(freeze(local), createBackup(incoming));
  assert.deepEqual(result.state.recent.map(item => item.entryId), [incoming.entries[0].id, local.entries[0].id]);
  assert.equal(result.state.recent[1].openedAt, '2020-01-01T00:00:00.000Z');
  assert.equal(restoreBackup(result.state, createBackup(incoming)).state, result.state);
});

test('restore validates the complete structure before any merge, retaining atomicity', () => {
  const local = freeze(imported());
  const before = JSON.stringify(local);
  const mutations = [
    backup => { backup.version = 2; },
    backup => { backup.unexpected = true; },
    backup => { backup.state.selfId = 'unknown'; },
    backup => { backup.state.recent = [{ entryId: 'unknown', openedAt: backup.exportedAt }]; },
    backup => { backup.state.entries.push(clone(backup.state.entries[0])); },
    backup => { backup.state.entries[0].unexpected = true; },
    backup => { backup.state.entries[0].birth.input_hour = 99; },
    backup => { backup.state.entries[0].source.observationId = 'missing'; },
    backup => { backup.state.sources[0].payload.saved_entries = {}; },
    backup => { backup.state.sources[0].payload.entry_observation_links[0].entry_id = 'missing'; },
    backup => { backup.state.entries[0].deletedAt = backup.exportedAt; },
  ];
  for (const mutate of mutations) {
    const backup = createBackup(local);
    mutate(backup);
    assert.throws(() => restoreBackup(local, backup), { name: 'VaultValidationError' });
    assert.equal(JSON.stringify(local), before);
  }
});

test('invalid imports cannot partially append sources or entries', () => {
  const state = freeze(createEmptyVault());
  for (const mutate of [
    payload => { payload.saved_entries[1].entry_id = payload.saved_entries[0].entry_id; },
    payload => { payload.entry_observation_links.pop(); },
    payload => { payload.source_observations[0].source_id = 'missing'; },
    payload => { payload.count_reconciliation.saved_entries = 100; },
    payload => { payload.saved_entries[0].birth_record.time_status = 'unknown'; },
    payload => { payload.self_view_alias.entry_id = 'missing'; },
  ]) {
    const payload = screenshotPackage();
    mutate(payload);
    assert.throws(() => importScreenshotPackage(state, payload), { name: 'VaultValidationError' });
    assert.equal(state.sources.length, 0);
    assert.equal(state.entries.length, 0);
    assert.equal(state.revision, 0);
  }
  assert.throws(() => importScreenshotPackage(state, '{bad json'), /invalid JSON/);
  assert.throws(() => restoreBackup(state, '{"__proto__":{"polluted":true}}'), /unsafe object key/);
  assert.equal({}.polluted, undefined);
});

test('validation reports JSON and reference failures without throwing', () => {
  const circular = createEmptyVault();
  circular.entries.push(circular);
  assert.equal(validateVault(circular).valid, false);
  assert.equal(validateVault(undefined).valid, false);
  const bad = imported();
  bad.sources[0].payload.saved_entries = {};
  assert.equal(validateVault(bad).valid, false);
  assert.equal(validateVault({ ...createEmptyVault(), revision: -1 }).valid, false);
});

test('bulk mappings only fill unconfirmed imported values and commit one vault revision', () => {
  const payload = screenshotPackage();
  payload.saved_entries[1].birth_record.calendar_symbol_raw = '-';
  payload.saved_entries[1].reference_display.badge_color = 'teal';
  let state = importScreenshotPackage(createEmptyVault(), payload).state;
  state = upsertEntry(state, { id: state.entries[2].id, birth: { calendar_type: 'lunar', sex: 'male', lunar_leap_month: true, settings_status: { custom: 'preserve' } } });
  const confirmed = clone(state.entries[2]);
  const source = clone(state.sources);
  const original = freeze(state);
  const mappings = freeze({ calendar: { '+': 'solar', '-': 'lunar' }, sex: { teal: 'male', pink: 'female' }, lunarLeap: false });
  const next = applyImportMappings(original, mappings);
  assert.equal(next.revision, original.revision + 1);
  assert.equal(next.entries[0].birth.calendar_type, 'solar');
  assert.equal(next.entries[0].birth.sex, 'female');
  assert.equal(next.entries[0].birth.lunar_leap_month, null);
  assert.equal(next.entries[1].birth.calendar_type, 'lunar');
  assert.equal(next.entries[1].birth.sex, 'male');
  assert.equal(next.entries[1].birth.lunar_leap_month, false);
  assert.equal(next.entries[0].birth.version, 2);
  assert.equal(next.entries[0].birthRevisions.length, 1);
  assert.equal(next.entries[1].birth.version, 2);
  assert.equal(next.entries[1].birthRevisions.length, 1);
  assert.deepEqual(next.entries[0].birthRevisions[0].birth, original.entries[0].birth);
  assert.equal(next.entries[0].birth.settings_status.calendar_type, 'user_confirmed_mapping');
  assert.deepEqual(next.entries[2], confirmed);
  assert.equal(next.entries[3].birth.calendar_type, null);
  assert.equal(next.entries[3].birth.sex, 'female');
  assert.deepEqual(next.sources, source);
  assert.deepEqual(next.entries[0].referenceDisplay, original.entries[0].referenceDisplay);
  assert.equal(next.entries[0].birth.correction_raw, "(-3' -13')");
  assert.equal(applyImportMappings(next, mappings), next);
  assert.equal(importScreenshotPackage(next, payload).state, next);
  healthy(next);
});

test('bulk mappings leave all-null selections, native records, and tombstones unchanged', () => {
  let state = imported();
  const untouched = applyImportMappings(state, { calendar: { '+': null, '-': null }, sex: { teal: null, pink: null }, lunarLeap: null });
  assert.equal(untouched, state);
  state = deleteEntry(state, state.entries[0].id);
  state = upsertEntry(state, { name: '네이티브 합성', birth: birth() });
  const deleted = clone(state.entries[0]);
  const native = clone(state.entries.at(-1));
  const next = applyImportMappings(freeze(state), { calendar: { '+': 'solar', '-': null }, sex: { teal: null, pink: 'female' }, lunarLeap: null });
  assert.deepEqual(next.entries[0], deleted);
  assert.deepEqual(next.entries.at(-1), native);
  assert.equal(next.entries[1].birth.calendar_type, 'solar');
  assert.equal(next.entries[1].birth.sex, 'female');
});

test('mapping validation distinguishes calendar, sex, and lunar leap fields and is atomic', () => {
  const state = freeze(imported());
  const valid = { calendar: { '+': 'solar', '-': 'lunar' }, sex: { teal: 'male', pink: 'female' }, lunarLeap: false };
  for (const mutate of [
    mapping => { mapping.calendar['+'] = 'male'; },
    mapping => { mapping.calendar['-'] = 'solar'; },
    mapping => { mapping.sex.teal = 'solar'; },
    mapping => { mapping.lunarLeap = 'false'; },
    mapping => { delete mapping.calendar['-']; },
    mapping => { mapping.sex.blue = 'male'; },
    mapping => { mapping.extra = true; },
  ]) {
    const mapping = clone(valid);
    mutate(mapping);
    assert.throws(() => applyImportMappings(state, mapping), { name: 'VaultValidationError' });
  }
  const payload = screenshotPackage('invalid-solar-after-confirmation');
  payload.saved_entries[1].birth_record.input_year = 1900;
  const unresolved = freeze(importScreenshotPackage(createEmptyVault(), payload).state);
  const before = JSON.stringify(unresolved);
  assert.throws(() => applyImportMappings(unresolved, valid), /invalid solar calendar date/);
  assert.equal(JSON.stringify(unresolved), before);
  assert.equal(unresolved.entries[0].birth.calendar_type, null);
});
