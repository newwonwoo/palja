import {manualDaeunErrors} from './manual-daewoon.js';
import {validatePolicy} from '../calendar/policy.js';
import { isManualBirth, pillarInputErrors } from './pillar-input.js';
import { validateWorkspace, mergeWorkspaces } from './workspace.js';
/** Offline vault domain model. No storage, network, or calendar calculation here. */
const STATE_FORMAT = 'saju-vault-state';
const BACKUP_FORMAT = 'saju-vault-backup';
const IMPORT_FORMAT = 'saju-vault-screenshot-import';
const VERSION = 1;
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const plain = value => value !== null && typeof value === 'object'
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const copy = value => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const integer = value => Number.isSafeInteger(value);
const timestamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value))
  && new Date(value).toISOString() === value;
const keyFor = (namespace, entryId) => JSON.stringify([namespace, entryId]);
const importedId = (namespace, entryId) => `import:${encodeURIComponent(namespace)}:${encodeURIComponent(entryId)}`;
let fallbackSequence = 0;

function localId(prefix) {
  const uuid = globalThis.crypto?.randomUUID?.();
  return `${prefix}-${uuid || `${Date.now().toString(36)}-${++fallbackSequence}-${Math.random().toString(36).slice(2)}`}`;
}

// Key order is irrelevant when checking whether the same original source was imported.
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (plain(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

const same = (left, right) => canonical(left) === canonical(right);
const issue = (errors, path, message) => errors.push(`${path}: ${message}`);

function inspectJson(value, errors, path = '$', ancestors = new Set()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (!Array.isArray(value) && !plain(value)) {
    issue(errors, path, 'must contain only JSON values');
    return;
  }
  if (ancestors.has(value)) {
    issue(errors, path, 'circular references are not allowed');
    return;
  }
  ancestors.add(value);
  for (const key of Object.keys(value)) {
    if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
      issue(errors, `${path}.${key}`, 'unsafe object key');
    } else {
      inspectJson(value[key], errors, `${path}.${key}`, ancestors);
    }
  }
  ancestors.delete(value);
}

function fields(value, required, errors, path, strict = true) {
  if (!plain(value)) {
    issue(errors, path, 'must be an object');
    return false;
  }
  for (const key of required) if (!own(value, key)) issue(errors, `${path}.${key}`, 'is required');
  if (strict) for (const key of Object.keys(value)) {
    if (!required.includes(key)) issue(errors, `${path}.${key}`, 'unexpected field');
  }
  return true;
}

function fail(label, errors) {
  const error = new Error(`Invalid ${label}: ${errors.slice(0, 8).join('; ')}`);
  error.name = 'VaultValidationError';
  error.issues = errors;
  throw error;
}

function readPayload(value, label) {
  let parsed = value;
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value); } catch { fail(label, ['$: invalid JSON']); }
  }
  const errors = [];
  inspectJson(parsed, errors);
  if (errors.length) fail(label, errors);
  return parsed;
}

