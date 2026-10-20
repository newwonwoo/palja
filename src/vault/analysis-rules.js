export const DEFAULT_RULES=Object.freeze({version:1,combinationMode:'off',combinationWeight:1,patternMode:'month-main',sinsalBasis:'both',luckyMethod:'억부',matchWeights:Object.freeze({same:1,combine:1,clash:1,other:1})});
export const readRules=state=>({...DEFAULT_RULES,...state.workspace?.integrated?.rules});
export function ruleErrors(r){
 if(!r||typeof r!=='object'||Array.isArray(r))return ['분석 규칙 형식 오류'];
 const errors=[];
 if(r.version!==1||Object.keys(r).some(k=>!Object.hasOwn(DEFAULT_RULES,k)))errors.push('분석 규칙 버전 오류');
 if(r.luckyMethod!==undefined&&!['억부','조후','통관','병약','용격'].includes(r.luckyMethod))errors.push('행운 선택 기준 오류');
 for(const [k,v] of Object.entries({combinationMode:['off','seasonal'],patternMode:['month-main','revealed'],sinsalBasis:['day','year','both','none']}))if(!v.includes(r[k]))errors.push(k+' 규칙 오류');
 if(!Number.isFinite(r.combinationWeight)||r.combinationWeight<0||r.combinationWeight>1)errors.push('합화 비중은 0~1');
 if(!r.matchWeights||Object.keys(r.matchWeights).length!==4||['same','combine','clash','other'].some(k=>!Number.isFinite(r.matchWeights[k])||r.matchWeights[k]<0||r.matchWeights[k]>10))errors.push('궁합 비중은 0~10');
 return errors;
}
