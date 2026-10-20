/** Optional presentation settings recovered from original view-option models.
 * Separate from the legacy row visibility switches so old backups retain meaning.
 */
export const DEFAULT_MANSE_DETAILS = Object.freeze({hiddenStemGods:false, nayin:false});
export function manseDetailsErrors(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || ![Object.prototype,null].includes(Object.getPrototypeOf(value))) return ['invalid manse details'];
  const keys=Object.keys(DEFAULT_MANSE_DETAILS);
  if(Object.keys(value).length!==keys.length || Object.keys(value).some(k=>!keys.includes(k))) return ['invalid manse detail keys'];
  return keys.filter(k=>typeof value[k]!=='boolean').map(k=>'invalid '+k);
}