function validateBirth(birth, errors, path) {
  if(birth?.public_profile!==undefined){
    const p=birth.public_profile,allowed=['id','url','publisher','place','category','checkedAt'];
    if(!plain(p)||Object.keys(p).length!==allowed.length||allowed.some(k=>typeof p[k]!=='string'||!p[k]||p[k].length>1000)||Object.keys(p).some(k=>!allowed.includes(k))||!/^https:\/\//.test(p.url)||!/^\d{4}-\d{2}-\d{2}$/.test(p.checkedAt))issue(errors,path,'invalid public profile provenance');
  }
  if(birth?.calculation_policy!==undefined&&birth.calculation_policy!==null)for(const message of validatePolicy(birth.calculation_policy))issue(errors,path,message);
  if(birth?.manual_daeun!=null){if(!isManualBirth(birth))issue(errors,path,'manual decade settings require direct pillar input');for(const message of manualDaeunErrors(birth.manual_daeun))issue(errors,path,message);}
  const required = ['version', 'input_year', 'input_month', 'input_day', 'calendar_type',
    'lunar_leap_month', 'time_status', 'input_hour', 'input_minute', 'sex'];
  if (!fields(birth, required, errors, path, false)) return;
  if (isManualBirth(birth)) {
    if(birth.calculation_policy!=null) issue(errors,path,'manual pillars cannot carry a calendar calculation policy');
    for (const error of pillarInputErrors(birth.pillar_input)) issue(errors, `${path}.pillar_input`, error);
    const calendarKeys = ['input_year', 'input_month', 'input_day', 'calendar_type', 'lunar_leap_month', 'input_hour', 'input_minute'];
    if (calendarKeys.some(key => birth[key] !== null) || birth.time_status !== 'unknown') {
      issue(errors, path, 'manual pillars must not fabricate a calendar birth date or time');
    }
    for (const key of ['date_raw', 'time_raw', 'calendar_symbol_raw', 'correction_raw', 'timezone', 'longitude']) {
      if (birth[key] != null) issue(errors, `${path}.${key}`, 'must be null for manual pillars');
    }
  }

  if (!integer(birth.version) || birth.version < 1) issue(errors, `${path}.version`, 'must be a positive integer');
  if (![null, 'solar', 'lunar'].includes(birth.calendar_type)) issue(errors, `${path}.calendar_type`, 'must be solar, lunar, or null');
  if (![null, 'male', 'female'].includes(birth.sex)) issue(errors, `${path}.sex`, 'must be male, female, or null');
  if (![null, true, false].includes(birth.lunar_leap_month)) issue(errors, `${path}.lunar_leap_month`, 'must be boolean or null');
  if (birth.calendar_type === 'solar' && birth.lunar_leap_month === true) issue(errors, `${path}.lunar_leap_month`, 'a solar date cannot be a lunar leap month');
  for (const [key, limit] of [['input_year', 9999], ['input_month', 12], ['input_day', birth.calendar_type === 'lunar' ? 30 : 31]]) {
    if (birth[key] !== null && (!integer(birth[key]) || birth[key] < 1 || birth[key] > limit)) {
      issue(errors, `${path}.${key}`, `must be an integer from 1 to ${limit}, or null`);
    }
  }
  const { input_year: year, input_month: month, input_day: day } = birth;
  if (birth.calendar_type === 'solar' && integer(year) && integer(month) && integer(day) && month >= 1 && month <= 12) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day > days[month - 1]) issue(errors, path, 'invalid solar calendar date');
  }
  if (!['known', 'unknown', 'not_visible'].includes(birth.time_status)) {
    issue(errors, `${path}.time_status`, 'must be known, unknown, or not_visible');
  } else if (birth.time_status === 'known') {
    if (!integer(birth.input_hour) || birth.input_hour < 0 || birth.input_hour > 23) issue(errors, `${path}.input_hour`, 'known time requires an hour from 0 to 23');
    if (!integer(birth.input_minute) || birth.input_minute < 0 || birth.input_minute > 59) issue(errors, `${path}.input_minute`, 'known time requires a minute from 0 to 59');
  } else if (birth.input_hour !== null || birth.input_minute !== null) {
    issue(errors, path, 'unknown or not_visible time must retain null hour and minute');
  }
  for (const key of ['birth_record_id', 'source_observation_id', 'date_raw', 'calendar_symbol_raw', 'time_raw', 'correction_raw', 'timezone', 'calculation_status']) {
    if (own(birth, key) && birth[key] !== null && typeof birth[key] !== 'string') issue(errors, `${path}.${key}`, 'must be a string or null');
  }
  if (own(birth, 'longitude') && birth.longitude !== null
      && (typeof birth.longitude !== 'number' || birth.longitude < -180 || birth.longitude > 180)) {
    issue(errors, `${path}.longitude`, 'must be between -180 and 180, or null');
  }
  for (const key of ['correction_settings', 'settings_status']) {
    if (own(birth, key) && birth[key] !== null && !plain(birth[key])) issue(errors, `${path}.${key}`, 'must be an object or null');
  }
  if (plain(birth.correction_settings) && own(birth.correction_settings, 'legacy_confirmed')
      && typeof birth.correction_settings.legacy_confirmed !== 'boolean') {
    issue(errors, `${path}.correction_settings.legacy_confirmed`, 'must be a boolean');
  }
}

