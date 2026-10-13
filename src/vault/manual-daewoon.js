/** Analyst-entered decade start is evidence supplied by the user, not a recovered birth date. */
export function manualDaeunErrors(value) {
 if(!value||typeof value!=='object'||Array.isArray(value)||value.version!==1||Object.keys(value).some(k=>!['version','direction','startAge','startYear'].includes(k)))return ['직접 입력 대운 설정 형식 오류'];
 const errors=[];
 if(!['forward','backward'].includes(value.direction))errors.push('대운 순행·역행을 선택하세요.');
 if(!Number.isFinite(value.startAge)||value.startAge<0||value.startAge>120)errors.push('대운 시작 나이는 0~120입니다.');
 if(value.startYear!==null&&(!Number.isInteger(value.startYear)||value.startYear<1900||value.startYear>2050))errors.push('시작 연도는 미상 또는 1900~2050년입니다.');
 return errors;
}
export function manualDaeun(month,setting) {
 if(setting==null)return [];
 const errors=manualDaeunErrors(setting);if(errors.length)throw new Error(errors.join(' '));
 const stems=[...'甲乙丙丁戊己庚辛壬癸'],branches=[...'子丑寅卯辰巳午未申酉戌亥'];
 if(!month||!stems.includes(month.stem)||!branches.includes(month.branch))throw new Error('대운 기준 월주를 확인하세요.');
 const d=setting.direction==='forward'?1:-1,mod=(n,m)=>(n%m+m)%m;
 return Array.from({length:10},(_,i)=>{const stemIdx=mod(stems.indexOf(month.stem)+d*(i+1),10),branchIdx=mod(branches.indexOf(month.branch)+d*(i+1),12);
  return {stem:stems[stemIdx],branch:branches[branchIdx],stemIdx,branchIdx,startAge:Number((setting.startAge+i*10).toFixed(2)),startYear:setting.startYear===null?null:setting.startYear+i*10,manualBasis:true,basis:'사용자가 직접 지정한 대운수·방향·시작 연도'};
 });
}
