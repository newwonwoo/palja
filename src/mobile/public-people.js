import {upsertEntry} from '../vault/model.js';
import {DEFAULT_POLICY} from '../calendar/policy.js';
/** Verified public biographical dates. Birth hours are deliberately absent. */
export const PUBLIC_PEOPLE=Object.freeze([
 {id:'turing',name:'앨런 튜링',category:'컴퓨터 과학',date:'1912-06-23',place:'영국 런던',zone:'Europe/London',longitude:-.128,url:'https://www.kings.cam.ac.uk/alan-mathison-turing-1912-54',publisher:'King’s College Cambridge'},
 {id:'hopper',name:'그레이스 호퍼',category:'컴퓨터 과학',date:'1906-12-09',place:'미국 뉴욕',zone:'America/New_York',longitude:-74.006,url:'https://www.history.navy.mil/content/history/nhhc/browse-by-topic/people/namesakes/grace-hopper.html',publisher:'미 해군 역사유산사령부'},
 {id:'johnson',name:'캐서린 존슨',category:'수학·우주',date:'1918-08-26',place:'미국 웨스트버지니아 화이트설퍼스프링스',zone:'America/New_York',longitude:-80.303,url:'https://science.nasa.gov/people/katherine-johnson/',publisher:'NASA'},
]);
export function addPublicPerson(state,id){
 const person=PUBLIC_PEOPLE.find(p=>p.id===id);if(!person)throw new Error('공개 인물 자료를 찾을 수 없습니다.');
 const existing=state.entries.find(e=>e.birth.public_profile?.id===id);
 if(existing){if(existing.deletedAt)throw new Error('이미 가져온 공개 인물이 휴지통에 있습니다. 설정에서 복원하세요.');return state;}
 const [year,month,day]=person.date.split('-').map(Number);
 return upsertEntry(state,{name:person.name,memo:`공개 인물 · ${person.category}\n출생일·출생지 근거: ${person.publisher}\n${person.url}\n확인일: 2026-10-20. 출생시각·성별은 자동 추정하지 않음.`,birth:{input_year:year,input_month:month,input_day:day,calendar_type:'solar',lunar_leap_month:false,time_status:'unknown',input_hour:null,input_minute:null,sex:null,date_raw:person.date.replaceAll('-','/'),calculation_policy:{...DEFAULT_POLICY,zone:person.zone,longitude:person.longitude},public_profile:{id,url:person.url,publisher:person.publisher,place:person.place,category:person.category,checkedAt:'2026-10-20'}}});
}
