import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyVault, importScreenshotPackage, upsertEntry, deleteEntry, validateVault } from '../src/vault/model.js';
import { applyBundledMappings } from '../src/vault/bundled-mappings.js';

function source(namespace, color = 'teal') {
  return {
    format: 'saju-vault-screenshot-import', format_version: '1.0.0',
    metadata: { identifier_namespace: namespace },
    source_files: [{ source_id: 'photo', file_name: 'synthetic.jpg' }],
    source_observations: [{ observation_id: 'row', source_id: 'photo', section: 'friends', name: '합성 자료', partial: false }],
    saved_entries: [{ entry_id: 'one', display_name: '합성 자료', source_section: 'friends', source_list_position: 1,
      favorite: false, is_self: false, primary_observation_id: 'row', memo: null,
      reference_display: { badge_color: color },
      birth_record: { birth_record_id: 'birth', version: 1, source_observation_id: 'row',
        date_raw: '2000/02/29', input_year: 2000, input_month: 2, input_day: 29,
        calendar_symbol_raw: '-', calendar_type: null, lunar_leap_month: null,
        time_raw: '12:00', time_status: 'known', input_hour: 12, input_minute: 0,
        sex: null, timezone: null, birthplace: null, longitude: null, correction_raw: null,
        correction_settings: null, calculation_status: 'needs_settings_confirmation', settings_status: {} } }],
    entry_observation_links: [{ observation_id: 'row', entry_id: 'one', link_kind: 'canonical' }],
  };
}
const mapping = namespace => ({ format: 'saju-vault-confirmed-mappings', version: 1, namespace,
  mappings: { calendar: { '+': null, '-': null }, sex: { teal: 'male', pink: 'female' }, lunarLeap: null } });

test('confirmed source colors fill only their own imported namespace and preserve raw sources', () => {
  let state = importScreenshotPackage(createEmptyVault(), source('owner', 'teal')).state;
  state = importScreenshotPackage(state, source('other', 'pink')).state;
  state = upsertEntry(state, { name: '합성 수동 자료' });
  const before = structuredClone(state), next = applyBundledMappings(state, mapping('owner'));
  assert.equal(next.entries[0].birth.sex, 'male');
  assert.equal(next.entries[0].birth.calendar_type, null);
  assert.equal(next.entries[0].birth.settings_status.sex, 'user_confirmed_mapping');
  assert.equal(next.entries[0].birthRevisions.length, 1);
  assert.deepEqual(next.entries[0].birthRevisions[0].birth, before.entries[0].birth);
  assert.deepEqual(next.entries.slice(1), before.entries.slice(1));
  assert.deepEqual(next.sources, before.sources);
  assert.equal(validateVault(next).valid, true);
});

test('pink maps to female and repeating a confirmed mapping does not write another revision', () => {
  const state = importScreenshotPackage(createEmptyVault(), source('owner', 'pink')).state;
  const next = applyBundledMappings(state, mapping('owner'));
  assert.equal(next.entries[0].birth.sex, 'female');
  assert.equal(applyBundledMappings(next, mapping('owner')), next);
});

test('previously confirmed sex, edited memo and deleted records survive automatic mappings', () => {
  let state = importScreenshotPackage(createEmptyVault(), source('owner', 'pink')).state;
  state = upsertEntry(state, { id: state.entries[0].id, memo: '직접 고친 합성 메모', birth: { sex: 'male' } });
  assert.equal(applyBundledMappings(state, mapping('owner')), state);
  let deleted = importScreenshotPackage(createEmptyVault(), source('owner')).state;
  deleted = deleteEntry(deleted, deleted.entries[0].id);
  assert.equal(applyBundledMappings(deleted, mapping('owner')), deleted);
});

test('absent source is not imported and invalid confirmed envelopes are rejected', () => {
  const empty = createEmptyVault();
  assert.equal(applyBundledMappings(empty, mapping('missing')), empty);
  for (const invalid of [null, { ...mapping('owner'), namespace: '' }, { ...mapping('owner'), version: 2 }, { ...mapping('owner'), extra: true }]) {
    assert.throws(() => applyBundledMappings(empty, invalid));
  }
  assert.throws(() => applyBundledMappings(empty, { ...mapping('owner'), mappings: { ...mapping('owner').mappings, sex: { teal: 'guessed', pink: null } } }));
});
