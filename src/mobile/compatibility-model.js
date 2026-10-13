/** Compare two calculated or manually-entered charts using explicit symbols only.
 * No inferred sex, unverified birth hour, fortune score, or predictive ranking.
 */
import { branchPairTypes } from './traditional-reference.js';
import { validPillar } from './reader-model.js';
const STEM_HAP={甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊'};
const STEM_CHUNG={甲:'庚',庚:'甲',乙:'辛',辛:'乙',丙:'壬',壬:'丙',丁:'癸',癸:'丁'};
const BRANCH_HAP={子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};
const BRANCH_CHUNG={子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
const pair=(name,a,b,type)=>({name,a,b,type,description:`${a}·${b}의 ${name} 조합이 조견표와 일치합니다. 성립 강도와 길흉은 별도로 판정하지 않습니다.`});
export function compareChartFacts(a,b){
  const left=a?.saju?.pillars,right=b?.saju?.pillars;
  if(!Array.isArray(left)||!Array.isArray(right)||!validPillar(left[1])||!validPillar(right[1]))return {status:'unavailable',reason:'두 명식의 일주가 계산·확인되어야 비교할 수 있습니다.'};
  const l=left[1],r=right[1],facts=[];
  if(l.stem===r.stem)facts.push(pair('일간 동일',l.stem,r.stem,'identity'));
  if(STEM_HAP[l.stem]===r.stem)facts.push(pair('일간 합',l.stem,r.stem,'combine'));
  if(STEM_CHUNG[l.stem]===r.stem)facts.push(pair('일간 충',l.stem,r.stem,'clash'));
  if(l.branch===r.branch)facts.push(pair('일지 동일',l.branch,r.branch,'identity'));
  if(BRANCH_HAP[l.branch]===r.branch)facts.push(pair('일지 육합',l.branch,r.branch,'combine'));
  if(BRANCH_CHUNG[l.branch]===r.branch)facts.push(pair('일지 충',l.branch,r.branch,'clash'));
  for(const type of branchPairTypes(l.branch,r.branch))facts.push(pair('일지 '+type,l.branch,r.branch,type));
  if(validPillar(left[2])&&validPillar(right[2])){
    if(left[2].branch===right[2].branch)facts.push(pair('월지 동일',left[2].branch,right[2].branch,'identity'));
    if(BRANCH_HAP[left[2].branch]===right[2].branch)facts.push(pair('월지 육합',left[2].branch,right[2].branch,'combine'));
    if(BRANCH_CHUNG[left[2].branch]===right[2].branch)facts.push(pair('월지 충',left[2].branch,right[2].branch,'clash'));
  }
  const comparable=[0,1,2,3].filter(i=>validPillar(left[i])&&validPillar(right[i]));
  const identical=comparable.filter(i=>left[i].stem===right[i].stem&&left[i].branch===right[i].branch);
  return {status:'ready',facts,comparablePillars:comparable.length,samePillars:identical.length,
    dayPillars:[l.stem+l.branch,r.stem+r.branch],
    note:'동일 기둥 개수는 형태 비교용이며 궁합 점수·좋고 나쁨·사건 확률을 뜻하지 않습니다.'};
}
/** Offline structural similarity: explicitly ranked by matching known glyphs, not fortune. */
export function similarChartFacts(source,entries,calculate,limit=10){
  if(!source||!validPillar(source.saju?.pillars?.[1]))return [];
  const s=source.saju.pillars;
  return entries.map(entry=>{
    const r=calculate(entry),p=r?.saju?.pillars;
    if(!validPillar(p?.[1]))return null;
    const daySame=p[1].stem===s[1].stem&&p[1].branch===s[1].branch;
    const stemSame=p[1].stem===s[1].stem,branchSame=p[1].branch===s[1].branch;
    const monthSame=validPillar(p[2])&&validPillar(s[2])&&p[2].branch===s[2].branch;
    const completePairs=[0,1,2,3].filter(i=>validPillar(p[i])&&validPillar(s[i]));
    const equalPillars=completePairs.filter(i=>p[i].stem===s[i].stem&&p[i].branch===s[i].branch).length;
    return {entryId:entry.id,name:entry.name,daySame,stemSame,branchSame,monthSame,equalPillars,compared:completePairs.length,sortScore:Number(daySame)*16+Number(stemSame)*8+Number(branchSame)*4+Number(monthSame)*2+equalPillars};
  }).filter(Boolean).sort((a,b)=>b.sortScore-a.sortScore||a.name.localeCompare(b.name,'ko')||a.entryId.localeCompare(b.entryId)).slice(0,Math.max(0,Math.min(50,limit)));
}
