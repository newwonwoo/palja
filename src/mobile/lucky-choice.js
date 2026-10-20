/** A deterministic traditional correspondence lookup; no random number generation. */
export const CHOICE_METHODS=Object.freeze(['억부','조후','통관','병약','용격']);
export const CHOICE_SOURCE='https://zh.wikisource.org/wiki/性理羣書句解_(四庫全書本)/卷09';
export const ELEMENT_CHOICES=Object.freeze({
 木:Object.freeze({color:'청록',direction:'동',season:'봄',numbers:Object.freeze([3,8])}),
 火:Object.freeze({color:'적색',direction:'남',season:'여름',numbers:Object.freeze([2,7])}),
 土:Object.freeze({color:'황색',direction:'중앙',season:'환절기',numbers:Object.freeze([5,10])}),
 金:Object.freeze({color:'백색',direction:'서',season:'가을',numbers:Object.freeze([4,9])}),
 水:Object.freeze({color:'흑색',direction:'북',season:'겨울',numbers:Object.freeze([1,6])}),
});
export function luckyChoice(analysis,method='억부'){
 if(!CHOICE_METHODS.includes(method))throw new Error('행운 선택 기준을 확인하세요.');
 const candidate=analysis?.status==='ready'?analysis.methods.find(m=>m.name===method):null;
 if(!candidate||!Object.hasOwn(ELEMENT_CHOICES,candidate.element))return {status:'unavailable',method,reason:`${method} 방법의 후보 오행이 없습니다. 다른 방법을 직접 선택할 수 있습니다.`};
 return {status:'ready',method,element:candidate.element,...ELEMENT_CHOICES[candidate.element],reason:candidate.reason,source:CHOICE_SOURCE,
  basis:'선택 방법의 후보 오행 → 오행의 색/방향/계절 대응 및 하도의 생수·성수 쌍. 숫자는 고정 조견표이며 사건 확률이나 추첨 번호가 아님.'};
}
