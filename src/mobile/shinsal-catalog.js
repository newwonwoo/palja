/** Finite declared rule catalogue. Variants are not silently mixed. */
import {HS,EB} from './engine.js';
export const STEM_STARS=Object.freeze([
 {name:'건록',type:'good',targets:['寅','卯','巳','午','巳','午','申','酉','亥','子']},
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
export const SHINSAL_CATALOG=Object.freeze({version:'palja-shinsal-v2',names:['겁살','재살','천살','지살','년살','월살','망신','장성','반안','역마','육해','화개','천을귀인','양인','백호','괴강','원진',...STEM_STARS.map(r=>r.name),'천덕귀인','월덕귀인','천의','고신','과숙','홍란','천희','귀문관살','천덕합','월덕합','공망','천라(지지쌍)','지망(지지쌍)','십악대패(일주)'],source:'https://zh.wikisource.org/wiki/三命通會/卷三',convention:'38종 지원. 원진·괴강은 보존한 기존 변형, 홍염은 삼명통회 변형. 천라·지망은 지지쌍 구조만 표시하며 성별·납음 길흉을 판정하지 않음. 일/년 선택은 천간 및 공망 기준에 적용, 월지·연지·원국쌍 규칙은 이름에 표시한 고정 기준. 제외 선택은 전체 신살을 숨김.'});
export const SHINSAL_RULEBOOK=SHINSAL_CATALOG;
const STEM_COMBINE={甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊'};
const BRANCH_COMBINE={子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};
export function voidBranches(pillar){
 const s=HS.indexOf(pillar?.stem),b=EB.indexOf(pillar?.branch);
 if(pillar?.unknown||s<0||b<0||s%2!==b%2)return [];
 const start=(b-s+12)%12;return [EB[(start+10)%12],EB[(start+11)%12]];
}
export function extraShinsal(pillar,{dayStem,yearStem,yearBranch,monthBranch,dayPillar,yearPillar,isNatalDay=false,basis='both',natalBranches=[]}){
 if(basis==='none'||!pillar||pillar.unknown||!HS.includes(pillar.stem)||!EB.includes(pillar.branch))return [];
 const out=[],add=(name,type,base,reason)=>out.push({name,type,basis:base,reason,source:SHINSAL_CATALOG.source});
 for(const [s,b] of [[dayStem,'日'],[yearStem,'年']]){
  if((b==='日'&&basis==='year')||(b==='年'&&basis==='day')||!HS.includes(s))continue;
  for(const r of STEM_STARS)if(r.targets[HS.indexOf(s)].includes(pillar.branch))add(r.name,r.type,b,`${s} 기준 지지 ${r.targets[HS.indexOf(s)]} 중 ${pillar.branch}`);
  const empty=voidBranches(b==='日'?dayPillar:yearPillar);if(empty.includes(pillar.branch))add('공망','caution',b,`순중 공망 ${empty.join('·')} 중 ${pillar.branch}. 음양별 경중 변형은 적용하지 않음`);
 }
 if(EB.includes(monthBranch)){
  const target=CHEONDEOK[monthBranch];if(pillar.stem===target||pillar.branch===target)add('천덕귀인','good','月',`월지 ${monthBranch} → ${target}`);
  const joined=STEM_COMBINE[target]||BRANCH_COMBINE[target];if(pillar.stem===joined||pillar.branch===joined)add('천덕합','good','月',`월지 ${monthBranch} 천덕 ${target}의 합 ${joined}`);
  const god='寅午戌'.includes(monthBranch)?'丙':'申子辰'.includes(monthBranch)?'壬':'亥卯未'.includes(monthBranch)?'甲':'庚';
  if(pillar.stem===god)add('월덕귀인','good','月',`월지 ${monthBranch} 삼합 → ${god}`);
  if(pillar.stem===STEM_COMBINE[god])add('월덕합','good','月',`월지 ${monthBranch} 월덕 ${god}의 합 ${STEM_COMBINE[god]}`);
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
 for(const [pair,name] of [['戌亥','천라(지지쌍)'],['辰巳','지망(지지쌍)']])if(pair.includes(pillar.branch)&&natalBranches.includes([...pair].find(b=>b!==pillar.branch)))add(name,'caution','柱',`${pair} 원국 지지쌍. 성별·납음별 사건 해석 없음`);
 if(isNatalDay&&['甲辰','乙巳','丙申','丁亥','戊戌','己丑','庚辰','辛巳','壬申','癸亥'].includes(pillar.stem+pillar.branch))add('십악대패(일주)','caution','日柱','일간 건록이 일주 순중 공망에 드는 10일주. 연주 대조 변형은 미적용');
 return out;
}
