import { applyImportMappings } from './model.js';

/** An owner-confirmed mapping applies only to its original import namespace.
 * Existing confirmations, edited values, tombstones and raw sources are preserved.
 */
export function applyBundledMappings(state, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)
    || payload.format !== 'saju-vault-confirmed-mappings' || payload.version !== 1
    || typeof payload.namespace !== 'string' || !payload.namespace.trim()
    || Object.keys(payload).some(key => !['format', 'version', 'namespace', 'mappings'].includes(key))) {
    throw new Error('확인된 가져오기 설정의 형식이 올바르지 않습니다.');
  }
  return applyImportMappings(state, payload.mappings, payload.namespace);
}