function validateImport(payload, errors, path = '$') {
  const required = ['format', 'format_version', 'metadata', 'saved_entries', 'source_files', 'source_observations', 'entry_observation_links'];
  if (!fields(payload, required, errors, path, false)) return;
  if (payload.format !== IMPORT_FORMAT || payload.format_version !== '1.0.0') issue(errors, path, 'unsupported screenshot package format or version');
  const namespace = payload.metadata?.identifier_namespace;
  if (!nonempty(namespace)) issue(errors, `${path}.metadata.identifier_namespace`, 'is required');
  for (const key of ['saved_entries', 'source_files', 'source_observations', 'entry_observation_links']) {
    if (!Array.isArray(payload[key])) issue(errors, `${path}.${key}`, 'must be an array');
  }
  if (!required.slice(3).every(key => Array.isArray(payload[key]))) return;
  const fileIds = new Set();
  for (const [index, source] of payload.source_files.entries()) {
    const at = `${path}.source_files[${index}]`;
    if (!plain(source) || !nonempty(source.source_id) || !nonempty(source.file_name)) {
      issue(errors, at, 'source_id and file_name are required');
      continue;
    }
    if (fileIds.has(source.source_id)) issue(errors, at, 'duplicate source_id');
    fileIds.add(source.source_id);
  }
  const observations = new Map();
  for (const [index, observation] of payload.source_observations.entries()) {
    const at = `${path}.source_observations[${index}]`;
    if (!plain(observation) || !nonempty(observation.observation_id)) { issue(errors, at, 'observation_id is required'); continue; }
    if (observations.has(observation.observation_id)) issue(errors, at, 'duplicate observation_id');
    observations.set(observation.observation_id, observation);
    if (!fileIds.has(observation.source_id)) issue(errors, at, 'unknown source_id');
  }
  const entries = new Map();
  let selfCount = 0;
  for (const [index, entry] of payload.saved_entries.entries()) {
    const at = `${path}.saved_entries[${index}]`;
    if (!plain(entry) || !nonempty(entry.entry_id)) { issue(errors, at, 'entry_id is required'); continue; }
    if (entries.has(entry.entry_id)) issue(errors, at, 'duplicate entry_id');
    entries.set(entry.entry_id, entry);
    if (!nonempty(entry.display_name)) issue(errors, `${at}.display_name`, 'a name is required');
    if (![null, true, false].includes(entry.favorite) || typeof entry.is_self !== 'boolean') issue(errors, at, 'favorite must be boolean or null; is_self must be boolean');
    if (entry.is_self) selfCount += 1;
    if (!['friends', 'favorites'].includes(entry.source_section)) issue(errors, `${at}.source_section`, 'must be friends or favorites');
    if (entry.memo !== null && typeof entry.memo !== 'string') issue(errors, `${at}.memo`, 'must be a string or null');
    if (!plain(entry.reference_display)) issue(errors, `${at}.reference_display`, 'must be an object');
    if (!observations.has(entry.primary_observation_id)) issue(errors, at, 'unknown primary_observation_id');
    validateBirth(entry.birth_record, errors, `${at}.birth_record`);
    if (entry.birth_record?.source_observation_id != null && !observations.has(entry.birth_record.source_observation_id)) issue(errors, at, 'unknown birth source_observation_id');
  }
  if (selfCount > 1) issue(errors, path, 'multiple self entries are not allowed');
  const linked = new Set();
  const canonicalLinks = new Set();
  for (const [index, link] of payload.entry_observation_links.entries()) {
    const at = `${path}.entry_observation_links[${index}]`;
    if (!plain(link)) { issue(errors, at, 'must be an object'); continue; }
    if (!observations.has(link.observation_id) || !entries.has(link.entry_id)) issue(errors, at, 'unknown observation or entry reference');
    if (linked.has(link.observation_id)) issue(errors, at, 'observation must be linked exactly once');
    linked.add(link.observation_id);
    if (entries.get(link.entry_id)?.primary_observation_id === link.observation_id) canonicalLinks.add(link.entry_id);
  }
  if (linked.size !== observations.size) issue(errors, path, 'every source observation must have one entry link');
  if (canonicalLinks.size !== entries.size) issue(errors, path, 'every saved entry must link its primary observation');
  if (payload.self_view_alias != null) {
    const alias = payload.self_view_alias;
    if (!plain(alias) || !entries.has(alias.entry_id) || !observations.has(alias.source_observation_id)) {
      issue(errors, `${path}.self_view_alias`, 'invalid self alias reference');
    } else if (!entries.get(alias.entry_id).is_self || !payload.entry_observation_links.some(link => link.observation_id === alias.source_observation_id && link.entry_id === alias.entry_id)) {
      issue(errors, `${path}.self_view_alias`, 'self alias must point to its marked and linked entry');
    }
  }
  if (payload.count_reconciliation != null) {
    const counts = payload.count_reconciliation;
    if (!plain(counts)) issue(errors, `${path}.count_reconciliation`, 'must be an object');
    else for (const [key, actual] of [['source_screenshots', payload.source_files.length], ['source_observations', observations.size], ['saved_entries', entries.size]]) {
      if (own(counts, key) && counts[key] !== actual) issue(errors, `${path}.count_reconciliation.${key}`, 'does not match the data');
    }
  }
}

