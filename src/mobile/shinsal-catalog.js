/** Finite declared rule catalogue. Variants are not silently mixed. */
import {HS,EB} from './engine.js';
export const STEM_STARS=Object.freeze([
 {name:'문창귀인',type:'good',targets:['巳','午','申','酉','申','酉','亥','子','寅','卯']},
 {name:'금여',type:'good',targets:['辰','巳','未','申','未','申','戌','亥','丑','寅']},
 {name:'국인귀인',type:'good',targets:['戌','亥','丑','寅','丑','寅','辰','巳','未','申']},
 {name:'태극귀인',type:'good',targets:['子午','子午','卯酉','卯酉','辰戌丑未','辰戌丑未','寅亥','寅亥','巳申','巳申']},
 {name:'홍염(삼명통회)',type:'caution',targets:['午','午','寅','未','子','辰','戌','酉','巳','申']},
 {name:'유하',type:'caution',targets:['酉','戌','未','申','巳','午','辰','卯','亥','寅']},
]);
const CHEONDEOK={寅:'丁',卯:'申',辰:'壬',巳:'辛',午:'亥',未:'甲',申:'癸',酉:'寅',戌:'丙',亥:'乙',子:'巳',丑:'庚'};
const GHOST=['子酉','丑午','寅未','卯申','辰亥','巳戌'];
const SEASONS=[{group:'寅卯辰',lonely:'巳',widow:'丑'},{group:'巳午未',lonely:'申',widow:'辰'},{group:'申酉戌',lonely:'亥',widow:'未'},{group:'亥子丑',lonely:'寅',widow:'戌'}];
export const SHINSAL_RULEBOOK={version:'palja-shinsal-v1',basis:'천간 순서 甲乙丙丁戊己庚辛壬癸의 지지 대응표, 월지 천덕/월덕, 연지 계절 고신/과숙, 지지쌍 귀문. 신살은 전통 명칭 분류이며 성격·사건·건강을 예측하지 않음.'};
export function extraShinsal(pillar,{dayStem,yearStem,yearBranch,monthBranch,basis='both',natalBranches=[]}){
 if(!pillar||pillar.unknown||!HS.includes(pillar.stem)||!EB.includes(pillar.branch))return [];
 const out=[],add=(name,type,base,reason)=>out.push({name,type,basis:base,reason});
 for(const [s,b] of [[dayStem,'日'],[yearStem,'年']]){
  if((b==='日'&&basis==='year')||(b==='年'&&basis==='day')||!HS.includes(s))continue;
  for(const r of STEM_STARS)if(r.targets[HS.indexOf(s)].includes(pillar.branch))add(r.name,r.type,b,`${s} 기준 지지 ${r.targets[HS.indexOf(s)]} 중 ${pillar.branch}`);
 }
 if(EB.includes(monthBranch)){
  const target=CHEONDEOK[monthBranch];if(pillar.stem===target||pillar.branch===target)add('천덕귀인','good','月',`월지 ${monthBranch} → ${target}`);
  const god='寅午戌'.includes(monthBranch)?'丙':'申子辰'.includes(monthBranch)?'壬':'亥卯未'.includes(monthBranch)?'甲':'庚';
  if(pillar.stem===god)add('월덕귀인','good','月',`월지 ${monthBranch} 삼합 → ${god}`);
  const doctor=EB[(EB.indexOf(monthBranch)+11)%12];if(pillar.branch===doctor)add('천의','good','月',`월지 ${monthBranch}의 직전 지지 ${doctor}`);
 }
 if(EB.includes(yearBranch)){
  const season=SEASONS.find(s=>s.group.includes(yearBranch));
  if(pillar.branch===season.lonely)add('고신','caution','年',`${season.group}년 → ${season.lonely}`);
  if(pillar.branch===season.widow)add('과숙','caution','年',`${season.group}년 → ${season.widow}`);
  const red=EB[(3-EB.indexOf(yearBranch)+12)%12],joy=EB[(EB.indexOf(red)+6)%12];
  if(pillar.branch===red)add('홍란','good','年',`${yearBranch}년 → ${red}`);
  if(pillar.branch===joy)add('천희','good','年',`${yearBranch}년 → ${joy}`);
 }
 if(natalBranches.some(b=>GHOST.some(pair=>pair===b+pillar.branch||pair===pillar.branch+b)))add('귀문관살','caution','柱','원국 지지와 귀문 6쌍 조합 일치');
 return out;
}
