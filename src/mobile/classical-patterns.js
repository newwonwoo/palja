/** Source-bounded pattern candidates, not a prediction or complete exterior-pattern system.
 * 三命通會 卷六, 曲直/炎上/從革/潤下/稼穡 chapters.
 * Each candidate discloses the specific structural conditions and remaining interpretations.
 */
import {validPillar} from './reader-model.js';
const SOURCE='https://zh.wikisource.org/wiki/三命通會/卷六';
const CLASH={子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
export function classicalExteriorCandidates(pillars){
 if(!Array.isArray(pillars)||pillars.length!==4||!pillars.every(validPillar))return [];
 const day=pillars[1].stem,month=pillars[2].branch,stems=pillars.map(p=>p.stem),branches=pillars.map(p=>p.branch),out=[];
 const full=group=>[...group].every(b=>branches.includes(b));
 const add=(name,condition,remaining)=>out.push({name,source:SOURCE,reason:condition+' · '+remaining,convention:'삼명통회 권6의 명시한 핵심 조건 후보. 성립의 강도·길흉·운의 성패는 판정하지 않음.'});
 if('甲乙'.includes(day)&&full('亥卯未')&&!stems.some(s=>'庚辛'.includes(s))&&!branches.some(b=>'申酉'.includes(b)))add('곡직격 후보','甲/乙 일간·亥卯未 삼합 완비·겉글자 금 없음','亥의 인성 포함. 寅卯辰 변형과 운행 평가는 별도');
 if('丙丁'.includes(day)&&full('寅午戌')&&!stems.some(s=>'戊己'.includes(s))&&!branches.some(b=>'辰丑'.includes(b)))add('염상격 후보','丙/丁 일간·寅午戌 완비·辰丑 및 戊己 제외','亥 수의 조후 여부와 기타 운행은 별도');
 const fireCount=stems.filter(s=>'丙丁'.includes(s)).length+branches.filter(b=>'巳午'.includes(b)).length;
 if('庚辛'.includes(day)&&full('巳酉丑')&&fireCount>=1&&fireCount<=2&&!(day==='辛'&&month==='午'))add('종혁격 후보',`庚/辛 일간·巳酉丑 완비·겉글자 화 ${fireCount}자리`,'권6의 소량 화를 쓰는 변형. 무화 종혁을 쓰는 다른 학파와 구분');
 const conflict=branches.some(b=>branches.includes(CLASH[b]));
 if('壬癸'.includes(day)&&(full('申子辰')||full('亥子丑'))&&!branches.some(b=>'卯巳'.includes(b))&&!conflict)add('윤하격 후보','壬/癸 일간·申子辰 또는 亥子丑 완비·卯巳/지지충 제외','토의 제방·금의 구제·운행 판단은 별도');
 const woodCount=stems.filter(s=>'甲乙'.includes(s)).length;
 if('戊己'.includes(day)&&'辰戌丑未'.includes(month)&&full('辰戌丑未')&&woodCount===1&&!stems.some(s=>'庚辛'.includes(s)))add('가색격 후보','戊/己 일간·사계 월령·辰戌丑未 완비·목 투간 1개·금 투간 제외','화의 조습·통근 해석과 사계월의 다른 변형은 별도');
 return out;
}