export function createEmptyVault() {
  return { format: STATE_FORMAT, version: VERSION, revision: 0, entries: [], sources: [], selfId: null, recent: [] };
}

export function validateVault(state) {
  const errors = [];
  inspectJson(state, errors);
  if (errors.length) return { valid: false, errors };
  if (!fields(state, ['format', 'version', 'revision', 'entries', 'sources', 'selfId', 'recent', ...(own(state, 'workspace') ? ['workspace'] : [])], errors, '$')) return { valid: false, errors };
  if (state.format !== STATE_FORMAT || state.version !== VERSION) issue(errors, '$', 'unsupported vault format or version');
  if (!integer(state.revision) || state.revision < 0) issue(errors, '$.revision', 'must be a nonnegative integer');
  for (const key of ['entries', 'sources', 'recent']) if (!Array.isArray(state[key])) issue(errors, `$.${key}`, 'must be an array');
  if (!['entries', 'sources', 'recent'].every(key => Array.isArray(state[key]))) return { valid: false, errors };
  const sources = new Map();
  for (const [index, source] of state.sources.entries()) {
    const at = `$.sources[${index}]`;
    if (!fields(source, ['namespace', 'importedAt', 'payload'], errors, at)) continue;
    if (!nonempty(source.namespace) || sources.has(source.namespace)) issue(errors, at, 'namespace must be nonempty and unique');
    if (!timestamp(source.importedAt)) issue(errors, `${at}.importedAt`, 'must be an ISO timestamp');
    validateImport(source.payload, errors, `${at}.payload`);
    if (source.payload?.metadata?.identifier_namespace !== source.namespace) issue(errors, at, 'source namespace mismatch');
    sources.set(source.namespace, source);
  }
  const ids = new Map();
  const sourceKeys = new Set();
  const entryFields = ['id', 'name', 'favorite', 'memo', 'birth', 'referenceDisplay', 'source', 'birthRevisions', 'createdAt', 'updatedAt', 'deletedAt'];
  for (const [index, entry] of state.entries.entries()) {
    const at = `$.entries[${index}]`;
    if (!fields(entry, entryFields, errors, at)) continue;
    if (!nonempty(entry.id) || ids.has(entry.id)) issue(errors, `${at}.id`, 'must be nonempty and unique');
    ids.set(entry.id, entry);
    if (!nonempty(entry.name)) issue(errors, `${at}.name`, 'must be a nonempty string');
    if (typeof entry.favorite !== 'boolean') issue(errors, `${at}.favorite`, 'must be a boolean');
    if (typeof entry.memo !== 'string') issue(errors, `${at}.memo`, 'must be a string');
    if (entry.referenceDisplay !== null && !plain(entry.referenceDisplay)) issue(errors, `${at}.referenceDisplay`, 'must be an object or null');
    validateBirth(entry.birth, errors, `${at}.birth`);
    for (const key of ['createdAt', 'updatedAt']) if (!timestamp(entry[key])) issue(errors, `${at}.${key}`, 'must be an ISO timestamp');
    if (entry.deletedAt !== null && !timestamp(entry.deletedAt)) issue(errors, `${at}.deletedAt`, 'must be an ISO timestamp or null');
    if (!Array.isArray(entry.birthRevisions)) issue(errors, `${at}.birthRevisions`, 'must be an array');
    else {
      let previous = 0;
      for (const [revisionIndex, snapshot] of entry.birthRevisions.entries()) {
        const snapshotPath = `${at}.birthRevisions[${revisionIndex}]`;
        if (!fields(snapshot, ['birth', 'recordedAt'], errors, snapshotPath)) continue;
        validateBirth(snapshot.birth, errors, `${snapshotPath}.birth`);
        if (!timestamp(snapshot.recordedAt)) issue(errors, snapshotPath, 'invalid recordedAt');
        if (snapshot.birth?.version <= previous || snapshot.birth?.version >= entry.birth?.version) issue(errors, snapshotPath, 'birth revision versions must increase and precede the current version');
        previous = snapshot.birth?.version;
      }
    }
    if (entry.source !== null) {
      if (!fields(entry.source, ['namespace', 'entryId', 'section', 'observationId'], errors, `${at}.source`)) continue;
      const source = sources.get(entry.source.namespace);
      const originals = source?.payload?.saved_entries;
      const original = Array.isArray(originals) ? originals.find(item => item?.entry_id === entry.source.entryId) : null;
      if (!original) issue(errors, `${at}.source`, 'unknown original entry');
      else if (original.source_section !== entry.source.section || original.primary_observation_id !== entry.source.observationId) issue(errors, `${at}.source`, 'original section or observation mismatch');
      const key = keyFor(entry.source.namespace, entry.source.entryId);
      if (sourceKeys.has(key)) issue(errors, at, 'duplicate original entry identity');
      sourceKeys.add(key);
    }
  }
  if (state.selfId !== null && (!nonempty(state.selfId) || !ids.has(state.selfId) || ids.get(state.selfId)?.deletedAt !== null)) issue(errors, '$.selfId', 'must refer to an active entry or be null');
  const recentIds = new Set();
  for (const [index, recent] of state.recent.entries()) {
    const at = `$.recent[${index}]`;
    if (!fields(recent, ['entryId', 'openedAt'], errors, at)) continue;
    if (!ids.has(recent.entryId) || ids.get(recent.entryId)?.deletedAt !== null) issue(errors, at, 'must refer to an active entry');
    if (recentIds.has(recent.entryId)) issue(errors, at, 'duplicate recent entry');
    recentIds.add(recent.entryId);
    if (!timestamp(recent.openedAt)) issue(errors, `${at}.openedAt`, 'must be an ISO timestamp');
  }
  if (own(state, 'workspace')) errors.push(...validateWorkspace(state.workspace, new Set(ids.keys())));
  return { valid: errors.length === 0, errors };
}

