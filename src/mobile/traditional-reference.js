/** Offline reference tables independent of the original app binary.
 * A table match is a descriptive convention, not an event prediction.
 * Nayin is a 60-jiazi lookup; it must NOT alter primary five-element totals.
 */
const STEMS = [...'甲乙丙丁戊己庚辛壬癸'];
const BRANCHES = [...'子丑寅卯辰巳午未申酉戌亥'];
const NAYIN = [
  ['해중금','海中金'], ['노중화','爐中火'], ['대림목','大林木'], ['노방토','路傍土'], ['검봉금','劍鋒金'],
  ['산두화','山頭火'], ['간하수','澗下水'], ['성두토','城頭土'], ['백랍금','白蠟金'], ['양류목','楊柳木'],
  ['천중수','泉中水'], ['옥상토','屋上土'], ['벽력화','霹靂火'], ['송백목','松柏木'], ['장류수','長流水'],
  ['사중금','沙中金'], ['산하화','山下火'], ['평지목','平地木'], ['벽상토','壁上土'], ['금박금','金箔金'],
  ['복등화','覆燈火'], ['천하수','天河水'], ['대역토','大驛土'], ['채천금','釵釧金'], ['상자목','桑柘木'],
  ['대계수','大溪水'], ['사중토','沙中土'], ['천상화','天上火'], ['석류목','石榴木'], ['대해수','大海水'],
];
const ELEMENT = {'金':'금','木':'목','水':'수','火':'화','土':'토'};
const GAPJA = Array.from({length:60},(_,i)=>STEMS[i%10]+BRANCHES[i%12]);
const GAPJA_INDEX = new Map(GAPJA.map((text,i)=>[text,i]));
export const NAYIN_PAIRS = Object.freeze(NAYIN.map(([name,hanja],i)=>Object.freeze({pair:Object.freeze([GAPJA[i*2],GAPJA[i*2+1]]),name,hanja,element:ELEMENT[hanja.at(-1)]})));
export function nayinOf(pillar) {
  if(!pillar || pillar.unknown || typeof pillar.stem!=='string' || typeof pillar.branch!=='string')return null;
  const idx=GAPJA_INDEX.get(pillar.stem+pillar.branch);
  if(idx===undefined)return null;
  return {...NAYIN_PAIRS[Math.floor(idx/2)],index:idx};
}
/** A decade of JiaZi (旬) omits two branches. The day pillar selects the decade. */
export function gongmangOf(dayPillar) {
  const idx=GAPJA_INDEX.get((dayPillar?.stem||'')+(dayPillar?.branch||''));
  if(idx===undefined)return null;
  const start=Math.floor(idx/10)*10;
  const used=new Set(GAPJA.slice(start,start+10).map(p=>p[1]));
  const missing=BRANCHES.filter(b=>!used.has(b));
  return {decade:GAPJA[start]+'旬',empty:missing,day:GAPJA[idx]};
}
export const BRANCH_PAIRS=Object.freeze({
  // Most common cross-school branch classifications: relationships are independent predicates.
  '파':Object.freeze(['子酉','丑辰','寅亥','卯午','巳申','未戌']),
  '해':Object.freeze(['子未','丑午','寅巳','卯辰','申亥','酉戌']),
  '원진':Object.freeze(['子未','丑午','寅酉','卯申','辰亥','巳戌']),
  '형':Object.freeze(['子卯','寅巳','巳申','申寅','丑戌','戌未','未丑']),
  '자형':Object.freeze(['辰辰','午午','酉酉','亥亥']),
});
function pairMatches(a,b,pattern){const [x,y]=pattern;return a===x&&b===y||a===y&&b===x;}
export function branchPairTypes(a,b){
  if(!BRANCHES.includes(a)||!BRANCHES.includes(b))return [];
  return Object.entries(BRANCH_PAIRS).filter(([type,pairs])=>pairs.some(pattern=>pairMatches(a,b,pattern))).map(([name])=>name);
}
const SAMJAE = Object.freeze([
  {birth:'申子辰',years:'寅卯辰'},
  {birth:'寅午戌',years:'申酉戌'},
  {birth:'巳酉丑',years:'亥子丑'},
  {birth:'亥卯未',years:'巳午未'},
]);
export function samjaeOf(birthYearBranch, annualBranch){
  const group=SAMJAE.find(g=>g.birth.includes(birthYearBranch));
  if(!BRANCHES.includes(birthYearBranch)||!BRANCHES.includes(annualBranch)||!group)return null;
  const idx=group.years.indexOf(annualBranch);
  return {name:idx<0?'해당 없음':['들삼재','눌삼재','날삼재'][idx],active:idx>=0,birthGroup:group.birth,annualBranch,
    basis:'출생 연지의 삼합 그룹과 선택 연도의 지지를 비교하는 3년 주기 조견표'};
}
export const REFERENCE_BASIS='납음: 육십갑자 30쌍 / 공망: 10갑자 1순 결여 지지 / 관계: 전통 지지 형·파·해·원진 조합표';
