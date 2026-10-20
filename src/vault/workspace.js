import {validateIntegrated,mergeIntegrated} from './integrated-schema.js';
import {DEFAULT_APPEARANCE, appearanceErrors} from './appearance.js';
import {AGE_NOTATIONS, DEFAULT_AGE_NOTATION} from './age-notation.js';
import {DEFAULT_MANSE_DETAILS, manseDetailsErrors} from './manse-details.js';
import {DEFAULT_READING_ORDER,validReadingOrder} from './reading-order.js';
/** Optional v1 namespace for groups and display preferences. No birth data is modified. */
export const DEFAULT_PREFERENCES = Object.freeze({
  sort: 'name', compact: false, hanja: true, large: false, includeLuck: true,
  appearance: DEFAULT_APPEARANCE,
  ageNotation: DEFAULT_AGE_NOTATION,
  manseDetails: DEFAULT_MANSE_DETAILS,
  readingOrder: DEFAULT_READING_ORDER,
});
export const SORT_KEYS = ['name', 'newest', 'age-asc', 'age-desc', 'day'];
const keys = ['sort', 'compact', 'hanja', 'large', 'includeLuck'];
const plain = x => x !== null && typeof x === 'object' && !Array.isArray(x)
  && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
const iso = x => typeof x === 'string' && Number.isFinite(Date.parse(x)) && new Date(x).toISOString() === x;
export const normalizedGroupName = name => typeof name === 'string' ? name.normalize('NFKC').trim().toLocaleLowerCase('ko') : '';
export const readPreferences = state => ({ ...DEFAULT_PREFERENCES, ...state.workspace?.preferences,
  readingOrder:[...(state.workspace?.preferences?.readingOrder||DEFAULT_READING_ORDER)],
  manseDetails: {...DEFAULT_MANSE_DETAILS, ...state.workspace?.preferences?.manseDetails},
  appearance: {...DEFAULT_APPEARANCE, ...state.workspace?.preferences?.appearance} });
export const activeGroups = state => (state.workspace?.groups || []).filter(group => !group.deletedAt);
export function emptyWorkspace() {
  return { version: 1, groups: [], preferences: { ...DEFAULT_PREFERENCES } };
}

export function validateWorkspace(workspace, entryIds) {
  const errors = [];
  const add = m => errors.push('$.workspace: ' + m);
  if (!plain(workspace)) return ['$.workspace: must be an object'];
  if (Object.keys(workspace).some(k => !['version', 'groups', 'preferences', 'integrated'].includes(k)) || workspace.version !== 1) add('unsupported field or version');
  if (!plain(workspace.preferences)) add('invalid preferences');
  else {
    if (keys.some(k => !Object.hasOwn(workspace.preferences, k)) || Object.keys(workspace.preferences).some(k => ![...keys, 'appearance', 'ageNotation', 'manseDetails', 'readingOrder'].includes(k))) add('invalid preference keys');
    if (!SORT_KEYS.includes(workspace.preferences.sort)) add('invalid sort');
    for (const k of keys.slice(1)) if (typeof workspace.preferences[k] !== 'boolean') add('invalid ' + k);
    if (Object.hasOwn(workspace.preferences, 'appearance')) for (const error of appearanceErrors(workspace.preferences.appearance)) add(error);
    if (Object.hasOwn(workspace.preferences, 'manseDetails')) for (const error of manseDetailsErrors(workspace.preferences.manseDetails)) add(error);
    if (Object.hasOwn(workspace.preferences, 'readingOrder')&&!validReadingOrder(workspace.preferences.readingOrder))add('invalid reading order');
    if (Object.hasOwn(workspace.preferences, 'ageNotation') && (typeof workspace.preferences.ageNotation !== 'string' || !Object.hasOwn(AGE_NOTATIONS, workspace.preferences.ageNotation))) add('invalid age notation');
  }
  if (!Array.isArray(workspace.groups) || workspace.groups.length > 500) add('groups must be an array of at most 500');
  else {
    const ids = new Set(), names = new Set();
    for (const group of workspace.groups) {
      if (!plain(group)) { add('invalid group'); continue; }
      const required = ['id', 'name', 'entryIds', 'createdAt', 'updatedAt', 'deletedAt'];
      if (required.some(k => !Object.hasOwn(group, k)) || Object.keys(group).some(k => !required.includes(k))) add('invalid group fields');
      if (typeof group.id !== 'string' || !group.id || group.id.length > 200 || ids.has(group.id)) add('invalid or duplicate group id');
      ids.add(group.id);
      const name = normalizedGroupName(group.name);
      if (!name || group.name.length > 80 || group.name !== group.name.trim()) add('invalid group name');
      if (group.deletedAt === null && names.has(name)) add('duplicate active group name');
      if (group.deletedAt === null) names.add(name);
      if (!iso(group.createdAt) || !iso(group.updatedAt) || (group.deletedAt !== null && !iso(group.deletedAt))) add('invalid group timestamp');
      if (!Array.isArray(group.entryIds) || new Set(group.entryIds).size !== group.entryIds.length
        || group.entryIds.some(id => !entryIds.has(id))) add('invalid group members');
    }
  }
  if(workspace.integrated!==undefined)errors.push(...validateIntegrated(workspace.integrated,entryIds));
  return errors;
}

/** Local groups, memberships and tombstones win. Old backups cannot erase new settings. */
export function mergeWorkspaces(local, incoming, allowedEntryIds, conflicts) {
  if (!incoming.workspace) return local.workspace;
  const source = incoming.workspace;
  if (!local.workspace) return { ...JSON.parse(JSON.stringify(source)), version: 1, preferences: { ...source.preferences }, groups: source.groups.map(g => ({ ...g, entryIds: g.entryIds.filter(id => allowedEntryIds.has(id)) })) };
  const groups = [...local.workspace.groups];
  for (const item of source.groups) {
    const old = groups.find(g => g.id === item.id);
    if (old) {
      if (JSON.stringify(old) !== JSON.stringify(item)) conflicts.push({kind:'group',id:item.id,reason:'local_group_kept'});
      continue;
    }
    if (!item.deletedAt && groups.some(g => !g.deletedAt && normalizedGroupName(g.name) === normalizedGroupName(item.name))) {
      conflicts.push({kind:'group',id:item.id,reason:'group_name_conflict_local_kept'});
      continue;
    }
    groups.push({...item,entryIds:item.entryIds.filter(id => allowedEntryIds.has(id))});
  }
  if (JSON.stringify(local.workspace.preferences) !== JSON.stringify(source.preferences)) conflicts.push({kind:'preferences',reason:'local_preferences_kept'});
  const extra=mergeIntegrated(local.workspace.integrated,source.integrated,allowedEntryIds,conflicts);
  return {version:1,groups,preferences:{...local.workspace.preferences},...(extra?{integrated:extra}:{})};
}
