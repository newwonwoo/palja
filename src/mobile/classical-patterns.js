/** Source-bounded pattern candidates, 10 declared structures, not a prediction or complete exterior-pattern system.
 * 三命通會 卷六, 曲直/炎上/從革/潤下/稼穡 chapters.
 * Each candidate discloses the specific structural conditions and remaining interpretations.
 */
import {validPillar} from './reader-model.js';
const SOURCE='https://zh.wikisource.org/wiki/三命通會/卷六';
const CLASH={子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
export const EXTERIOR_RULEBOOK=Object.freeze({version:'palja-exterior-v2',names:['곡직격 후보','염상격 후보','종혁격 후보','윤하격 후보','가색격 후보','일귀 구조','일덕 구조','괴강 중첩 구조','녹원호환 구조','자오쌍포 구조'],priority:'월지 본기/투간으로 정한 내격을 먼저 표시. 응용격과 외잡격 후보는 병기하며 내격을 덮어쓰지 않음. 제외 조건을 통과한 후보만 표시. 복수 후보는 이 목록 순서. 구조 일치는 성격·사건·성패 판단이 아님.',source:SOURCE});
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
 const dayPair=day+pillars[1].branch,hourPair=pillars[0].stem+pillars[0].branch;
 if(['丁酉','丁亥','癸巳','癸卯'].includes(dayPair))add('일귀 구조','권6 日貴의 4일주 중 '+dayPair,'일주 구조만 분류. 주야·형충파해·다른 격 성립 여부로 일귀격 확정하지 않음');
 if(['甲寅','丙辰','戊辰','庚辰','壬戌'].includes(dayPair))add('일덕 구조','권6 日德의 5일주 중 '+dayPair,'중첩·재관·형충파해와 운행에 따른 성패를 확정하지 않음');
 const goegang=['庚辰','壬辰','戊戌','庚戌'];
 if(goegang.includes(dayPair)&&pillars.filter(p=>goegang.includes(p.stem+p.branch)).length>=2)add('괴강 중첩 구조','권6 魁罡의 4일주에 해당하는 일주 및 다른 기둥 1개 이상','기존 신살의 6일주 변형과 구분. 재관·왕쇠 조건으로 성패 확정하지 않음');
 const exchange={戊申:'乙卯',丁酉:'壬寅',丙子:'癸巳',庚子:'丁亥'};
 if(exchange[dayPair]===hourPair)add('녹원호환 구조',`권6 祿元互換의 명시한 일시쌍 ${dayPair}·${hourPair}`,'사주 내 재관·상관·형충파해와 운행 해석은 별도');
 const chronological=[...branches].reverse();
 if((branches.filter(b=>b==='子').length===2&&branches.filter(b=>b==='午').length===2)||chronological.some((b,i)=>chronological.some((mid,j)=>j>i&&chronological.some((last,k)=>k>j&&b===last&&((b==='子'&&mid==='午')||(b==='午'&&mid==='子'))))))add('자오쌍포 구조','子午 각 2개 또는 년→월→일→시 순서에서 子午子/午子午 포위','子午 충은 관계표에 함께 표시. 이를 자동 길격이나 충 해소로 해석하지 않음');
 return out;
}