function assertState(state) {
  const result = validateVault(state);
  if (!result.valid) fail('vault', result.errors);
}

function commit(state, patch) {
  if (state.revision === Number.MAX_SAFE_INTEGER) fail('vault', ['revision limit reached']);
  const next = { ...state, ...patch, revision: state.revision + 1 };
  assertState(next);
  return next;
}

/** Optional workspace extension; old v1 snapshots remain accepted unchanged. */
export function setWorkspace(state, workspace) {
  assertState(state);
  const parsed = readPayload(workspace, 'workspace');
  return same(state.workspace, parsed) ? state : commit(state, { workspace: copy(parsed) });
}

function entryAt(state, id, active = true) {
  const entry = state.entries.find(item => item.id === id);
  if (!entry || (active && entry.deletedAt !== null)) fail('entry', [`${id}: entry does not exist or is deleted`]);
  return entry;
}

function emptyBirth() {
  return {
    birth_record_id: localId('birth'), version: 1, source_observation_id: null,
    date_raw: null, input_year: null, input_month: null, input_day: null,
    calendar_symbol_raw: null, calendar_type: null, lunar_leap_month: null,
    time_raw: null, time_status: 'not_visible', input_hour: null, input_minute: null,
    sex: null, timezone: null, birthplace: null, longitude: null, correction_raw: null,
    correction_settings: null, calculation_status: 'needs_settings_confirmation', settings_status: {},
  };
}

