const HS=[...'甲乙丙丁戊己庚辛壬癸'],EB=[...'子丑寅卯辰巳午未申酉戌亥'];
const validPillar=p=>p&&!p.unknown&&Number.isInteger(p.stemIdx)&&Number.isInteger(p.branchIdx)&&HS[p.stemIdx]===p.stem&&EB[p.branchIdx]===p.branch;
/** Read-only adapter. No flow score, event prediction or missing pillar is invented. */
export function treeDecade(decades,selected,year){
 const known=(decades||[]).filter(validPillar);
 const timed=known.filter(d=>Number.isFinite(d.startInstant)).sort((a,b)=>a.startInstant-b.startInstant);
 if(timed.length&&Number.isFinite(selected.instant)){
  const i=timed.findLastIndex(d=>d.startInstant<=selected.instant);
  if(i<0)return {pillar:null,precision:'instant',reason:'대운 시작 전'};
  const d=timed[i],limits=[timed[i+1]?.startInstant,d.endInstant].filter(Number.isFinite),end=limits.length?Math.min(...limits):null;
  if(Number.isFinite(end))return selected.instant<end?{pillar:d,precision:'instant'}:{pillar:null,precision:'instant',reason:'확인된 대운 범위 밖'};
  // The final returned decade has no following boundary. Keep its declared
  // ten-year range, visibly marked as year-based rather than extending forever.
  return Number.isInteger(d.startYear)&&year<d.startYear+10?{pillar:d,precision:'year'}:{pillar:null,precision:'year',reason:'확인된 대운 범위 밖'};
 }
 const byYear=known.filter(d=>Number.isInteger(d.startYear)).sort((a,b)=>b.startYear-a.startYear);
 const d=byYear.find(d=>year>=d.startYear&&year<d.startYear+10);
 return {pillar:d||null,precision:'year',reason:d?null:byYear.length&&year<byYear.at(-1).startYear?'대운 시작 전':'대운을 계산할 정보가 없습니다.'};
}

