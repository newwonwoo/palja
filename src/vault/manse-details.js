/** Optional presentation settings recovered from original view-option models.
 * Separate from the legacy row visibility switches so old backups retain meaning.
 */
export const DEFAULT_MANSE_DETAILS = Object.freeze({
  dayStemGods:true, columnStemGods:false, dayGrowth:true, columnGrowth:false,
  hiddenStemGods:false, yearShinsal:false, dayShinsal:false, nayin:false,
});
const all=value=>Object.freeze(Object.fromEntries(Object.keys(DEFAULT_MANSE_DETAILS).map(k=>[k,value])));
export const MANSE_DETAIL_PRESETS=Object.freeze({
  basic:DEFAULT_MANSE_DETAILS,
  japyeong:Object.freeze({...DEFAULT_MANSE_DETAILS,columnStemGods:true,columnGrowth:true}),
  sammyeong:Object.freeze({...all(false),yearShinsal:true,dayShinsal:true,nayin:true}),
  all:all(true), none:all(false),
});
export const MANSE_DETAIL_PRESET_LABELS=Object.freeze({basic:'기본',japyeong:'자평법',sammyeong:'삼명법',all:'전체 켬',none:'전체 끔'});
export function manseDetailsErrors(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || ![Object.prototype,null].includes(Object.getPrototypeOf(value))) return ['invalid manse details'];
  const keys=Object.keys(DEFAULT_MANSE_DETAILS);
  // Early backups contain only the first two options. Newly understood options
  // are optional and read with original defaults; malformed explicit values fail.
  if(['hiddenStemGods','nayin'].some(k=>!Object.hasOwn(value,k)) || Object.keys(value).some(k=>!keys.includes(k))) return ['invalid manse detail keys'];
  return Object.keys(value).filter(k=>typeof value[k]!=='boolean').map(k=>'invalid '+k);
}