export function upsertEntry(state, draft) {
  assertState(state);
  const parsed = readPayload(draft, 'entry draft');
  if (!plain(parsed)) fail('entry draft', ['$: must be an object']);
  const editable = ['id', 'name', 'favorite', 'memo', 'birth'];
  const old = own(parsed, 'id') ? entryAt(state, parsed.id) : null;
  // Passing a full current entry is supported, but imported metadata cannot be edited.
  for (const key of Object.keys(parsed)) {
    if (!editable.includes(key) && (!old || !own(old, key) || !same(parsed[key], old[key]))) fail('entry draft', [`${key}: not an editable field`]);
  }
  if (own(parsed, 'birth') && !plain(parsed.birth)) fail('entry draft', ['birth: must be an object']);
  const createdAt = now();
  const baseBirth = old ? old.birth : emptyBirth();
  for (const key of ['birth_record_id', 'version']) {
    if (old && own(parsed.birth ?? {}, key) && parsed.birth[key] !== baseBirth[key]) {
      fail('entry draft', [`birth.${key}: is managed by the vault`]);
    }
  }
  let birth = own(parsed, 'birth') ? { ...copy(baseBirth), ...copy(parsed.birth) } : copy(baseBirth);
  for (const key of ['correction_settings', 'settings_status']) {
    if (plain(baseBirth[key]) && plain(parsed.birth?.[key])) {
      birth[key] = { ...copy(baseBirth[key]), ...copy(parsed.birth[key]) };
    }
  }
  // Identity and version are managed here; raw imported values live untouched in sources.
  birth.birth_record_id = baseBirth.birth_record_id;
  birth.version = baseBirth.version;
  const birthChanged = old !== null && !same(birth, old.birth);
  if (birthChanged) birth.version += 1;
  const entry = {
    id: old?.id || localId('entry'),
    name: own(parsed, 'name') ? parsed.name : old?.name,
    favorite: own(parsed, 'favorite') ? parsed.favorite : old?.favorite ?? false,
    memo: own(parsed, 'memo') ? parsed.memo : old?.memo ?? '',
    birth,
    referenceDisplay: old?.referenceDisplay ?? null,
    source: old?.source ?? null,
    birthRevisions: birthChanged
      ? [...old.birthRevisions, { birth: copy(old.birth), recordedAt: old.updatedAt }]
      : old?.birthRevisions ?? [],
    createdAt: old?.createdAt || createdAt,
    updatedAt: old?.updatedAt || createdAt,
    deletedAt: null,
  };
  if (old && same(entry, old)) return state;
  entry.updatedAt = createdAt;
  return commit(state, { entries: old ? state.entries.map(item => item.id === old.id ? entry : item) : [...state.entries, entry] });
}

export function toggleFavorite(state, id) {
  assertState(state);
  const entry = entryAt(state, id);
  return upsertEntry(state, { id, favorite: !entry.favorite });
}

export function setSelf(state, id) {
  assertState(state);
  if (id !== null) entryAt(state, id);
  return state.selfId === id ? state : commit(state, { selfId: id });
}

export function deleteEntry(state, id) {
  assertState(state);
  const entry = entryAt(state, id, false);
  if (entry.deletedAt !== null) return state;
  const changedAt = now();
  return commit(state, {
    entries: state.entries.map(item => item.id === id ? { ...item, deletedAt: changedAt, updatedAt: changedAt } : item),
    selfId: state.selfId === id ? null : state.selfId,
    recent: state.recent.filter(item => item.entryId !== id),
  });
}

export function restoreEntry(state, id) {
  assertState(state);
  const entry = entryAt(state, id, false);
  if (entry.deletedAt === null) return state;
  return commit(state, { entries: state.entries.map(item => item.id === id ? { ...item, deletedAt: null, updatedAt: now() } : item) });
}

export function recordOpen(state, id) {
  assertState(state);
  entryAt(state, id);
  const recent = [{ entryId: id, openedAt: now() }, ...state.recent.filter(item => item.entryId !== id)];
  return same(recent, state.recent) ? state : commit(state, { recent });
}

function statistics() {
  return { added: 0, updated: 0, skipped: 0, sourcesAdded: 0, conflicts: [] };
}

