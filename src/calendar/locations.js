/** City-centre longitudes, not claimed birth-hospital coordinates. IANA zone rules via Intl. */
export const LOCATIONS=Object.freeze([
 {id:'seoul',name:'대한민국 · 서울',zone:'Asia/Seoul',longitude:126.978},
 {id:'busan',name:'대한민국 · 부산',zone:'Asia/Seoul',longitude:129.076},
 {id:'daegu',name:'대한민국 · 대구',zone:'Asia/Seoul',longitude:128.601},
 {id:'incheon',name:'대한민국 · 인천',zone:'Asia/Seoul',longitude:126.705},
 {id:'daejeon',name:'대한민국 · 대전',zone:'Asia/Seoul',longitude:127.385},
 {id:'gwangju',name:'대한민국 · 광주',zone:'Asia/Seoul',longitude:126.852},
 {id:'jeju',name:'대한민국 · 제주',zone:'Asia/Seoul',longitude:126.531},
 {id:'tokyo',name:'일본 · 도쿄',zone:'Asia/Tokyo',longitude:139.692},
 {id:'beijing',name:'중국 · 베이징',zone:'Asia/Shanghai',longitude:116.407},
 {id:'taipei',name:'대만 · 타이베이',zone:'Asia/Taipei',longitude:121.565},
 {id:'hongkong',name:'홍콩',zone:'Asia/Hong_Kong',longitude:114.169},
 {id:'singapore',name:'싱가포르',zone:'Asia/Singapore',longitude:103.82},
 {id:'bangkok',name:'태국 · 방콕',zone:'Asia/Bangkok',longitude:100.502},
 {id:'delhi',name:'인도 · 뉴델리',zone:'Asia/Kolkata',longitude:77.209},
 {id:'london',name:'영국 · 런던',zone:'Europe/London',longitude:-.128},
 {id:'paris',name:'프랑스 · 파리',zone:'Europe/Paris',longitude:2.352},
 {id:'berlin',name:'독일 · 베를린',zone:'Europe/Berlin',longitude:13.405},
 {id:'newyork',name:'미국 · 뉴욕',zone:'America/New_York',longitude:-74.006},
 {id:'losangeles',name:'미국 · 로스앤젤레스',zone:'America/Los_Angeles',longitude:-118.244},
 {id:'chicago',name:'미국 · 시카고',zone:'America/Chicago',longitude:-87.63},
 {id:'toronto',name:'캐나다 · 토론토',zone:'America/Toronto',longitude:-79.383},
 {id:'sydney',name:'호주 · 시드니',zone:'Australia/Sydney',longitude:151.209},
 {id:'auckland',name:'뉴질랜드 · 오클랜드',zone:'Pacific/Auckland',longitude:174.764},
]);
export const SUPPORTED_ZONES=Object.freeze([...new Set(LOCATIONS.map(l=>l.zone))]);
export function locationPolicy(policy,id){const l=LOCATIONS.find(l=>l.id===id);if(!l)throw new Error('출생지를 확인하세요.');return {...policy,zone:l.zone,longitude:l.longitude};}