export function importScreenshotPackage(state, payload) {
  assertState(state);
  const parsed = readPayload(payload, 'screenshot package');
  const errors = [];
  validateImport(parsed, errors);
  if (errors.length) fail('screenshot package', errors);
  const namespace = parsed.metadata.identifier_namespace;
  const stats = statistics();
  const existingSource = state.sources.find(source => source.namespace === namespace);
  if (existingSource && !same(existingSource.payload, parsed)) {
    stats.skipped = parsed.saved_entries.length;
    stats.conflicts.push({ kind: 'source', namespace, reason: 'namespace_payload_mismatch_local_kept' });
    return { state, stats };
  }
  const importedAt = now();
  const sources = existingSource ? state.sources : [...state.sources, { namespace, importedAt, payload: copy(parsed) }];
  stats.sourcesAdded = existingSource ? 0 : 1;
  const entries = [...state.entries];
  const ids = new Set(entries.map(entry => entry.id));
  const originalKeys = new Set(entries.filter(entry => entry.source).map(entry => keyFor(entry.source.namespace, entry.source.entryId)));
  for (const original of parsed.saved_entries) {
    const key = keyFor(namespace, original.entry_id);
    if (originalKeys.has(key)) { stats.skipped += 1; continue; }
    const id = importedId(namespace, original.entry_id);
    if (ids.has(id)) {
      stats.skipped += 1;
      stats.conflicts.push({ kind: 'entry', id, reason: 'id_collision_local_kept' });
      continue;
    }
    entries.push({
      id, name: original.display_name, favorite: original.favorite === true, memo: original.memo ?? '',
      birth: copy(original.birth_record), referenceDisplay: copy(original.reference_display),
      source: { namespace, entryId: original.entry_id, section: original.source_section, observationId: original.primary_observation_id },
      birthRevisions: [], createdAt: importedAt, updatedAt: importedAt, deletedAt: null,
    });
    ids.add(id);
    originalKeys.add(key);
    stats.added += 1;
  }
  // A later re-import must not undo an explicit self selection or its removal.
  let selfId = state.selfId;
  if (!existingSource && state.entries.length === 0 && selfId === null) {
    const self = parsed.saved_entries.find(entry => entry.is_self);
    const candidate = self ? importedId(namespace, self.entry_id) : null;
    if (candidate && entries.some(entry => entry.id === candidate && entry.deletedAt === null)) selfId = candidate;
  }
  if (!stats.added && !stats.sourcesAdded && selfId === state.selfId) return { state, stats };
  return { state: commit(state, { sources, entries, selfId }), stats };
}

/** Apply only mappings explicitly selected by the user; never infer a missing value. */
export function applyImportMappings(state, mappings) {
  assertState(state);
  const parsed = readPayload(mappings, 'import mappings');
  const errors = [];
  if (fields(parsed, ['calendar', 'sex', 'lunarLeap'], errors, '$')) {
    if (fields(parsed.calendar, ['+', '-'], errors, '$.calendar')) {
      if (![null, 'solar'].includes(parsed.calendar['+'])) issue(errors, '$.calendar.+', 'must be solar or null');
      if (![null, 'lunar'].includes(parsed.calendar['-'])) issue(errors, '$.calendar.-', 'must be lunar or null');
    }
    if (fields(parsed.sex, ['teal', 'pink'], errors, '$.sex')) {
      for (const color of ['teal', 'pink']) {
        if (![null, 'male', 'female'].includes(parsed.sex[color])) issue(errors, `$.sex.${color}`, 'must be male, female, or null');
      }
    }
    if (![null, true, false].includes(parsed.lunarLeap)) issue(errors, '$.lunarLeap', 'must be boolean or null');
  }
  if (errors.length) fail('import mappings', errors);
  const changedAt = now();
  let changed = false;
  const entries = state.entries.map(entry => {
    if (entry.source === null || entry.deletedAt !== null) return entry;
    const patch = {};
    const symbol = entry.birth.calendar_symbol_raw;
    if (entry.birth.calendar_type === null && own(parsed.calendar, symbol) && parsed.calendar[symbol] !== null) {
      patch.calendar_type = parsed.calendar[symbol];
    }
    const color = entry.referenceDisplay?.badge_color;
    if (entry.birth.sex === null && own(parsed.sex, color) && parsed.sex[color] !== null) patch.sex = parsed.sex[color];
    const resultingCalendar = patch.calendar_type ?? entry.birth.calendar_type;
    if (resultingCalendar === 'lunar' && entry.birth.lunar_leap_month === null && parsed.lunarLeap !== null) {
      patch.lunar_leap_month = parsed.lunarLeap;
    }
    if (!Object.keys(patch).length) return entry;
    changed = true;
    const settingsStatus = { ...(entry.birth.settings_status ?? {}) };
    for (const field of Object.keys(patch)) settingsStatus[field] = 'user_confirmed_mapping';
    return {
      ...entry,
      birth: { ...copy(entry.birth), ...patch, settings_status: settingsStatus, version: entry.birth.version + 1 },
      birthRevisions: [...entry.birthRevisions, { birth: copy(entry.birth), recordedAt: entry.updatedAt }],
      updatedAt: changedAt,
    };
  });
  return changed ? commit(state, { entries }) : state;
}

export function createBackup(state) {
  assertState(state);
  return { format: BACKUP_FORMAT, version: VERSION, exportedAt: now(), state: copy(state) };
}

export function restoreBackup(state, payload) {
  assertState(state);
  const backup = readPayload(payload, 'backup');
  const errors = [];
  if (fields(backup, ['format', 'version', 'exportedAt', 'state'], errors, '$')) {
    if (backup.format !== BACKUP_FORMAT || backup.version !== VERSION) issue(errors, '$', 'unsupported backup format or version');
    if (!timestamp(backup.exportedAt)) issue(errors, '$.exportedAt', 'must be an ISO timestamp');
    const checked = validateVault(backup.state);
    errors.push(...checked.errors.map(message => `$.state${message.slice(1)}`));
  }
  if (errors.length) fail('backup', errors);
  const incoming = backup.state;
  const stats = statistics();
  const sources = [...state.sources];
  const sourceByNamespace = new Map(sources.map(source => [source.namespace, source]));
  const blockedNamespaces = new Set();
  for (const source of incoming.sources) {
    const old = sourceByNamespace.get(source.namespace);
    if (!old) {
      const added = copy(source);
      sources.push(added);
      sourceByNamespace.set(source.namespace, added);
      stats.sourcesAdded += 1;
    } else if (!same(old.payload, source.payload)) {
      blockedNamespaces.add(source.namespace);
      stats.conflicts.push({ kind: 'source', namespace: source.namespace, reason: 'namespace_payload_mismatch_local_kept' });
    }
  }
  const entries = [...state.entries];
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const originalKeys = new Set(entries.filter(entry => entry.source).map(entry => keyFor(entry.source.namespace, entry.source.entryId)));
  const acceptedIds = new Set();
  for (const entry of incoming.entries) {
    const old = byId.get(entry.id);
    if (entry.source && blockedNamespaces.has(entry.source.namespace)) {
      stats.skipped += 1;
      continue;
    }
    if (old) {
      stats.skipped += 1;
      if (same(old, entry)) acceptedIds.add(entry.id);
      else stats.conflicts.push({ kind: 'entry', id: entry.id, reason: 'entry_content_differs_local_kept' });
      continue;
    }
    const sourceKey = entry.source && keyFor(entry.source.namespace, entry.source.entryId);
    if (sourceKey && originalKeys.has(sourceKey)) {
      stats.skipped += 1;
      stats.conflicts.push({ kind: 'entry', id: entry.id, reason: 'original_entry_already_exists_local_kept' });
      continue;
    }
    const added = copy(entry);
    entries.push(added);
    byId.set(added.id, added);
    if (sourceKey) originalKeys.add(sourceKey);
    acceptedIds.add(added.id);
    stats.added += 1;
  }
  const pristine = state.revision === 0 && state.entries.length === 0 && state.sources.length === 0;
  let selfId = state.selfId;
  if (pristine && incoming.selfId !== null && byId.get(incoming.selfId)?.deletedAt === null) selfId = incoming.selfId;
  else if (incoming.selfId !== null && incoming.selfId !== selfId) {
    stats.conflicts.push({ kind: 'self', id: incoming.selfId, reason: 'local_self_selection_kept' });
  }
  const recent = [...state.recent];
  const recentIds = new Set(recent.map(item => item.entryId));
  for (const item of incoming.recent) {
    if (acceptedIds.has(item.entryId) && !recentIds.has(item.entryId) && byId.get(item.entryId)?.deletedAt === null) {
      recent.push(copy(item));
      recentIds.add(item.entryId);
    }
  }
  if (recent.length > state.recent.length && !pristine) {
    recent.sort((left, right) => Date.parse(right.openedAt) - Date.parse(left.openedAt));
  }
  const workspace = mergeWorkspaces(state, incoming, new Set(entries.map(e => e.id)), stats.conflicts);
  const workspaceChanged = !same(workspace, state.workspace);
  if (!stats.added && !stats.sourcesAdded && selfId === state.selfId && same(recent, state.recent) && !workspaceChanged) return { state, stats };
  return { state: commit(state, { entries, sources, selfId, recent, ...(workspace ? {workspace} : {}) }), stats };
}
