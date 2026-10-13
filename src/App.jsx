import { useState, useEffect } from "react";
const OFFLINE_APP = import.meta.env.VITE_APP_MODE === "mobile";

const C={gold:"#d4ae6e",goldL:"#f2dea8",goldD:"#a07820",bg:"#1a1108",card:"#261a0c",text:"#f7edd5",muted:"rgba(230,190,120,0.72)",water:"#4da0f0",wood:"#3fc060",fire:"#f55030",earth:"#d8a818",metal:"#b8a078",red:"#f06050"};
const EL_COL={"水":C.water,"木":C.wood,"火":C.fire,"土":C.earth,"金":C.metal};
// 사진 스타일 색상 팔레트 (밝은 둥근 버튼용)
const PILL_BG={木:"#3fc060",火:"#f55030",土:"#d8a818",金:"#b8a078",水:"#4da0f0"};

const globalStyle=`
  ${OFFLINE_APP ? "" : "@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;700;900&family=Noto+Sans+KR:wght@300;400;700&display=swap');"}
  *{box-sizing:border-box;margin:0;padding:0;}
  input,select,button{font-family:'Noto Sans KR',sans-serif;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
  @keyframes shimmer{0%,100%{opacity:.5}50%{opacity:1}}
  @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  ::-webkit-scrollbar{height:3px;width:3px;}
  ::-webkit-scrollbar-thumb{background:rgba(201,169,110,0.3);border-radius:99px;}
  input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
  input[type=number]{-moz-appearance:textfield;}
`;

let _lunarReady=false,_lunarCallbacks=[];
function ensureLunar(cb){if(OFFLINE_APP){cb();return;}if(_lunarReady){cb();return;}_lunarCallbacks.push(cb);if(document.querySelector('script[data-lunar]'))return;const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/lunar-javascript/lunar.js';s.setAttribute('data-lunar','1');s.onload=()=>{_lunarReady=true;_lunarCallbacks.forEach(f=>f());_lunarCallbacks=[];};document.head.appendChild(s);}

function getJD(y,m,d){const a=Math.floor((14-m)/12),yy=y+4800-a,mm=m+12*a-3;return d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)-32045;}
function jdToDate(jd){const L=jd+68569,N=Math.floor(4*L/146097),L2=L-Math.floor((146097*N+3)/4),I=Math.floor(4000*(L2+1)/1461001),L3=L2-Math.floor(1461*I/4)+31,J=Math.floor(80*L3/2447),day=L3-Math.floor(2447*J/80),L4=Math.floor(J/11),month=J+2-12*L4,year=100*(N-49)+I+L4;return{year,month,day};}
function sunLon(jd){const T=(jd-2451545)/36525,L0=280.46646+36000.76983*T+0.0003032*T*T,M=((357.52911+35999.05029*T-0.0001537*T*T)*Math.PI)/180,CC=(1.914602-0.004817*T-0.000014*T*T)*Math.sin(M)+(0.019993-0.000101*T)*Math.sin(2*M)+0.000289*Math.sin(3*M);return((L0+CC)%360+360)%360;}
function findTermJD(year,lon){const base=getJD(year,1,1),approx=base+((lon-sunLon(base)+360)%360)/360*365.25;let j1=approx-15,j2=approx+15;for(let i=0;i<60;i++){const mid=(j1+j2)/2;let d=lon-sunLon(mid);if(d>180)d-=360;if(d<-180)d+=360;if(Math.abs(d)<0.00005)break;if(d>0)j1=mid;else j2=mid;}return(j1+j2)/2;}
const tCache={};
function getTerms(year){if(tCache[year])return tCache[year];const T=[{n:"입춘",l:315},{n:"경칩",l:345},{n:"청명",l:15},{n:"입하",l:45},{n:"망종",l:75},{n:"소서",l:105},{n:"입추",l:135},{n:"백로",l:165},{n:"한로",l:195},{n:"입동",l:225},{n:"대설",l:255},{n:"소한",l:285}];const r={};for(const t of T){const jd=findTermJD(year,t.l),d=jdToDate(jd+9/24);r[t.n]={month:d.month,day:d.day,jd};}tCache[year]=r;return r;}
function calcNewMoonKST(k){const T=k/1236.85;let JDE=2451550.09766+29.530588861*k+0.00015437*T*T-0.000000150*T*T*T+0.00000000073*T*T*T*T;const M=(2.5534+29.10535670*k-0.0000014*T*T-0.00000011*T*T*T)*Math.PI/180,Mp=(201.5643+385.81693528*k+0.0107582*T*T+0.00001238*T*T*T-0.000000058*T*T*T*T)*Math.PI/180,F=(160.7108+390.67050284*k-0.0016118*T*T-0.00000227*T*T*T+0.000000011*T*T*T*T)*Math.PI/180,Om=(124.7746-1.56375588*k+0.0020672*T*T+0.00000215*T*T*T)*Math.PI/180;JDE+=-0.40720*Math.sin(Mp)+0.17241*Math.sin(M)+0.01608*Math.sin(2*Mp)+0.01039*Math.sin(2*F)+0.00739*Math.sin(Mp-M)-0.00514*Math.sin(Mp+M)+0.00208*Math.sin(2*M)-0.00111*Math.sin(Mp-2*F)-0.00057*Math.sin(Mp+2*F)+0.00056*Math.sin(2*Mp+M)-0.00042*Math.sin(3*Mp)+0.00042*Math.sin(M+2*F)+0.00038*Math.sin(M-2*F)-0.00024*Math.sin(2*Mp-M)-0.00017*Math.sin(Om)-0.00007*Math.sin(Mp+2*M);return Math.floor(JDE+9/24+0.5);}

const NY={1900:[1,31],1901:[2,19],1902:[2,8],1903:[1,29],1904:[2,16],1905:[2,4],1906:[1,25],1907:[2,13],1908:[2,2],1909:[1,22],1910:[2,10],1911:[1,30],1912:[2,18],1913:[2,6],1914:[1,26],1915:[2,14],1916:[2,3],1917:[1,23],1918:[2,11],1919:[2,1],1920:[2,20],1921:[2,8],1922:[1,28],1923:[2,16],1924:[2,5],1925:[1,24],1926:[2,13],1927:[2,2],1928:[1,23],1929:[2,10],1930:[1,30],1931:[2,17],1932:[2,6],1933:[1,26],1934:[2,14],1935:[2,4],1936:[1,24],1937:[2,11],1938:[1,31],1939:[2,19],1940:[2,8],1941:[1,27],1942:[2,15],1943:[2,5],1944:[1,25],1945:[2,13],1946:[2,2],1947:[1,22],1948:[2,10],1949:[1,29],1950:[2,17],1951:[2,6],1952:[1,27],1953:[2,14],1954:[2,3],1955:[1,24],1956:[2,12],1957:[1,31],1958:[2,18],1959:[2,8],1960:[1,28],1961:[2,15],1962:[2,5],1963:[1,25],1964:[2,13],1965:[2,2],1966:[1,21],1967:[2,9],1968:[1,30],1969:[2,17],1970:[2,6],1971:[1,27],1972:[2,15],1973:[2,3],1974:[1,23],1975:[2,11],1976:[1,31],1977:[2,18],1978:[2,7],1979:[1,28],1980:[2,16],1981:[2,5],1982:[1,25],1983:[2,13],1984:[2,2],1985:[2,20],1986:[2,9],1987:[1,29],1988:[2,17],1989:[2,6],1990:[1,27],1991:[2,15],1992:[2,4],1993:[1,23],1994:[2,10],1995:[1,31],1996:[2,19],1997:[2,7],1998:[1,28],1999:[2,16],2000:[2,5],2001:[1,24],2002:[2,12],2003:[2,1],2004:[1,22],2005:[2,9],2006:[1,29],2007:[2,18],2008:[2,7],2009:[1,26],2010:[2,14],2011:[2,3],2012:[1,23],2013:[2,10],2014:[1,31],2015:[2,19],2016:[2,8],2017:[1,28],2018:[2,16],2019:[2,5],2020:[1,25],2021:[2,12],2022:[2,1],2023:[1,22],2024:[2,10],2025:[1,29],2026:[2,17],2027:[2,6],2028:[1,26],2029:[2,13],2030:[2,3],2031:[1,23]};
const LEAP_MONTH={1900:8,1902:5,1905:4,1907:9,1910:6,1913:5,1916:4,1919:2,1921:7,1924:5,1927:6,1930:5,1933:4,1936:3,1938:7,1941:6,1944:4,1947:2,1949:7,1952:5,1955:3,1957:8,1960:6,1963:4,1966:3,1968:7,1971:5,1972:4,1975:8,1977:8,1980:5,1982:4,1984:10,1987:6,1989:5,1990:5,1993:3,1995:8,1998:5,2001:4,2004:2,2006:7,2009:5,2012:3,2014:9,2017:6,2020:4,2023:2,2025:6,2028:5,2031:3};
const lyCache={};
function buildLunarYear(y){if(lyCache[y])return lyCache[y];const ny=NY[y],nyN=NY[y+1];if(!ny||!nyN)return null;const startJD=getJD(y,ny[0],ny[1]),endJD=getJD(y+1,nyN[0],nyN[1]),k0=Math.round((y+1/24-2000)*12.3685);let bestK=k0,bestDiff=999;for(let dk=-3;dk<=3;dk++){const jd=calcNewMoonKST(k0+dk),diff=Math.abs(jd-startJD);if(diff<bestDiff){bestDiff=diff;bestK=k0+dk;}}const months=[startJD];let k=bestK+1;while(true){const jd=calcNewMoonKST(k);if(jd>=endJD)break;if(jd>startJD)months.push(jd);k++;if(k>bestK+20)break;}const leapM=LEAP_MONTH[y]||0,result={startJD,endJD,months,leapM};lyCache[y]=result;return result;}
function solarToLunar(sy,sm,sd){const targetJD=getJD(sy,sm,sd);for(let y=1900;y<=2030;y++){const ny=NY[y],nyN=NY[y+1];if(!ny||!nyN)break;const startJD=getJD(y,ny[0],ny[1]),endJD=getJD(y+1,nyN[0],nyN[1]);if(targetJD<startJD||targetJD>=endJD)continue;const yr=buildLunarYear(y);if(!yr)continue;const{months,leapM}=yr,total=months.length;let mi=-1;for(let i=0;i<total;i++){const ns=i+1<total?months[i+1]:endJD;if(targetJD>=months[i]&&targetJD<ns){mi=i;break;}}if(mi<0)continue;const day=targetJD-months[mi]+1;let lm,isLeap=false;if(total===13&&leapM>0){if(mi<leapM)lm=mi+1;else if(mi===leapM){lm=leapM;isLeap=true;}else lm=mi;}else lm=mi+1;return{year:y,month:lm,day,isLeap};}return{year:1900,month:1,day:1,isLeap:false};}

const HS=["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const EB=["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const HS_EL=["木","木","火","火","土","土","金","金","水","水"];
const EB_EL=["水","土","木","木","土","火","火","土","金","金","土","水"];
const EB_KR=["자","축","인","묘","진","사","오","미","신","유","술","해"];
const ZODIAC=["쥐","소","호랑이","토끼","용","뱀","말","양","원숭이","닭","개","돼지"];
const ZODIAC_E=["🐭","🐮","🐯","🐰","🐉","🐍","🐴","🐑","🐵","🐓","🐶","🐗"];
const KANJI_YANG={甲:true,丙:true,戊:true,庚:true,壬:true,寅:true,辰:true,巳:true,午:true,申:true,戌:true};
const SS_MAP={甲甲:"비견",甲乙:"겁재",甲丙:"식신",甲丁:"상관",甲戊:"편재",甲己:"정재",甲庚:"편관",甲辛:"정관",甲壬:"편인",甲癸:"정인",乙乙:"비견",乙甲:"겁재",乙丁:"식신",乙丙:"상관",乙己:"편재",乙戊:"정재",乙辛:"편관",乙庚:"정관",乙癸:"편인",乙壬:"정인",丙丙:"비견",丙丁:"겁재",丙戊:"식신",丙己:"상관",丙庚:"편재",丙辛:"정재",丙壬:"편관",丙癸:"정관",丙甲:"편인",丙乙:"정인",丁丁:"비견",丁丙:"겁재",丁己:"식신",丁戊:"상관",丁辛:"편재",丁庚:"정재",丁癸:"편관",丁壬:"정관",丁乙:"편인",丁甲:"정인",戊戊:"비견",戊己:"겁재",戊庚:"식신",戊辛:"상관",戊壬:"편재",戊癸:"정재",戊甲:"편관",戊乙:"정관",戊丙:"편인",戊丁:"정인",己己:"비견",己戊:"겁재",己辛:"식신",己庚:"상관",己癸:"편재",己壬:"정재",己乙:"편관",己甲:"정관",己丁:"편인",己丙:"정인",庚庚:"비견",庚辛:"겁재",庚壬:"식신",庚癸:"상관",庚甲:"편재",庚乙:"정재",庚丙:"편관",庚丁:"정관",庚戊:"편인",庚己:"정인",辛辛:"비견",辛庚:"겁재",辛癸:"식신",辛壬:"상관",辛乙:"편재",辛甲:"정재",辛丁:"편관",辛丙:"정관",辛己:"편인",辛戊:"정인",壬壬:"비견",壬癸:"겁재",壬甲:"식신",壬乙:"상관",壬丙:"편재",壬丁:"정재",壬戊:"편관",壬己:"정관",壬庚:"편인",壬辛:"정인",癸癸:"비견",癸壬:"겁재",癸乙:"식신",癸甲:"상관",癸丁:"편재",癸丙:"정재",癸己:"편관",癸戊:"정관",癸辛:"편인",癸庚:"정인"};
const EBH={子:{yo:["壬",7],jung:null,bon:["癸",23]},丑:{yo:["癸",9],jung:["辛",3],bon:["己",18]},寅:{yo:["戊",7],jung:["丙",7],bon:["甲",16]},卯:{yo:["甲",10],jung:null,bon:["乙",20]},辰:{yo:["乙",9],jung:["癸",3],bon:["戊",18]},巳:{yo:["戊",7],jung:["庚",7],bon:["丙",16]},午:{yo:["丙",10],jung:["己",9],bon:["丁",11]},未:{yo:["丁",9],jung:["乙",3],bon:["己",18]},申:{yo:["戊",7],jung:["壬",7],bon:["庚",16]},酉:{yo:["庚",10],jung:null,bon:["辛",20]},戌:{yo:["辛",9],jung:["丁",3],bon:["戊",18]},亥:{yo:["戊",7],jung:["甲",5],bon:["壬",18]}};
function getSS(ds,s){return SS_MAP[ds+s]||"-";}

function validateDate(y,m,d){const year=+y,month=+m,day=+d;if(!y||!m||!d)return "생년월일을 모두 입력해주세요.";if(isNaN(year)||year<1900||year>2030)return "연도는 1900~2030 사이로 입력해주세요.";if(isNaN(month)||month<1||month>12)return "월은 1~12 사이로 입력해주세요.";const dm=[0,31,28,31,30,31,30,31,31,30,31,30,31];if((year%4===0&&year%100!==0)||(year%400===0))dm[2]=29;if(isNaN(day)||day<1||day>dm[month])return `${month}월은 최대 ${dm[month]}일까지 입력 가능합니다.`;return null;}
function validateTime(h,min){if(isNaN(+h)||+h<0||+h>23)return "시간은 0~23 사이로 입력해주세요.";if(isNaN(+min)||+min<0||+min>59)return "분은 0~59 사이로 입력해주세요.";return null;}
function getMaxDay(y,m){const dm=[0,31,28,31,30,31,30,31,31,30,31,30,31];if((y%4===0&&y%100!==0)||(y%400===0))dm[2]=29;return dm[m]||28;}

function calcStrengthDetail(pillars){
  const ds=pillars[1].stem,mb=pillars[2].branch,dayEl=HS_EL[HS.indexOf(ds)],mbEl=EB_EL[EB.indexOf(mb)];
  const genEl=EL_GEN[dayEl];
  const sikEl=EL_MY_GEN[dayEl]; // 식상
  const jaeEl=EL_CTRL[dayEl];   // 재성
  const gwanEl=EL_CTRL_ME[dayEl]; // 관성
  let elementScores={"木":0,"火":0,"土":0,"金":0,"水":0},myScore=0,somoScore=0;
  const isDeukRyeong=(mbEl===dayEl||mbEl===genEl);
  const stemW=[0.6,0,1.2,0.6],branchW=[0.6,1.2,3.0,0.6];
  function addScore(el,score){
    elementScores[el]=(elementScores[el]||0)+score;
    if(el===dayEl||el===genEl)myScore+=score;
    else if(el===sikEl) somoScore+=score*0.5;  // 식상 50%
    else if(el===jaeEl) somoScore+=score*0.8;  // 재성 80%
    else if(el===gwanEl) somoScore+=score*1.0; // 관성 100%
  }
  pillars.forEach((p,i)=>{
    if(i!==1)addScore(HS_EL[p.stemIdx],stemW[i]);
    else elementScores[HS_EL[p.stemIdx]]=(elementScores[HS_EL[p.stemIdx]]||0)+0.6; // 일간은 elementScores에만 반영 (myScore 제외)
    addScore(EB_EL[p.branchIdx],branchW[i]);
    const hidden=EBH[p.branch];
    if(hidden)Object.values(hidden).forEach(hs=>{if(!hs)return;addScore(HS_EL[HS.indexOf(hs[0])],branchW[i]*(hs[1]/30)*((p.branch===mb)?1.2:1.0));});
  });
  if(isDeukRyeong)myScore*=1.2;else myScore*=0.9;

  // ── 통근 가중치 (일지 지장간 기반) ──
  const dayBranch=pillars[1].branch;
  const dayHidden=EBH[dayBranch];
  let rootMult=0.75;
  if(dayHidden){
    const hidArr=Object.values(dayHidden).filter(Boolean);
    const isSelfGanyeo=HS_EL[HS.indexOf(ds)]===EB_EL[EB.indexOf(dayBranch)];
    let bestDays=0;
    hidArr.forEach(([s,days])=>{if(HS_EL[HS.indexOf(s)]===dayEl&&days>bestDays)bestDays=days;});
    if(isSelfGanyeo){
      rootMult=Math.max(1.45, 0.75+(bestDays/30)*0.8);
    } else if(dayEl==="土"&&bestDays>0&&bestDays<7){
      rootMult=1.05;
    } else {
      rootMult=0.75+(bestDays/30)*0.8;
    }
  }
  myScore*=rootMult;

  // ── 간여지동 보정 (타주) ──
  const isSelfGanyeo=HS_EL[HS.indexOf(ds)]===EB_EL[EB.indexOf(dayBranch)];
  const ganyeoMults=[
    {i:2, mult:1.40}, // 월주
    {i:0, mult:1.30}, // 시주
    {i:3, mult:1.15}, // 년주
  ];
  ganyeoMults.forEach(({i,mult})=>{
    if(pillars[i].stem===ds&&pillars[i].branch===dayBranch){
      myScore*=mult;
    }
  });

  // ── 인성 없는 비겁 과다 페널티 ──
  const totalEl=Object.values(elementScores).reduce((a,b)=>a+b,0)||1;
  const genRatio=(elementScores[genEl]||0)/totalEl;
  const dayRatio=(elementScores[dayEl]||0)/totalEl;
  const hasGen=genRatio>=0.05;
  if(!hasGen&&dayRatio>0.3) myScore*=0.85;

  // ── 비겁 상부상조 보정 (간여지동 시에만) ──
  if(isSelfGanyeo){
    const stemCount=pillars.filter((p,i)=>i!==1&&HS_EL[p.stemIdx]===dayEl).length;
    const branchCount=pillars.filter(p=>EB_EL[p.branchIdx]===dayEl).length;
    const bTotal=stemCount+branchCount;
    const bMult=bTotal>=4?1.15:bTotal>=3?1.10:bTotal>=2?1.05:1.0;
    if(bMult>1.0) myScore*=bMult;
  }

  // ── 소모세력 패널티 ──
  const total=myScore+somoScore;
  const somoRatio=total>0?somoScore/total:0;
  const k=isSelfGanyeo?(hasGen?0.25:0.35):0.55;
  const finalScore=myScore-myScore*somoRatio*k;

  // ── threshold 세분화 (득령×소모비율) ──
  let threshold;
  if(isDeukRyeong) threshold=somoRatio>0.6?5.8:5.5;
  else threshold=somoRatio>0.5?6.5:6.2;

  let strength;
  if(finalScore>=threshold+3)       strength="극신강";
  else if(finalScore>=threshold)    strength="신강";
  else if(finalScore>threshold-0.5) strength="중화+";
  else if(finalScore>threshold-1.0) strength="중화";
  else if(finalScore>threshold-1.5) strength="중화-";
  else if(finalScore>threshold-4.0) strength="신약";
  else                               strength="극신약";
  return{strength,myScore:finalScore,elementScores,isDeukRyeong};
}
function calcStrength(pillars){return calcStrengthDetail(pillars).strength;}
// 신강/신약 색상 (5단계)
function strengthColor5(s){
  if(s==="극신강")return"#ff4444";
  if(s==="신강")  return C.fire;
  if(s==="중화")  return C.gold;
  if(s==="신약")  return C.water;
  return"#8040ff"; // 극신약
}

// 한국 만세력 시지 경계 (23:30 기준)
// 子(23:30~01:29), 丑(01:30~03:29), 寅(03:30~05:29), 卯(05:30~07:29)
// 辰(07:30~09:29), 巳(09:30~11:29), 午(11:30~13:29), 未(13:30~15:29)
// 申(15:30~17:29), 酉(17:30~19:29), 戌(19:30~21:29), 亥(21:30~23:29)
// 분 단위: 子=90(01:30), 丑=210(03:30), ... 亥=1410(23:30)
// getHB: 입력 시각(분)이 어느 시지인지 반환
function getHB(hour,minute=0){
  const t=hour*60+minute;
  // 23:30(1410분) 이후 또는 01:30(90분) 미만 → 子시(0)
  if(t>=1410||t<90) return 0;
  // 01:30~03:29 → 丑(1), 03:30~05:29 → 寅(2), ...
  return Math.floor((t-90)/120)+1;
}
function getYP(y,m,d){const cb=findTermJD(y,315)+9/24,jd=getJD(y,m,d)+0.5,sy=jd<cb?y-1:y,s=((sy-4)%10+10)%10,b=((sy-4)%12+12)%12;return{stem:HS[s],branch:EB[b],stemIdx:s,branchIdx:b};}
function getDP(y,m,d){const jd=getJD(y,m,d),s=((jd+9)%10+10)%10,b=((jd+1)%12+12)%12;return{stem:HS[s],branch:EB[b],stemIdx:s,branchIdx:b};}
function getMP(y,m,d){const dJD=getJD(y,m,d)+0.5,MT=[{l:315,b:2},{l:345,b:3},{l:15,b:4},{l:45,b:5},{l:75,b:6},{l:105,b:7},{l:135,b:8},{l:165,b:9},{l:195,b:10},{l:225,b:11},{l:255,b:0},{l:285,b:1}];let branchIdx=1,bestJD=-Infinity;for(let yr=y-1;yr<=y+1;yr++)for(const t of MT){const tj=findTermJD(yr,t.l)+9/24;if(tj<=dJD&&tj>bestJD){bestJD=tj;branchIdx=t.b;}}const cb=findTermJD(y,315)+9/24,sajuY=dJD<cb?y-1:y,ySI=((sajuY-4)%10+10)%10,yinStem=[2,4,6,8,0][ySI%5],stemIdx=(yinStem+((branchIdx-2+12)%12))%10;return{stem:HS[stemIdx],branch:EB[branchIdx],stemIdx,branchIdx};}
function getHP(ds,hour,minute=0){const bi=getHB(hour,minute),dsi=(typeof ds==='number')?ds:HS.indexOf(ds),startMap={0:0,5:0,1:2,6:2,2:4,7:4,3:6,8:6,4:8,9:8},s=((startMap[dsi]??0)+bi)%10;return{stem:HS[s],branch:EB[bi],stemIdx:s,branchIdx:bi};}

function calcSaju(y,m,d,hour,minute=0){
  const lunar=solarToLunar(y,m,d),yp=getYP(y,m,d),mp=getMP(y,m,d),dp=getDP(y,m,d),hp=getHP(dp.stemIdx,hour,minute);
  return{pillars:[{label:"시",...hp},{label:"일",...dp},{label:"월",...mp},{label:"년",...yp}],dayStem:dp.stem,solar:{year:y,month:m,day:d,hour,minute},lunar};
}

function calcDaeun(by,bm,bd,gender,mp){
  const yp=getYP(by,bm,bd),isYang=yp.stemIdx%2===0,fwd=(isYang&&gender==="male")||(!isYang&&gender==="female");
  const T=getTerms(by),FT=["경칩","청명","입하","망종","소서","입추","백로","한로","입동","대설","소한","입춘"],BT=["입춘","소한","대설","입동","한로","백로","입추","소서","망종","입하","청명","경칩"];
  const tl=fwd?FT:BT,bjd=getJD(by,bm,bd);let near=365;
  for(const tn of tl){const td=T[tn];if(!td)continue;const df=fwd?td.jd-bjd:bjd-td.jd;if(df>0&&df<near)near=df;}
  const sa=Math.round(near/3);
  return Array.from({length:8},(_,i)=>{const off=fwd?i+1:-(i+1),si=((mp.stemIdx+off)%10+10)%10,bi=((mp.branchIdx+off)%12+12)%12,age=sa+i*10;return{stem:HS[si],branch:EB[bi],stemIdx:si,branchIdx:bi,startAge:age,startYear:by+age};})
  .filter(d=>d.startAge<=100); // 100세 초과 대운 제거
}
function calcSeun(year){const s=((year-4)%10+10)%10,b=((year-4)%12+12)%12;return{stem:HS[s],branch:EB[b],stemIdx:s,branchIdx:b,year};}

// ============================================================
// 12운성 (포태법)
// ============================================================
// 12운성 (포태법 조견표 — 이미지 원본 기준)
// 地支 순서: 子0 丑1 寅2 卯3 辰4 巳5 午6 未7 申8 酉9 戌10 亥11
// 열 순서: 甲 乙 丙/戊 丁/己 庚 辛 壬 癸
// ============================================================
const UNSUNG_TABLE = {
  //        子     丑     寅     卯     辰     巳     午     未     申     酉     戌     亥
  甲: ["목욕","관대","건록","제왕","쇠  ","병  ","사  ","묘  ","절  ","태  ","양  ","장생"],
  乙: ["병  ","쇠  ","제왕","건록","관대","목욕","장생","양  ","태  ","절  ","묘  ","사  "],
  丙: ["태  ","양  ","장생","목욕","관대","건록","제왕","쇠  ","병  ","사  ","묘  ","절  "],
  丁: ["절  ","묘  ","사  ","병  ","쇠  ","제왕","건록","관대","목욕","장생","양  ","태  "],
  戊: ["태  ","양  ","장생","목욕","관대","건록","제왕","쇠  ","병  ","사  ","묘  ","절  "],
  己: ["절  ","묘  ","사  ","병  ","쇠  ","제왕","건록","관대","목욕","장생","양  ","태  "],
  庚: ["사  ","묘  ","절  ","태  ","양  ","장생","목욕","관대","건록","제왕","쇠  ","병  "],
  辛: ["장생","양  ","태  ","절  ","묘  ","사  ","병  ","쇠  ","제왕","건록","관대","목욕"],
  壬: ["제왕","쇠  ","병  ","사  ","묘  ","절  ","태  ","양  ","장생","목욕","관대","건록"],
  癸: ["건록","관대","목욕","장생","양  ","태  ","절  ","묘  ","사  ","병  ","쇠  ","제왕"],
};
function getUnsung(stem, branch){
  const row = UNSUNG_TABLE[stem];
  if(!row) return "";
  const bi = EB.indexOf(branch);
  if(bi < 0) return "";
  return (row[bi]||"").trim();
}

// ============================================================
// 습도 지수 산출 엔진
// ============================================================
const HUM_V_STEM={甲:1,乙:1,丙:-3,丁:-2.5,戊:-2,己:1,庚:-1,辛:-1,壬:3,癸:3};
const HUM_V_BRANCH={子:3,亥:3,寅:1,卯:1,辰:1,丑:1,未:-2,戌:-2,申:-1,酉:-1,巳:-3,午:-3};
const HUM_W_STEM=[0.6,0,1.2,0.6];
const HUM_W_BRANCH=[0.6,1.2,3.0,0.6];

function calcHumidity(pillars){
  // 원국 4주(인덱스 0~3)만 정규 계산, 대운/세운은 지지만 별도 반영
  const base4=pillars.slice(0,4);
  const extra=pillars.slice(4);
  const stems=base4.map(p=>p.stem);
  const branches=base4.map(p=>p.branch);
  let hum=0;
  stems.forEach((s,i)=>{
    if(i===1) return; // 일간 제외
    const base=HUM_V_STEM[s]||0;
    const sEl=HS_EL[HS.indexOf(s)];
    let rooted=false;
    branches.forEach(b=>{
      const hid=EBH[b];if(!hid)return;
      Object.values(hid).forEach(h=>{if(h&&HS_EL[HS.indexOf(h[0])]===sEl)rooted=true;});
    });
    hum+=base*(HUM_W_STEM[i]||0)*(rooted?1.3:1.0);
  });
  branches.forEach((b,i)=>{
    const base=HUM_V_BRANCH[b]||0;
    const hid=EBH[b];
    let toukan=false;
    if(hid){const bonStem=hid.bon?.[0];if(bonStem&&stems.includes(bonStem))toukan=true;}
    hum+=base*(HUM_W_BRANCH[i]||0)*(toukan?1.2:1.0);
  });
  // 대운/세운 지지 추가 반영 (가중치 0.5 고정)
  extra.forEach(p=>{
    const base=HUM_V_BRANCH[p.branch]||0;
    hum+=base*0.5;
  });
  return Math.round(hum*100)/100;
}
function humLabel(h){
  if(h>4) return "습함";
  if(h>1) return "약간 습함";
  if(h>=-1) return "중간";
  if(h>=-4) return "약간 건조";
  return "건조";
}

// ============================================================
// TCPA 조후 정밀 산출 엔진
// ============================================================
// 간지별 조후 기본값 V — 2.5배 스케일 (극한랭/극열 사주에서 ±10 수준 나오도록)
const TCPA_V_STEM={甲:2.5,乙:1.5,丙:10,丁:6,戊:3,己:0,庚:-1,辛:-2,壬:-10,癸:-6};
const TCPA_V_BRANCH={子:-10,丑:-10,寅:2.5,卯:1.5,辰:0,巳:6,午:10,未:5,申:0,酉:0,戌:2.5,亥:-6};

// 원국 위치별 가중치
// pillars 순서: [시주0, 일주1, 월주2, 년주3]
// 시간=0.025, 시지=0.025, 일간=0, 일지=0.2, 월간=0.15, 월지=0.4, 년간=0.025, 년지=0.05
const TCPA_W_STEM=[0.025, 0, 0.15, 0.025];   // [시간, 일간, 월간, 년간]
const TCPA_W_BRANCH=[0.025, 0.2, 0.4, 0.05]; // [시지, 일지, 월지, 년지]

function calcTCPA(pillars, daeunStem=null, daeunBranch=null, seunStem=null, seunBranch=null){
  let sBase=0;
  pillars.forEach((p,i)=>{
    sBase+=(TCPA_V_STEM[p.stem]||0)*TCPA_W_STEM[i];
    sBase+=(TCPA_V_BRANCH[p.branch]||0)*TCPA_W_BRANCH[i];
  });
  // 일간 소가중치 0.05 추가
  sBase+=(TCPA_V_STEM[pillars[1].stem]||0)*0.05;
  // 간여지동 조후 중첩: 일주와 동일 간지 반복 시 V값 추가 가중
  const dayP=pillars[1];
  [0,2,3].forEach(i=>{
    if(pillars[i].stem===dayP.stem&&pillars[i].branch===dayP.branch){
      sBase+=(TCPA_V_STEM[dayP.stem]||0)*0.03+(TCPA_V_BRANCH[dayP.branch]||0)*0.05;
    }
  });

  let sLuck=0,sYear=0;
  if(daeunStem) sLuck+=(TCPA_V_STEM[daeunStem]||0)*0.5;
  if(daeunBranch) sLuck+=(TCPA_V_BRANCH[daeunBranch]||0)*1.0;
  if(seunStem) sYear+=(TCPA_V_STEM[seunStem]||0)*0.3;
  if(seunBranch) sYear+=(TCPA_V_BRANCH[seunBranch]||0)*0.7;

  let sTotal=sBase+sLuck+sYear;

  // 조후 해결사 없으면 1.2배
  const mb=pillars[2].branch;
  const coldMonths=["亥","子","丑"],hotMonths=["巳","午","未"];
  const allStems=pillars.map(p=>p.stem),allBranches=pillars.map(p=>p.branch);
  const hasFireResolver=hotMonths.includes(mb)?allStems.concat(allBranches).some(k=>TCPA_V_STEM[k]<=-5||TCPA_V_BRANCH[k]<=-5):true;
  const hasColdResolver=coldMonths.includes(mb)?allStems.concat(allBranches).some(k=>TCPA_V_STEM[k]>=7.5||TCPA_V_BRANCH[k]>=7.5):true;
  if(!hasFireResolver||!hasColdResolver) sTotal*=1.2;

  const withRun=[...allBranches,daeunBranch,seunBranch].filter(Boolean);
  const fireHap=[["寅","午","戌"],["巳","午","未"]],waterHap=[["申","子","辰"],["亥","子","丑"]];
  if(fireHap.some(g=>g.every(b=>withRun.includes(b)))) sTotal*=1.5;
  if(waterHap.some(g=>g.every(b=>withRun.includes(b)))) sTotal*=1.5;

  sTotal=Math.round(sTotal*100)/100;
  sBase=Math.round(sBase*100)/100;
  return{sBase,sLuck:Math.round(sLuck*100)/100,sYear:Math.round(sYear*100)/100,sTotal};
}

function tcpaLabel(s){
  if(s>=14)  return{label:"심각한 과열",sublabel:"Red Alert",color:"#ff2020",emoji:"🌋"};
  if(s>=8)   return{label:"위험 과열",sublabel:"과열 경보",color:"#f55030",emoji:"🔥"};
  if(s>=4)   return{label:"조열함",sublabel:"열기 주의",color:"#fb923c",emoji:"☀️"};
  if(s>=1.5) return{label:"약한 온기",sublabel:"양호",color:"#f5c842",emoji:"🌤"};
  if(s>=-1.5)return{label:"균형",sublabel:"최적",color:"#4ade80",emoji:"🌿"};
  if(s>=-4)  return{label:"약한 한기",sublabel:"냉량",color:"#86efac",emoji:"🍃"};
  if(s>=-8)  return{label:"한냉함",sublabel:"한기 주의",color:"#4da0f0",emoji:"❄️"};
  if(s>=-14) return{label:"위험 한랭",sublabel:"한기 경보",color:"#2080ff",emoji:"🧊"};
  return{label:"심각한 한랭",sublabel:"Freeze Alert",color:"#8040ff",emoji:"☃️"};
}

// (tcpaMentalState, tcpaHealth, tcpaSolution, tcpaAdvice 제거 → getJohuMessages로 통합)

// ============================================================
// 조후 메시지 시스템 — 온도 × 습도 융합
// ============================================================
function getHumZone(h){
  if(h>=10) return{tag:"🌊 바다",label:"극습"};
  if(h>=5)  return{tag:"🏞️ 호수",label:"습윤"};
  if(h>=2)  return{tag:"💧 개울",label:"약습"};
  if(h>=-2) return{tag:"🌿 들판",label:"중간"};
  if(h>=-5) return{tag:"🍂 메마른 들판",label:"약건"};
  if(h>=-10)return{tag:"🌵 황야",label:"건조"};
  return{tag:"🏜️ 사막",label:"극건"};
}
function getTempZone(s){
  if(s>=14) return{tag:"🌋 용암지대",label:"극열"};
  if(s>=8)  return{tag:"🔥 타는 사막",label:"과열"};
  if(s>=4)  return{tag:"☀️ 무더운 여름",label:"조열"};
  if(s>=1.5)return{tag:"🌤 따뜻한 봄",label:"온기"};
  if(s>=-1.5)return{tag:"🌿 쾌적한 균형",label:"균형"};
  if(s>=-4) return{tag:"🍃 선선한 가을",label:"약냉"};
  if(s>=-8) return{tag:"❄️ 차가운 겨울",label:"한냉"};
  if(s>=-14)return{tag:"🧊 혹한",label:"위험한랭"};
  return{tag:"☃️ 남극",label:"극한랭"};
}
function getJohuMessages(s, h=0){
  const t=getTempZone(s);
  const hm=getHumZone(h);
  // 온도 극열
  if(s>=14) return{
    climate:`${t.tag} × ${hm.tag}`,
    work: h>=2?"뜨겁고 습한 열기에 판단이 완전히 흐려집니다. 중요한 결정을 반드시 타인에게 위임하세요."
              :"판단력이 완전히 마비된 상태입니다. 모든 결정권과 카드를 신뢰할 수 있는 타인에게 넘기세요.",
    finance: h>=2?"충동 소비와 과투자 위험이 최고조입니다. 모든 결제를 48시간 뒤로 미루세요."
                :"'영끌'과 '몰빵'의 유혹이 극에 달합니다. HTS나 코인 앱을 당장 삭제하세요.",
    relation: h>=2?"감정이 폭발 직전입니다. 대화를 잠시 중단하고 혼자만의 공간을 확보하세요."
                 :"숨 쉬듯 주변에 상처를 줍니다. 묵언 수행이 유일한 답입니다.",
    health: h>=2?"뜨겁고 습한 기운이 심장과 폐를 동시에 압박합니다. 에어컨이 있는 서늘한 실내에서 안정을 취하세요."
               :"체내 수분(진액)이 완전히 말라붙었습니다. 미지근한 물을 의식적으로 마시고 수면 시간을 늘려 뇌를 식히세요."
  };
  // 온도 과열
  if(s>=8) return{
    climate:`${t.tag} × ${hm.tag}`,
    work: h>=2?"열기와 습기가 겹쳐 머리가 무겁고 집중력이 떨어집니다. 환기 후 짧게 끊어서 일하세요."
              :"조급증이 심해져 7할 완성에서 멈추지 못합니다. 결과물을 내보내기 전 반드시 한 번 더 확인하세요.",
    finance: h>=2?"소비 욕구가 끓어오릅니다. 24시간 장바구니 규칙을 반드시 지키세요."
                :"홧김 비용이 폭발합니다. 밤 10시 이후 온라인 결제는 무조건 다음 날로 미루세요.",
    relation: h>=2?"감정이 넘쳐 주변을 피곤하게 만들 수 있습니다. 한 발짝 물러서서 상대의 속도를 존중하세요."
                 :"내 기준을 남에게 강요하다 고립될 수 있습니다. 의식적으로 대답을 3초 늦게 하세요.",
    health: h>=2?"열과 습기가 겹쳐 피부 트러블과 부종이 심해집니다. 냉찜질과 수분 섭취를 늘리세요."
               :"화(火) 기운이 폐와 피부를 직격합니다. 커피와 술은 불에 기름, 배·도라지차를 곁에 두세요."
  };
  // 온도 조열
  if(s>=4) return{
    climate:`${t.tag} × ${hm.tag}`,
    work: h>=2?"열기와 습기로 집중력이 오래 유지되지 않습니다. 50분 집중 후 10분 환기를 반복하세요."
              :"일의 진척은 빠르지만 디테일이 엉망입니다. 메일 발송 전 오탈자와 숫자를 두 번 확인하세요.",
    finance: h>=2?"충동적 소비가 잦아집니다. 구매 전 '정말 필요한가' 세 번 물어보는 습관을 들이세요."
                :"리스크 테이킹을 즐기기 시작합니다. 현금 비중을 늘리세요.",
    relation: h>=2?"감정 표현이 과해질 수 있습니다. 말이 많아지는 시기, 지키지 못할 약속은 하지 마세요."
                 :"과장법이 심해집니다. 지키지 못할 호언장담을 남발하지 마세요.",
    health: h>=2?"습열(濕熱)이 위장을 자극해 소화 불량과 피부 트러블이 동시에 나타납니다. 자극적 음식을 피하세요."
               :"위장 열이 쌓여 가짜 식욕이 폭발합니다. 차가운 음료 대신 상온의 물을 자주 마시세요."
  };
  // 온도 온기
  if(s>=1.5) return{
    climate:`${t.tag} × ${hm.tag}`,
    work: h>=5?"습기가 많아 몸이 무겁게 느껴질 수 있습니다. 가벼운 스트레칭으로 시작하세요."
        :h<=-2?"건조한 공기에 집중력은 좋으나 경직될 수 있습니다. 유연하게 접근하면 성과가 납니다."
              :"에너지가 적절히 상승 중입니다. 미뤄뒀던 굵직한 태스크를 치고 나가기 좋은 타이밍입니다.",
    finance: h>=5?"소비 욕구가 슬슬 올라옵니다. 가랑비에 옷 젖는 지출을 가계부로 점검하세요."
                :"나를 위한 소소한 사치가 잦아집니다. 커피값, 택시비 등 소액 지출을 점검하세요.",
    relation: h>=5?"관계가 풍성해지는 시기입니다. 만남을 늘리되 감정 소모에 주의하세요."
                 :"자신감이 넘쳐 매력이 어필되는 시기입니다. 선을 넘는 농담만 주의하세요.",
    health: h>=5?"습기로 몸이 무겁고 관절이 뻑뻑할 수 있습니다. 가벼운 유산소로 순환을 도우세요."
        :h<=-2?"건조해 두통이나 뒷목 뭉침이 잦습니다. 반신욕으로 위로 뜬 열을 아래로 끌어내리세요."
              :"상체로 열이 살짝 뜨는 상태입니다. 하체 운동과 반신욕이 도움됩니다."
  };
  // 온도 균형
  if(s>=-1.5) return{
    climate:`${t.tag} × ${hm.tag}`,
    work: h>=5?"습기가 집중력을 흩뜨립니다. 환경을 정리하고 핵심 업무에 집중하세요."
        :h<=-2?"건조하고 맑은 기운에 집중력이 최고입니다. 기획과 분석 업무에 집중하세요."
              :"추진력과 이성이 완벽한 균형입니다. 최상의 컨디션, 중요한 결정을 내리기 좋은 때입니다.",
    finance: h>=5?"소비 충동이 없지 않으니 가계부를 점검하세요."
                :"수입과 지출의 통제가 완벽합니다. 지금의 포트폴리오를 우직하게 밀고 나가세요.",
    relation: h>=5?"관계가 잔잔히 무르익습니다. 일상적인 관심 표현이 신뢰를 쌓습니다."
                 :"오해 없이 내 뜻을 전달할 수 있습니다. 중요한 대화나 계약에 최적의 타이밍입니다.",
    health: h>=5?"습기로 몸이 약간 무겁습니다. 식후 산책으로 소화를 돕고 순환을 개선하세요."
        :h<=-2?"건조한 공기에 피부와 호흡기가 예민해집니다. 물 자주 마시고 가습기를 켜세요."
              :"기혈 순환이 가장 원활한 이상적인 상태입니다. 현재의 식단과 수면 패턴을 유지하세요."
  };
  // 온도 약냉
  if(s>=-4) return{
    climate:`${t.tag} × ${hm.tag}`,
    work: h>=5?"습하고 서늘한 기운이 의욕을 가라앉힙니다. 따뜻한 음료 한 잔으로 시작해 몸부터 깨우세요."
        :h<=-2?"건조하고 서늘한 기운에 두뇌 회전은 빠릅니다. 분석과 기획에 집중하세요."
              :"실행력보다 분석력이 빛납니다. 전략 기획과 데이터 업무 효율이 최고입니다.",
    finance: h>=5?"소극적 심리에 좋은 기회도 흘려보낼 수 있습니다. 소액 투자로 감각을 유지하세요."
                :"지갑이 쉽게 열리지 않습니다. 차분하게 투자처를 분석하기 좋은 시기입니다.",
    relation: h>=5?"습하고 가라앉는 기운에 관계가 소원해질 수 있습니다. 먼저 연락하는 용기를 내세요."
                 :"다소 건조해 보이지만 신뢰감을 줍니다. 감정보다 논리로 설득할 때 유리합니다.",
    health: h>=5?"한습(寒濕)이 스며들어 관절이 무겁고 몸이 붓습니다. 족욕과 따뜻한 국물로 속을 덥히세요."
        :h<=-2?"건조하고 서늘해 기관지와 피부가 예민합니다. 따뜻한 차와 보습에 신경 쓰세요."
              :"체열이 살짝 내려가 차분함을 유지하기 좋습니다. 식후 15분 가볍게 걷는 산책이 좋습니다."
  };
  // 온도 한냉
  if(s>=-8) return{
    climate:`${t.tag} × ${hm.tag}`,
    work: h>=5?"차갑고 축축한 기운에 몸도 마음도 무겁습니다. 작은 것 하나씩 처리하며 흐름을 만드세요."
        :h<=-2?"차갑고 메마른 기운에 의욕이 꽁꽁 얼었습니다. 따뜻한 공간에서 최소한의 루틴만 지키세요."
              :"수비적 태도가 강해집니다. 새로운 제안보다 기존 것을 지키는 수성 전략이 맞습니다.",
    finance: h>=5?"돈의 흐름이 막히고 손실 두려움이 커집니다. 최소 고정 지출만 유지하세요."
                :"돈을 꽉 쥐고만 있어 흐름이 막힙니다. 생산적인 곳에 의식적으로 돈을 쓰세요.",
    relation: h>=5?"감정이 무겁게 가라앉아 혼자 속앓이를 합니다. 서운함을 구체적인 단어로 표현해보세요."
                 :"혼자 속앓이를 합니다. 상대방은 독심술사가 아닙니다. 서운함을 뱉어내세요.",
    health: h>=5?"한습이 뼈와 근육 깊숙이 스며들어 관절이 쑤십니다. 핫팩으로 아랫배를 따뜻하게 유지하세요."
        :h<=-2?"차갑고 건조한 기운에 기관지와 관절이 모두 힘듭니다. 실내 온도와 습도를 동시에 관리하세요."
              :"한기가 위장으로 스며듭니다. 생강차나 따뜻한 국물로 속을 덥히세요."
  };
  // 온도 위험한랭
  if(s>=-14) return{
    climate:`${t.tag} × ${hm.tag}`,
    work: h>=5?"차갑고 습한 기운에 무기력이 극에 달합니다. 따뜻한 실내에서 최소 루틴만 지키세요."
        :h<=-2?"극도로 차갑고 메마른 기운입니다. 오늘은 출근해서 메일함만 비워도 100점입니다."
              :"무기력증이 찾아와 루틴이 무너집니다. 거창한 목표는 버리고 오늘 할 일 하나만 정하세요.",
    finance: h>=5?"경제 감각이 완전히 마비됩니다. 중요한 고지서와 만기 적금을 먼저 확인하세요."
                :"경제 관념이 희미해집니다. 금융 캘린더를 켜고 중요 납부일을 먼저 확인하세요.",
    relation: h>=5?"사람 만나는 것 자체가 에너지 소모입니다. 신뢰하는 한 명에게만 근황을 알리세요."
                 :"자발적 아웃사이더 모드입니다. 점심시간 햇볕을 쬐며 혼자 걷는 것만으로도 큰 도움입니다.",
    health: h>=5?"차갑고 습한 기운이 신장을 압박합니다. 부추·마늘·쑥 등 양기를 돋우는 식단이 필수입니다."
        :h<=-2?"극한의 차갑고 건조한 환경입니다. 실내 난방과 가습을 동시에 유지하세요."
              :"신장의 온기가 얼어붙었습니다. 찬물 샤워는 절대 피하고 몸을 따뜻하게 유지하세요."
  };
  // 온도 극한랭
  return{
    climate:`${t.tag} × ${hm.tag}`,
    work: h>=5?"차갑고 습한 냉기가 극에 달합니다. 뇌가 겨울잠에 들어갔으니 단순 반복 업무만 하세요."
        :h<=-2?"극한의 차갑고 메마른 환경입니다. 기계처럼 단순 반복만 하세요."
              :"어떤 동기부여도 타격감이 없습니다. 생각을 끄고 단순 반복 업무만 하세요.",
    finance: h>=5?"모든 자산이 얼어붙은 느낌입니다. 유동성 확보에만 집중하고 새로운 투자는 금물입니다."
                :"모든 자산이 동결된 느낌입니다. 현금화할 수 없는 곳에 돈이 묶이지 않도록 하세요.",
    relation: h>=5?"소통 스위치가 완전히 꺼졌습니다. 억지로 웃으려 하지 말고 단 한 사람에게만 생존 신고를 하세요."
                 :"타인과의 소통이 끊겼습니다. 신뢰할 수 있는 단 한 사람에게만 생존 신고를 해두세요.",
    health: h>=5?"차갑고 습한 기운이 온몸을 잠식합니다. 따뜻한 목욕과 충분한 수면이 유일한 회복책입니다."
        :h<=-2?"극한의 냉건조 환경입니다. 실내에서 따뜻하게 지내며 햇볕 쬐기가 최우선입니다."
              :"체내 불씨가 완전히 꺼진 상태입니다. 낮 시간에 햇볕을 쬐며 걷는 일광욕이 유일한 생명줄입니다."
  };
}
// ============================================================
// 명리 서사 생성 — Narrative Matrix (원국 Base × 운 Delta)
// ============================================================
function getJohuNarrative(sBase, delta){
  const absDelta=Math.abs(delta);
  // 패턴 A: 해빙 — 한랭 원국 + 열기 운
  if(sBase<-5&&delta>=5) return {
    pattern:"A",tag:"🌅 해빙",color:"#f5c842",
    work:"오랫동안 막혀있던 일에 온기가 돌기 시작합니다. 묵혀뒀던 제안서나 프로젝트를 다시 꺼낼 타이밍입니다.",
    finance:"얼어있던 자금 흐름에 물꼬가 트입니다. 단, 급하게 움직이지 말고 조금씩 물꼬를 열어가세요.",
    relation:"차갑게 굳었던 관계에 온도가 생깁니다. 먼저 연락하면 예상보다 따뜻한 반응이 돌아옵니다.",
    health:"냉기가 서서히 풀리며 순환이 개선됩니다. 이 시기에 가벼운 유산소 운동을 시작하면 효과가 배가됩니다."
  };
  // 패턴 B: 진정 — 조열 원국 + 냉기 운
  if(sBase>5&&delta<=-5) return {
    pattern:"B",tag:"🌊 진정",color:"#4da0f0",
    work:"달아올랐던 판단력이 차분하게 안정됩니다. 그동안 과속했던 프로젝트를 점검하고 내실을 다질 시기입니다.",
    finance:"과열됐던 소비 욕구가 가라앉습니다. 충동 지출을 멈추고 재정 점검을 할 최적의 타이밍입니다.",
    relation:"감정적으로 몰아붙였던 관계들이 숨 고를 시간을 갖습니다. 먼저 사과할 용기가 생기는 시기입니다.",
    health:"과열된 체온이 내려가며 심신이 안정됩니다. 충분한 수면과 수분 섭취로 회복에 집중하세요."
  };
  // 패턴 C: 변조 — 균형 원국 + 극단 운
  if(Math.abs(sBase)<3&&absDelta>=7) return {
    pattern:"C",tag:"⚡ 변조",color:"#c084fc",
    work:`균형 잡혀있던 흐름에 ${delta>0?"뜨거운":"차가운"} 변수가 치고 들어옵니다. 예상치 못한 기회나 돌발 변수에 대비하세요.`,
    finance:"안정됐던 재정에 갑작스런 변동이 옵니다. 예비 자금을 확보하고 유연하게 대응하세요.",
    relation:"편안했던 관계에 뜻밖의 사건이 생깁니다. 흔들리지 말고 본인의 중심을 잡는 게 우선입니다.",
    health:"갑작스런 기후 변화처럼 몸이 적응하는 데 시간이 필요합니다. 무리한 일정을 피하고 컨디션 관리에 집중하세요."
  };
  // 패턴 D: 심화-냉 — 한랭 원국 + 냉기 운
  if(sBase<-5&&delta<=-3) return {
    pattern:"D",tag:"🧊 심화(냉)",color:"#8040ff",
    work:"추진력이 바닥을 칩니다. 새로운 시작보다는 기존 것을 지키는 수성 전략이 맞습니다.",
    finance:"돈을 쓰는 것도 버는 것도 모두 막힌 느낌입니다. 최소한의 고정 지출만 유지하고 현금을 보전하세요.",
    relation:"혼자 있고 싶은 마음이 커집니다. 억지로 사람을 만나려 하지 말고 신뢰하는 한두 명과만 교류하세요.",
    health:"냉기가 겹겹이 쌓입니다. 몸을 따뜻하게 유지하는 것만으로도 큰 도움이 됩니다. 반신욕과 따뜻한 식사를 챙기세요."
  };
  // 패턴 E: 심화-열 — 조열 원국 + 열기 운
  if(sBase>5&&delta>=3) return {
    pattern:"E",tag:"🔥 심화(열)",color:"#f55030",
    work:"이미 과속 중인데 더 밟으려 합니다. 번아웃 직전 신호입니다. 의식적으로 브레이크를 잡으세요.",
    finance:"과열된 판단이 무리한 투자로 이어질 수 있습니다. 지금 결정하려는 것을 일주일만 미루세요.",
    relation:"감정이 극에 달해 주변에 상처를 줄 수 있습니다. 말하기 전 한 번 더 생각하는 습관이 필요합니다.",
    health:"열이 열을 부릅니다. 수면 부족과 탈수에 특히 주의하세요. 격렬한 운동은 잠시 쉬고 스트레칭으로 대체하세요."
  };
  // 패턴 F: 유지 — 변화 미미
  return {
    pattern:"F",tag:"☯ 유지",color:"#4ade80",
    work:"큰 변동 없이 일상의 흐름이 이어집니다. 지금은 화려한 도전보다 꾸준함이 답입니다.",
    finance:"재정이 안정적으로 유지됩니다. 작은 절약과 소비 습관 점검이 장기적으로 큰 차이를 만듭니다.",
    relation:"관계가 잔잔하게 유지됩니다. 특별한 이벤트보다 일상적인 관심 표현이 더 깊은 신뢰를 쌓습니다.",
    health:"현재 상태가 유지됩니다. 지금의 생활 패턴을 점검하고 나쁜 습관을 하나씩 고쳐나갈 좋은 시기입니다."
  };
}

function calcJohuDetail(pillars, daeunBranch=null){
  const daeunStem=null; // 천간 없이 지지만
  const r=calcTCPA(pillars,daeunStem,daeunBranch);
  const s=r.sTotal;
  // TCPA → 0~100 스케일 변환 (0점=+20, 100점=-20, 50점=0)
  const tempScore=Math.max(0,Math.min(100,Math.round(50-s*2.5)));
  const humScore=Math.max(0,Math.min(100,Math.round(50-s*1.5)));
  const need=s<=-6?["火"]:s>=6?["水"]:[];
  const avoid=s<=-6?["水"]:s>=6?["火"]:[];
  return{tempScore,humScore,totalScore:Math.round((tempScore+humScore)/2),need,avoid,elScore:{},total:1};
}
function johuLabel(s){if(s>=80)return{label:"최적",color:"#4ade80"};if(s>=65)return{label:"양호",color:"#86efac"};if(s>=50)return{label:"보통",color:C.gold};if(s>=35)return{label:"불균형",color:"#fb923c"};return{label:"편중",color:C.red};}
function calcElementCount(pillars){const cnt={水:0,木:0,火:0,土:0,金:0};pillars.forEach(p=>{cnt[HS_EL[p.stemIdx]]=(cnt[HS_EL[p.stemIdx]]||0)+1.5;cnt[EB_EL[p.branchIdx]]=(cnt[EB_EL[p.branchIdx]]||0)+1;});return cnt;}

const BRANCH_DESC={子:"만물이 잠든 고요한 한겨울 밤",丑:"차고 척박한 한겨울의 언 땅",寅:"아직 어둠이 걷히지 않은 이른 봄새벽",卯:"꽃잎이 흩날리는 화사한 봄날",辰:"봄비가 촉촉이 내리는 무르익은 봄날",巳:"뜨거운 열기가 피어오르는 초여름",午:"태양이 작열하는 한여름 대낮",未:"모든 것이 무르익은 늦여름의 황혼",申:"청명한 하늘 아래 서늘한 초가을",酉:"결실의 향기 가득한 풍요로운 가을",戌:"낙엽이 지는 쓸쓸한 늦가을",亥:"찬 겨울비가 내리는 초겨울의 밤"};
const STEM_SHORT={甲:"우뚝 솟은 큰 나무",乙:"타고 오르는 덩굴",丙:"환하게 비추는 태양",丁:"따뜻한 촛불",戊:"묵묵히 버티는 큰 산",己:"씨앗을 품은 대지",庚:"날카로운 칼날",辛:"차갑게 빛나는 보석",壬:"힘차게 흐르는 강물",癸:"조용히 내리는 맑은 비"};
function buildMulsangHeader(ds,mb){const env=BRANCH_DESC[mb]||"",s=STEM_SHORT[ds]||"";if(!env||!s)return null;return`${env} · ${s}`;}

const CHUNG_MAP={子:"午",午:"子",丑:"未",未:"丑",寅:"申",申:"寅",卯:"酉",酉:"卯",辰:"戌",戌:"辰",巳:"亥",亥:"巳"};
const SAMHYUNG3=[["寅","巳","申"],["丑","戌","未"]];
const WANGJI=["子","午","卯","酉"]; // 왕지

// ============================================================
// 신살 엔진
// ============================================================
// 진도화
function calcDoHwa(pillars){
  const GROUP={亥:"子",卯:"子",未:"子",寅:"卯",午:"卯",戌:"卯",巳:"午",酉:"午",丑:"午",申:"酉",子:"酉",辰:"酉"};
  const branches=pillars.map(p=>p.branch);
  const targets=[{b:pillars[3].branch,src:"년지"},{b:pillars[1].branch,src:"일지"}];
  const result=[];
  for(const {b,src} of targets){
    const doHwaBranch=GROUP[b];
    if(doHwaBranch&&branches.some((br,i)=>{
      const p=pillars[i]; return br===doHwaBranch&&p.branch!==b;
    })) result.push({branch:doHwaBranch,src});
  }
  return result;
}
// 진역마
function calcYeokMa(pillars){
  const GROUP={亥:"巳",卯:"巳",未:"巳",寅:"申",午:"申",戌:"申",巳:"亥",酉:"亥",丑:"亥",申:"寅",子:"寅",辰:"寅"};
  const branches=pillars.map(p=>p.branch);
  const targets=[{b:pillars[3].branch,src:"년지"},{b:pillars[1].branch,src:"일지"}];
  const result=[];
  for(const {b,src} of targets){
    const yMaBranch=GROUP[b];
    if(yMaBranch&&branches.some((br,i)=>br===yMaBranch&&pillars[i].branch!==b)) result.push({branch:yMaBranch,src});
  }
  return result;
}
// 백호대살
const BAEKHO_LIST=["甲辰","乙未","丙戌","丁丑","戊辰","壬戌","癸丑"];
function calcBaekHo(pillars){
  return pillars.map((p,i)=>({hit:BAEKHO_LIST.includes(p.stem+p.branch),pillar:p,isDay:i===1,idx:i})).filter(r=>r.hit);
}
// 괴강살
const GOEGANG_LIST=["庚辰","庚戌","壬辰","壬戌","戊辰","戊戌"];
function calcGoeGang(pillars){
  return pillars.map((p,i)=>({hit:GOEGANG_LIST.includes(p.stem+p.branch),pillar:p,isDay:i===1,idx:i})).filter(r=>r.hit);
}
// 양인살
const YANGIN_MAP={甲:"卯",丙:"午",戊:"午",庚:"酉",壬:"子"};
function calcYangIn(pillars){
  const dayStem=pillars[1].stem;
  const yiBranch=YANGIN_MAP[dayStem];
  if(!yiBranch) return [];
  return pillars.map((p,i)=>({hit:p.branch===yiBranch,pillar:p,isDay:i===1,idx:i})).filter(r=>r.hit);
}
// 원진살
const WONJIN_PAIRS=[["子","未"],["丑","午"],["寅","酉"],["卯","申"],["辰","亥"],["巳","戌"]];
function calcWonJin(pillars){
  const result=[];
  for(const [a,b] of WONJIN_PAIRS){
    const idxA=pillars.map((p,i)=>p.branch===a?i:-1).filter(i=>i>=0);
    const idxB=pillars.map((p,i)=>p.branch===b?i:-1).filter(i=>i>=0);
    for(const ia of idxA) for(const ib of idxB){
      const dist=Math.abs(ia-ib);
      if(dist===1) result.push({a,b,ia,ib,strength:"강"});
      else if(dist===2) result.push({a,b,ia,ib,strength:"약"});
    }
  }
  return result;
}
// 천을귀인
const CHEONUL_MAP={甲:["丑","未"],戊:["丑","未"],庚:["丑","未"],乙:["子","申"],己:["子","申"],丙:["亥","酉"],丁:["亥","酉"],辛:["寅","午"],壬:["卯","巳"],癸:["卯","巳"]};
function calcCheonUl(pillars){
  const dayStem=pillars[1].stem;
  const targets=CHEONUL_MAP[dayStem]||[];
  return pillars.map((p,i)=>({hit:targets.includes(p.branch),pillar:p,branch:p.branch,isDay:i===1,idx:i})).filter(r=>r.hit);
}

// 신살 통합 산출
function calcSinsal(pillars){
  return {
    doHwa: calcDoHwa(pillars),
    yeokMa: calcYeokMa(pillars),
    baekHo: calcBaekHo(pillars),
    goeGang: calcGoeGang(pillars),
    yangIn: calcYangIn(pillars),
    wonJin: calcWonJin(pillars),
    cheonUl: calcCheonUl(pillars),
  };
}

// 신살 택일 점수 산정
function calcSinsalScore(pillars, yongsinEl, gisinEl, strength){
  const sinsal=calcSinsal(pillars);
  let score=0; const items=[];
  const isGil=(el)=>el===yongsinEl||EL_GEN[el]===yongsinEl;
  const isHyung=(el)=>el===gisinEl||EL_CTRL[el]===yongsinEl;

  // 천을귀인
  const cuList=sinsal.cheonUl;
  const cuBase=cuList.length>=2?0.5:1.0;
  for(const cu of cuList){
    const brEl=EB_EL[EB.indexOf(cu.branch)];
    const pts=isGil(brEl)?8:isHyung(brEl)?2:5;
    const adj=Math.round(pts*cuBase);
    score+=adj; items.push({label:`천을귀인 ${cu.branch}`,pts:adj,good:true});
  }
  // 진도화
  for(const dh of sinsal.doHwa){
    const brEl=EB_EL[EB.indexOf(dh.branch)];
    const pts=isGil(brEl)?3:isHyung(brEl)?-3:1;
    score+=pts; items.push({label:`진도화 ${dh.branch}`,pts,good:pts>=0});
  }
  // 진역마
  for(const ym of sinsal.yeokMa){
    const brEl=EB_EL[EB.indexOf(ym.branch)];
    const pts=isGil(brEl)?3:isHyung(brEl)?-3:1;
    score+=pts; items.push({label:`진역마 ${ym.branch}`,pts,good:pts>=0});
  }
  // 양인살
  for(const yi of sinsal.yangIn){
    const brEl=EB_EL[EB.indexOf(yi.pillar.branch)];
    const isOver=["신강","극신강"].includes(strength);
    const pts=isOver?-8:isGil(brEl)?5:-3;
    score+=pts; items.push({label:`양인살 ${yi.pillar.branch}`,pts,good:pts>0});
  }
  // 백호대살
  for(const bh of sinsal.baekHo){
    const brEl=EB_EL[EB.indexOf(bh.pillar.branch)];
    const pts=isGil(brEl)?5:-7;
    score+=pts; items.push({label:`백호대살 ${bh.pillar.stem}${bh.pillar.branch}`,pts,good:pts>0});
  }
  // 괴강살
  const ggList=sinsal.goeGang;
  for(const gg of ggList){
    const brEl=EB_EL[EB.indexOf(gg.pillar.branch)];
    const pts=isGil(brEl)?5:-5;
    score+=pts; items.push({label:`괴강살 ${gg.pillar.stem}${gg.pillar.branch}`,pts,good:pts>0});
  }
  if(ggList.length>=2){score-=5;items.push({label:"괴강 중복",pts:-5,good:false});}
  // 원진살
  for(const wj of sinsal.wonJin){
    const pts=wj.strength==="강"?-5:-2;
    score+=pts; items.push({label:`원진살 ${wj.a}${wj.b}(${wj.strength})`,pts,good:false});
  }
  return{score,items};
}

// ============================================================
// 통합 용신 산출 워터폴 엔진 v1.0
// ============================================================
const EL_GEN={木:"水",火:"木",土:"火",金:"土",水:"金"};   // 나를 생하는
const EL_MY_GEN={木:"火",火:"土",土:"金",金:"水",水:"木"}; // 내가 생하는(식상)
const EL_CTRL={木:"土",火:"金",土:"水",金:"木",水:"火"};   // 내가 극하는(재성)
const EL_CTRL_ME={木:"金",火:"水",土:"木",金:"火",水:"土"};// 나를 극하는(관성)
// 두 오행 사이를 통관시키는 오행
const EL_TONGWAN={
  "木土":"火","土木":"火",
  "火金":"土","金火":"土",
  "土水":"金","水土":"金",
  "金木":"水","木金":"水",
  "水火":"木","火水":"木",
};

function calcYongsin(pillars, tcpaSTotal){
  const {strength, elementScores} = calcStrengthDetail(pillars);
  const dayEl = HS_EL[HS.indexOf(pillars[1].stem)];
  const dayStem = pillars[1].stem;
  const total = Object.values(elementScores).reduce((a,b)=>a+b,0)||1;
  const elPct = {};
  for(const el of ["木","火","土","金","水"]) elPct[el]=(elementScores[el]||0)/total;

  // ── 억부용신 독립 산출 ──
  let eobbu={primary:null,secondary:null,reason:""};
  const killerEl=EL_CTRL_ME[dayEl]; // 나를 극하는 관성(편관)
  const killerPct=elPct[killerEl]||0;
  const jaeEl=EL_CTRL[dayEl];       // 내가 극하는 재성
  const jaePct=elPct[jaeEl]||0;
  const genEl=EL_GEN[dayEl];        // 나를 생하는 인성
  const genPct=elPct[genEl]||0;
  const sikEl=EL_MY_GEN[dayEl];     // 식상 오행
  const sikPct=elPct[sikEl]||0;

  // 편관 존재 여부
  const killerInStem=pillars.filter(p=>HS_EL[p.stemIdx]===killerEl).length;
  const killerInBranch=pillars.filter(p=>EB_EL[p.branchIdx]===killerEl).length;
  const hasKiller=killerInStem>=1||killerInBranch>=1;

  // 종격 체크
  const dominantEl=Object.entries(elPct).find(([,v])=>v>=0.75)?.[0];
  if(dominantEl&&(dominantEl===dayEl||EL_GEN[dayEl]===dominantEl)){
    eobbu={primary:dominantEl,secondary:EL_GEN[dominantEl],reason:`종격 — ${dominantEl} 순응`,type:"종격"};
  } else if(["극신약","신약"].includes(strength)){
    if(hasKiller){
      // 신약 + 편관 → 식상제살
      eobbu={primary:sikEl,secondary:genEl,reason:`${strength} + 편관(${killerEl}) — 식상(${sikEl})으로 제살`,type:"억부"};
    } else {
      // 신약 + 편관 없음 → 인성 보강
      eobbu={primary:genEl,secondary:dayEl,reason:`${strength} — 인성(${genEl})으로 보강`,type:"억부"};
    }
  } else if(["중화+","중화","중화-"].includes(strength)){
    if(hasKiller){
      // 중화 + 편관 → 식상제살
      eobbu={primary:sikEl,secondary:null,reason:`중화 + 편관(${killerEl}) — 식상(${sikEl})으로 제살`,type:"억부"};
    } else {
      // 중화 + 편관 없음 → 억부 필요 없음
      eobbu={primary:null,secondary:null,reason:`중화 — 억부용신 불필요`,type:"억부"};
    }
  } else {
    // 신강/극신강 → 재성으로 누설
    eobbu={primary:jaeEl,secondary:sikEl,reason:`${strength} — 재성(${jaeEl})으로 누설`,type:"억부"};
  }

  // ── 조후용신 독립 산출 ──
  let johu={primary:null,reason:""};
  if(tcpaSTotal<=-6){johu={primary:"火",reason:`조후 한랭(${tcpaSTotal}) — 火로 온기 보충`};}
  else if(tcpaSTotal>=6){johu={primary:"水",reason:`조후 과열(${tcpaSTotal}) — 水로 냉각`};}

  // ── 통관용신 독립 산출 ──
  let tongwan={primary:null,reason:""};
  const CLASH_PAIRS2=[["木","土"],["火","金"],["土","水"],["金","木"],["水","火"]];
  for(const [a,b] of CLASH_PAIRS2){
    if((elPct[a]||0)+(elPct[b]||0)>=0.55&&(elPct[a]||0)>=0.20&&(elPct[b]||0)>=0.20){
      const tw=EL_TONGWAN[a+b];
      if(tw){tongwan={primary:tw,reason:`${a}↔${b} 충돌 중재`};break;}
    }
  }

  // ── 마스터 라우터 — 억부/조후/통관 독립 유지 ──
  let primary=eobbu.primary, secondary=eobbu.secondary;
  let type=eobbu.type||"억부", isTrueYongsin=false;

  // 억부 null이면 조후 → 통관 순으로 primary 승격
  if(!primary&&johu.primary) primary=johu.primary;
  if(!primary&&tongwan.primary) primary=tongwan.primary;

  // 억부=조후 일치 시 진용신
  if(eobbu.primary&&johu.primary&&johu.primary===eobbu.primary) isTrueYongsin=true;

  // 용신 합거 체크
  const HS_HAP_EL={甲:"土",己:"土",乙:"金",庚:"金",丙:"水",辛:"水",丁:"木",壬:"木",戊:"火",癸:"火"};
  const HS_HAP6={甲:"己",己:"甲",乙:"庚",庚:"乙",丙:"辛",辛:"丙",丁:"壬",壬:"丁",戊:"癸",癸:"戊"};
  const primaryStems=pillars.filter(p=>HS_EL[p.stemIdx]===primary).map(p=>p.stem);
  const hapGeo=primaryStems.some(s=>pillars.some(p=>HS_HAP6[s]===p.stem));
  if(hapGeo)type=type+"(합거주의)";

  return{
    primary, secondary, type, isTrueYongsin, strength,
    johuYongsin: johu.primary,
    eobbu, johu, tongwan
  };
}

// 하위 호환용 (대운등급, 택일 등에서 여전히 사용)
// 용신 엔진 통합 래퍼 (calcYongsin 기반으로 하위 호환)
function getYongsinElements(strength,dayEl,johuNeed){
  // calcYongsin 없이 pillars가 없는 경우 폴백
  const MY_GEN={木:"火",火:"土",土:"金",金:"水",水:"木"},MY_CTRL={木:"土",火:"金",土:"水",金:"木",水:"火"};
  let yongs=["극신강","신강"].includes(strength)?[MY_GEN[dayEl],MY_CTRL[dayEl]]:["극신약","신약"].includes(strength)?[EL_GEN[dayEl],dayEl]:[MY_GEN[dayEl],EL_GEN[dayEl]];
  return[...new Set([...yongs,...(johuNeed||[])])];
}
function getYongsinText(strength,dayEl,johuNeed){
  const MY_GEN={木:"火",火:"土",土:"金",金:"水",水:"木"},MY_CTRL={木:"土",火:"金",土:"水",金:"木",水:"火"};
  let eobbuYongsin=[],eobbuGisin=[];
  if(["극신강","신강"].includes(strength)){eobbuYongsin=[MY_GEN[dayEl],MY_CTRL[dayEl]];eobbuGisin=[EL_GEN[dayEl],dayEl];}
  else if(["극신약","신약"].includes(strength)){eobbuYongsin=[EL_GEN[dayEl],dayEl];eobbuGisin=[MY_GEN[dayEl],MY_CTRL[dayEl]];}
  else{eobbuYongsin=[MY_GEN[dayEl],EL_GEN[dayEl]];eobbuGisin=[];}
  return{eobbuYongsin:[...new Set(eobbuYongsin)],eobbuGisin:[...new Set(eobbuGisin)],johuYongsin:johuNeed||[]};
}
// pillars 있을때 통합 용신 (calcYongsin 기반)
function getYongsinFromPillars(pillars){
  const tcpa=calcTCPA(pillars);
  return calcYongsin(pillars,tcpa.sBase);
}
function checkHapProtection(branch,allBranches){const HAP6={子:"丑",丑:"子",寅:"亥",亥:"寅",卯:"戌",戌:"卯",辰:"酉",酉:"辰",巳:"申",申:"巳",午:"未",未:"午"};return HAP6[branch]&&allBranches.includes(HAP6[branch]);}

// 12운성 강약 판별 (유기 계산용)
function unsungStrength(us){
  if(["장생","건록","제왕"].includes(us)) return "왕";
  if(["목욕","관대","쇠"].includes(us)) return "중";
  if(["병","사","묘","절","태","양"].includes(us)) return "약";
  return "중";
}
// 유기(有氣): 용신 세력과 뿌리 (0~10)
function calcYugi(pillars, yongsinEl, dayStem){
  const allStems=pillars.map(p=>p.stem);
  const allBranches=pillars.map(p=>p.branch);
  const stemEls=pillars.map(p=>HS_EL[p.stemIdx]);
  const branchEls=pillars.map(p=>EB_EL[p.branchIdx]);
  const inStem=stemEls.includes(yongsinEl);
  const inBranch=branchEls.includes(yongsinEl);
  if(!inStem&&!inBranch){
    // 지장간에만 암장된 경우
    const inHidden=pillars.some(p=>{const h=EBH[p.branch];return h&&Object.values(h).filter(Boolean).some(([s])=>HS_EL[HS.indexOf(s)]===yongsinEl);});
    return inHidden?0:0;
  }
  if(inStem){
    // 천간 투출 + 지지 통근 확인
    const stemIdx=pillars.findIndex(p=>HS_EL[p.stemIdx]===yongsinEl);
    if(stemIdx>=0){
      const stem=pillars[stemIdx].stem;
      // 지지에 생/록/왕지 있는지
      const hasStrongRoot=allBranches.some(b=>{const us=getUnsung(stem,b);return unsungStrength(us)==="왕";});
      if(hasStrongRoot) return 10;
      const hasMidRoot=allBranches.some(b=>{const us=getUnsung(stem,b);return unsungStrength(us)==="중";});
      if(hasMidRoot) return 7;
      return 3; // 천간에만, 뿌리 약함
    }
  }
  if(inBranch){
    // 지지에만 — 형충 여부
    const branchIdx=pillars.findIndex(p=>EB_EL[p.branchIdx]===yongsinEl);
    if(branchIdx>=0){
      const b=pillars[branchIdx].branch;
      const isChunged=allBranches.some((ob,i)=>i!==branchIdx&&CHUNG_MAP[b]===ob);
      return isChunged?3:7;
    }
  }
  return 3;
}
// 유정(有情): 일간과의 거리 (0~10)
function calcYujeong(pillars, yongsinEl){
  // pillars[0]=시, [1]=일, [2]=월, [3]=년
  // 일지([1].branch), 월간([2].stem), 시간([0].stem) = 최고 유정
  const close=[
    EB_EL[pillars[1].branchIdx]===yongsinEl, // 일지
    HS_EL[pillars[2].stemIdx]===yongsinEl,   // 월간
    HS_EL[pillars[0].stemIdx]===yongsinEl,   // 시간
  ];
  if(close.some(Boolean)) return 10;
  const mid=[
    EB_EL[pillars[2].branchIdx]===yongsinEl, // 월지
    EB_EL[pillars[0].branchIdx]===yongsinEl, // 시지
  ];
  if(mid.some(Boolean)) return 7;
  const far=[
    HS_EL[pillars[3].stemIdx]===yongsinEl, // 년간
    EB_EL[pillars[3].branchIdx]===yongsinEl, // 년지
  ];
  if(far.some(Boolean)) return 3;
  // 합거(合去) 확인: 용신 천간이 합으로 변질되는지
  const HS_HAP6={甲:"己",己:"甲",乙:"庚",庚:"乙",丙:"辛",辛:"丙",丁:"壬",壬:"丁",戊:"癸",癸:"戊"};
  const yongsinStems=pillars.filter(p=>HS_EL[p.stemIdx]===yongsinEl).map(p=>p.stem);
  const isHapGeo=yongsinStems.some(s=>pillars.some(p=>HS_HAP6[s]===p.stem));
  return isHapGeo?0:0;
}
// 청탁(淸濁): 용신 보호 (0~10)
function calcCheongtak(pillars, yongsinEl, gisinEl){
  if(!gisinEl) return 10;
  const allEls=[...pillars.map(p=>HS_EL[p.stemIdx]),...pillars.map(p=>EB_EL[p.branchIdx])];
  const hasGisin=allEls.includes(gisinEl);
  if(!hasGisin) return 10;
  // 기신 위치
  const gisinPositions=[];
  pillars.forEach((p,i)=>{if(HS_EL[p.stemIdx]===gisinEl)gisinPositions.push(i*2);if(EB_EL[p.branchIdx]===gisinEl)gisinPositions.push(i*2+1);});
  const yongsinPositions=[];
  pillars.forEach((p,i)=>{if(HS_EL[p.stemIdx]===yongsinEl)yongsinPositions.push(i*2);if(EB_EL[p.branchIdx]===yongsinEl)yongsinPositions.push(i*2+1);});
  // 인접(거리 1) 체크
  const isAdjacent=gisinPositions.some(gp=>yongsinPositions.some(yp=>Math.abs(gp-yp)<=1));
  if(isAdjacent) return 0;
  return 5;
}
// 일시 시너지
function calcIlsiSynergy(pillars, dayStem, yongsinEl){
  let bonus=0;
  const dayEl=HS_EL[HS.indexOf(dayStem)];
  // 일간 일지 통근
  const dayBranch=pillars[1].branch;
  const dayUs=getUnsung(dayStem,dayBranch);
  if(unsungStrength(dayUs)==="왕") bonus+=8;
  else if(unsungStrength(dayUs)==="약") bonus-=8;
  // 시간/시지 용신
  if(HS_EL[pillars[0].stemIdx]===yongsinEl) bonus+=8;
  if(EB_EL[pillars[0].branchIdx]===yongsinEl) bonus+=8;
  // 시주-일주 천간합
  const HS_HAP6={甲:"己",己:"甲",乙:"庚",庚:"乙",丙:"辛",辛:"丙",丁:"壬",壬:"丁",戊:"癸",癸:"戊"};
  if(HS_HAP6[pillars[0].stem]===dayStem) bonus+=5;
  return bonus;
}
// 부모-자녀 적합도 (엄마/아빠 각각)
function calcParentChildScore(childPillars, childYongsinEl, parentPillar){
  if(!parentPillar) return 0;
  const parentDayEl=HS_EL[HS.indexOf(parentPillar[1].stem)];
  const parentDayStem=parentPillar[1].stem;
  const childDayStem=childPillars[1].stem;
  const HS_HAP6={甲:"己",己:"甲",乙:"庚",庚:"乙",丙:"辛",辛:"丙",丁:"壬",壬:"丁",戊:"癸",癸:"戊"};
  const STEM_CHUNG={甲:"庚",庚:"甲",乙:"辛",辛:"乙",丙:"壬",壬:"丙",丁:"癸",癸:"丁"};
  let score=0;
  // 부모 일간 = 자녀 용신 오행
  if(parentDayEl===childYongsinEl) score+=15;
  // 부모 일간이 자녀 용신을 生
  else if(EL_GEN[parentDayEl]===childYongsinEl) score+=8;
  // 부모 일간이 자녀 용신을 剋
  else if(EL_CTRL_ME&&EL_CTRL[parentDayEl]===childYongsinEl) score-=10;
  // 천간합
  if(HS_HAP6[parentDayStem]===childDayStem) score+=8;
  // 천간충
  if(STEM_CHUNG[parentDayStem]===childDayStem) score-=10;
  return score;
}


function calcDaeunGrade(pillars,dayStem,daeunStem,daeunBranch){
  const{strength}=calcStrengthDetail(pillars),mb=pillars[2].branch,db=pillars[1].branch,allBranches=pillars.map(p=>p.branch),dayEl=HS_EL[HS.indexOf(dayStem)];
  const tcpaBase=calcTCPA(pillars);
  const yongsin=calcYongsin(pillars,tcpaBase.sBase);
  const yongsinEls=[yongsin.primary,yongsin.secondary].filter(Boolean);
  const johuYongsin=yongsin.johuYongsin;
  const MY_GEN={木:"火",火:"土",土:"金",金:"水",水:"木"},MY_CTRL={木:"土",火:"金",土:"水",金:"木",水:"火"},CTRL_ME={木:"金",火:"水",土:"木",金:"火",水:"土"};
  const dStemEl=HS_EL[HS.indexOf(daeunStem)],dBranchEl=EB_EL[EB.indexOf(daeunBranch)],targetChung=CHUNG_MAP[daeunBranch];
  let score=55,reasons=[];
  if(yongsinEls.includes(dStemEl)){score+=15;reasons.push(`천간에 용신 [${dStemEl}] 기운 진입`);}
  if(yongsinEls.includes(dBranchEl)){score+=20;reasons.push(`지지에 용신 뿌리 [${dBranchEl}] 도래`);}
  if(!yongsinEls.includes(dStemEl)&&!yongsinEls.includes(dBranchEl)){
    if(["극신강","신강"].includes(strength)&&(dStemEl===dayEl||dStemEl===EL_GEN[dayEl])){score-=10;reasons.push("기구신이 들어와 경쟁 및 부담 증가");}
    if(["극신약","신약"].includes(strength)&&(dBranchEl===MY_CTRL[dayEl]||dBranchEl===CTRL_ME[dayEl])){score-=15;reasons.push("기구신이 들어와 현실적 압박이 거셈");}
  }
  // 조후 반영 (TCPA 기반)
  if(johuYongsin&&(dStemEl===johuYongsin||dBranchEl===johuYongsin)){score+=15;reasons.push(`조후 균형 개선 — ${johuYongsin} 기운 진입`);}
  const tcpaWithDaeun=calcTCPA(pillars,daeunStem,daeunBranch);
  const baseSign=tcpaBase.sBase>0?"+":"";
  const newSign=tcpaWithDaeun.sTotal>0?"+":"";
  if(Math.abs(tcpaWithDaeun.sTotal)<Math.abs(tcpaBase.sBase)&&Math.abs(tcpaBase.sBase)>=4){score+=8;reasons.push(`조후 균형 개선 (${baseSign}${tcpaBase.sBase} → ${newSign}${tcpaWithDaeun.sTotal})`);}
  else if(Math.abs(tcpaWithDaeun.sTotal)>Math.abs(tcpaBase.sBase)+2){score-=10;reasons.push(`조후 불균형 심화 (${baseSign}${tcpaBase.sBase} → ${newSign}${tcpaWithDaeun.sTotal})`);}
  if(daeunStem===daeunBranch){if(yongsinEls.includes(dBranchEl)){score+=10;reasons.push("길운이 간여지동으로 강하게 발복");}else{score-=10;reasons.push("흉운이 간여지동으로 겹쳐 제약 뚜렷");}}
  const withDaeun=[...allBranches,daeunBranch],HAP_GROUPS=[{el:"木",label:"木局",chars:["寅","卯","辰"]},{el:"火",label:"火局",chars:["巳","午","未"]},{el:"金",label:"金局",chars:["申","酉","戌"]},{el:"水",label:"水局",chars:["亥","子","丑"]},{el:"木",label:"木局",chars:["亥","卯","未"]},{el:"火",label:"火局",chars:["寅","午","戌"]},{el:"金",label:"金局",chars:["巳","酉","丑"]},{el:"水",label:"水局",chars:["申","子","辰"]}];
  for(const hap of HAP_GROUPS){if(hap.chars.every(c=>withDaeun.includes(c))&&hap.chars.includes(daeunBranch)){if(yongsinEls.includes(hap.el)){score+=25;reasons.push(`강력한 [${hap.label}] 용신 세력 형성`);}else{score-=25;reasons.push(`원치 않는 [${hap.label}] 세력 형성`);}break;}}
  if(allBranches.includes(targetChung)){const isP=checkHapProtection(targetChung,allBranches),tEl=EB_EL[EB.indexOf(targetChung)],isY=yongsinEls.includes(tEl);if(isY){score-=(isP?10:25);reasons.push(`⚠️ 대운이 용신 [${targetChung}]을 충격함${isP?" (합으로 피해 감소)":""}`);}else{score+=(isP?5:15);reasons.push(`✨ 대운이 기신 [${targetChung}] 충거, 장애물 제거`);}if(targetChung===db)reasons.push("📌 일지 자리 직접 변화");if(targetChung===mb)reasons.push("📌 월지(사회적 기반) 큰 변동");}
  if(SAMHYUNG3.some(g=>g.every(b=>withDaeun.includes(b))&&g.includes(daeunBranch))){score-=20;reasons.push("삼형살 완성 — 관재구설 주의");}
  if(reasons.length===0)reasons.push("무난하고 평온하게 흘러가는 시기");
  let gradeData;
  if(score>=80)gradeData={grade:"S",color:"#f5c842",label:"최상 발복기",desc:"모든 기운이 화합하여 최고의 성취를 이루는 전성기"};
  else if(score>=65)gradeData={grade:"A+",color:"#4ade80",label:"주도적 성취기",desc:"실력을 발휘하여 확실한 결과물을 쟁취하는 시기"};
  else if(score>=55)gradeData={grade:"A",color:"#86efac",label:"환경적 안정기",desc:"외부 환경이 우호적으로 변하고 안정을 찾는 시기"};
  else if(score>=40)gradeData={grade:"B",color:"#d4ae6e",label:"현상 유지기",desc:"큰 변화보다는 내실을 다지며 때를 기다려야 할 시기"};
  else gradeData={grade:"C",color:"#fb923c",label:"주의 및 타격기",desc:"외부 압박과 변동이 심하니 자중하고 수성해야 함"};
  return{...gradeData,reasons};
}

// ============================================================
// 택일 채점 엔진 v2
// ============================================================
// 통관(通關) 체크: A가 B를 극할 때 C가 중간에서 통관시키는지
function checkTongGwan(pillars, dayStem){
  // 수다토붕(水多土崩): 水가 많고 土 일간이 위험할 때 金(인성)이 土生金-金生水 통관
  const allEls=[...pillars.map(p=>HS_EL[p.stemIdx]),...pillars.map(p=>EB_EL[p.branchIdx])];
  const dayEl=HS_EL[HS.indexOf(dayStem)];
  const GEN={木:"水",火:"木",土:"火",金:"土",水:"金"};
  const MY_GEN={木:"火",火:"土",土:"金",金:"水",水:"木"};
  const CTRL_ME={木:"金",火:"水",土:"木",金:"火",水:"土"};
  const ctrlEl=CTRL_ME[dayEl]; // 나를 극하는 오행
  const genEl=GEN[dayEl];      // 나를 생하는 오행 (인성)
  const ctrlCount=allEls.filter(e=>e===ctrlEl).length;
  const genCount=allEls.filter(e=>e===genEl).length;
  // 극하는 오행이 4개 이상(수다토붕류) + 인성이 존재 → 통관 가산
  if(ctrlCount>=4 && genCount>=1) return 8;
  // 극하는 오행이 3개 + 인성 존재
  if(ctrlCount>=3 && genCount>=1) return 4;
  return 0;
}

function scoreTaekIlCandidate(pillars, dayStem, parentPillars=null){
  const {strength, elementScores, isDeukRyeong} = calcStrengthDetail(pillars);
  const tcpaBase = calcTCPA(pillars);
  const yongsin = calcYongsin(pillars, tcpaBase.sBase);
  const yongsinEl = yongsin.primary;
  const dayEl = HS_EL[HS.indexOf(dayStem)];
  const MY_CTRL={木:"土",火:"金",土:"水",金:"木",水:"火"};
  const gisinEl = MY_CTRL[yongsinEl]; // 용신을 극하는 기신
  const mb=pillars[2].branch, db=pillars[1].branch;
  const allBranches=pillars.map(p=>p.branch);
  const allStems=pillars.map(p=>p.stem);
  let score=60;
  const flags=[], goods=[];

  // ── 1단계: 구조적 치명타 ──
  const coldMonths=["亥","子","丑"], hotMonths=["巳","午","未"];
  const fireTotal=(elementScores["火"]||0), waterTotal=(elementScores["水"]||0);
  if(coldMonths.includes(mb)&&fireTotal<0.3){score-=40;flags.push("❌ 한겨울 월 + 火기운 전무");}
  if(hotMonths.includes(mb)&&waterTotal<0.3){score-=40;flags.push("❌ 한여름 월 + 水기운 전무");}
  if(["寅","巳","申"].every(b=>allBranches.includes(b))){score-=35;flags.push("❌ 인사신 삼형살");}
  if(["丑","戌","未"].every(b=>allBranches.includes(b))){score-=35;flags.push("❌ 축술미 삼형살");}
  if(allBranches.includes("子")&&allBranches.includes("卯")){score-=20;flags.push("⚠️ 자묘형");}
  if(allBranches.some((b,i)=>i!==1&&b===CHUNG_MAP[db])){score-=25;flags.push(`⚠️ 일지 ${db} 충`);}
  function isTGJC(p1,p2){return Math.abs(p1.stemIdx-p2.stemIdx)===6&&CHUNG_MAP[p1.branch]===p2.branch;}
  if(isTGJC(pillars[3],pillars[2])){score-=10;flags.push("⚠️ 연월 천극지충");}
  if(isTGJC(pillars[2],pillars[1])){score-=20;flags.push("⚠️ 월일 천극지충");}
  if(isTGJC(pillars[1],pillars[0])){score-=10;flags.push("⚠️ 일시 천극지충");}
  // 편관 감점 (일지/월지)
  const killerElForScore=EL_CTRL_ME[dayEl];
  if(EB_EL[EB.indexOf(db)]===killerElForScore){score-=15;flags.push(`⚠️ 일지 편관(${db})`);}
  if(EB_EL[EB.indexOf(mb)]===killerElForScore){score-=15;flags.push(`⚠️ 월지 편관(${mb})`);}
  // 일간 천간충 감점/가점 (케이스별)
  const HS_CHUNG_MAP={甲:"庚",庚:"甲",乙:"辛",辛:"乙",丙:"壬",壬:"丙",丁:"癸",癸:"丁"};
  const HS_HAP_STEMS={甲:"己",己:"甲",乙:"庚",庚:"乙",丙:"辛",辛:"丙",丁:"壬",壬:"丁",戊:"癸",癸:"戊"};
  const dayStemChar=pillars[1].stem;
  // 기신 오행 = 용신을 극하는 오행
  const MY_CTRL_EL={木:"土",火:"金",土:"水",金:"木",水:"火"};
  const gisinElForChung=MY_CTRL_EL[yongsinEl]||null;
  // 천간 합 보호 체크 (천간용)
  function isStemHapProtected(stem, allStemsArr){return HS_HAP_STEMS[stem]&&allStemsArr.includes(HS_HAP_STEMS[stem]);}
  // 위치별 충 상대 체크 [월간=2, 시간=0, 연간=3]
  [[2,"월간",20,12],[0,"시간",10,8],[3,"연간",10,8]].forEach(([idx,label,strongPt,weakPt])=>{
    const targetStem=allStems[idx];
    if(!targetStem||idx===1) return; // 일간 자신 제외
    const targetEl=HS_EL[HS.indexOf(targetStem)];
    const isChungWithDay=HS_CHUNG_MAP[dayStemChar]===targetStem; // 일간과 직접 충
    if(!isChungWithDay) return; // 일간과 충이 아니면 스킵
    const isHapProtected=isStemHapProtected(targetStem,allStems);
    let pt=0, msg="";
    if(targetEl===yongsinEl){
      // 용신 천간 충극 — 치명적
      pt=isHapProtected?-Math.round(strongPt*0.4):-strongPt;
      msg=`⚠️ ${label} ${targetStem}(${targetEl}) 일간·용신 동시 충극${isHapProtected?" (합보호 감소)":""}`;
    } else if(gisinElForChung&&targetEl===gisinElForChung){
      // 기신 천간이지만 일간 직접 충 → 충거 효과 있으나 일간도 상처
      pt=isHapProtected?0:Math.round(weakPt*0.3); // 충거 효과 대폭 축소
      msg=pt>0?`△ ${label} ${targetStem}(${targetEl}) 기신 충거 (일간 충 부작용)`:`⚠️ ${label} ${targetStem}(${targetEl}) 일간 직접 충`;
    } else {
      // 중립 — 일간 직접 충
      pt=-(idx===2?15:10);
      msg=`⚠️ ${label} ${targetStem} — 일간 직접 충`;
    }
    if(pt>0) goods.push(msg);
    else if(pt<0) flags.push(msg);
    score+=pt;
  });
  // 월간 편관 (천간에서 일간 직접 극, 충과 별개)
  if(HS_EL[HS.indexOf(allStems[2])]===killerElForScore&&HS_CHUNG_MAP[dayStemChar]!==allStems[2]){
    score-=10;flags.push(`⚠️ 월간 편관(${allStems[2]})`);
  }
  // ── 2단계: 오행/조후 균형 ──
  const tcpaScore=tcpaBase.sBase;
  const johuBalanceScore=Math.max(0,Math.min(40,Math.round((10-Math.abs(tcpaScore))*2)));
  score+=johuBalanceScore-20;
  if(Math.abs(tcpaScore)<=2)goods.push(`✅ 조후 균형 우수 (${tcpaScore>0?"+":""}${tcpaScore})`);
  if(Math.abs(tcpaScore)>=8){score-=15;flags.push(`⚠️ 조후 불균형 심각 (${tcpaScore>0?"+":""}${tcpaScore})`);}
  const hasAll5=["木","火","土","金","水"].every(el=>(elementScores[el]||0)>0.1);
  if(hasAll5){score+=15;goods.push("✅ 오행 구족");}
  const elTotal=Object.values(elementScores).reduce((a,b)=>a+b,1);
  const maxElRatio=Math.max(...Object.values(elementScores))/elTotal;
  if(maxElRatio>0.5){score-=20;const maxEl=Object.entries(elementScores).sort((a,b)=>b[1]-a[1])[0][0];flags.push(`⚠️ ${maxEl} 과다 편중 (${Math.round(maxElRatio*100)}%)`);}

  // ── 3단계: 용신 정밀 (유기/유정/청탁) ──
  if(yongsinEl){
    const yugi=calcYugi(pillars,yongsinEl,dayStem);
    const yujeong=calcYujeong(pillars,yongsinEl);
    const cheongtak=calcCheongtak(pillars,yongsinEl,gisinEl);
    score+=yugi+yujeong+cheongtak;
    if(yugi>=8)goods.push(`✅ 용신 유기(有氣) — 뿌리 강함 (+${yugi})`);
    else if(yugi<=3)flags.push(`⚠️ 용신 유기 약함 (+${yugi})`);
    if(yujeong>=8)goods.push(`✅ 용신 유정(有情) — 일간과 가까움 (+${yujeong})`);
    else if(yujeong<=3)flags.push(`⚠️ 용신 유정 약함 (+${yujeong})`);
    if(cheongtak>=8)goods.push(`✅ 용신 청(淸) — 기신 위협 없음 (+${cheongtak})`);
    else if(cheongtak===0)flags.push("⚠️ 용신 탁(濁) — 기신이 용신에 직접 충극");
    if(yongsin.isTrueYongsin){score+=8;goods.push("⭐ 진용신 — 억부+조후 일치");}
  }

  // ── 4단계: 일시 시너지 ──
  const ilsiBonus=calcIlsiSynergy(pillars,dayStem,yongsinEl);
  score+=ilsiBonus;
  if(ilsiBonus>0)goods.push(`✅ 일시 시너지 (+${ilsiBonus})`);
  else if(ilsiBonus<0)flags.push(`⚠️ 일시 불균형 (${ilsiBonus})`);

  // ── 5단계: 통관 가산점 ──
  const tongGwanBonus=checkTongGwan(pillars,dayStem);
  if(tongGwanBonus>0){score+=tongGwanBonus;goods.push(`✅ 통관 구조 (+${tongGwanBonus})`);}

  // ── 6단계: 부모-자녀 적합도 (엄마/아빠 각각) ──
  let parentBonus=0;
  if(parentPillars&&parentPillars.length>0){
    // 엄마/아빠 pillars 분리 (각 4개씩)
    const momPillars=parentPillars.slice(0,4).length===4?parentPillars.slice(0,4):null;
    const dadPillars=parentPillars.length>=8?parentPillars.slice(4,8):null;
    const scores=[];
    if(momPillars)scores.push(calcParentChildScore(pillars,yongsinEl,momPillars));
    if(dadPillars)scores.push(calcParentChildScore(pillars,yongsinEl,dadPillars));
    if(scores.length>0){
      parentBonus=Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
      score+=parentBonus;
      if(parentBonus>0)goods.push(`✅ 부모-자녀 적합 (+${parentBonus})`);
      else if(parentBonus<0)flags.push(`⚠️ 부모-자녀 충돌 (${parentBonus})`);
    }
  }

  // 신강/신약 기본 보정
  if(strength==="중화"){score+=12;goods.push("✅ 중화");}
  else if(strength==="신강"){score+=6;}
  else if(strength==="극신강"){score-=5;flags.push("⚠️ 극신강");}
  else if(strength==="신약"){score-=5;}
  else{score-=15;flags.push("❌ 극신약");}
  if(isDeukRyeong){score+=10;goods.push("✅ 득령");}

  // ── 신살 ──
  const sinsalResult=calcSinsalScore(pillars,yongsinEl,gisinEl,strength);
  score+=sinsalResult.score;
  for(const it of sinsalResult.items){
    if(it.good) goods.push(`✅ ${it.label} (+${it.pts})`);
    else flags.push(`⚠️ ${it.label} (${it.pts})`);
  }

  // 상관견관
  const hasGwan=allStems.some(s=>getSS(dayStem,s)==="정관"),hasSG=allStems.some(s=>getSS(dayStem,s)==="상관");
  if(hasGwan&&hasSG){const gi=allStems.findIndex(s=>getSS(dayStem,s)==="정관"),si=allStems.findIndex(s=>getSS(dayStem,s)==="상관");if(Math.abs(gi-si)===1){score-=15;flags.push("⚠️ 상관견관");}}

  score=Math.max(0,score);
  const rawScore=score;
  const johuNeed=tcpaScore<=-6?["火"]:tcpaScore>=6?["水"]:[];
  return{score,flags,goods,strength,johu:{totalScore:Math.max(0,Math.min(100,Math.round(50-tcpaScore*3))),tempScore:50,humScore:50,need:johuNeed},elementScores,yongsinEls:[yongsinEl,yongsin.secondary].filter(Boolean),tongGwanBonus,parentBonus};
}

// 대운 가중평균 (20~40대 높은 가중치)
function calcDaeunWeightedScore(daeunList, pillars, dayStem, birthYear){
  if(!daeunList||daeunList.length===0) return null;
  // 나이대별 가중치
  const ageWeight=(age)=>{
    if(age>=20&&age<=29) return 1.0;
    if(age>=30&&age<=39) return 1.0;
    if(age>=40&&age<=49) return 0.8;
    if(age>=50&&age<=59) return 0.6;
    if(age>=10&&age<=19) return 0.4;
    if(age>=60&&age<=69) return 0.3;
    return 0.1; // 70대+
  };
  const GRADE_SCORE={S:95,"A+":85,A:75,B:55,C:25};
  let totalW=0,totalWS=0;
  daeunList.forEach(d=>{
    const grade=calcDaeunGrade(pillars,dayStem,d.stem,d.branch);
    const gs=GRADE_SCORE[grade.grade]??50;
    const w=ageWeight(d.startAge);
    totalW+=w;totalWS+=gs*w;
  });
  return totalW>0?Math.round(totalWS/totalW):50;
}

// 각 시지의 대표 시각 (시지 중간값, 만세력 기준)
const SIJI_HOURS=[0,2,4,6,8,10,12,14,16,18,20,22]; // 子=00:30→0시, 丑=02:30→2시...
const SIJI_MINUTES=[30,30,30,30,30,30,30,30,30,30,30,30]; // 모두 :30분
const SIJI_LABELS=["子(23:30~01:29)","丑(01:30~03:29)","寅(03:30~05:29)","卯(05:30~07:29)","辰(07:30~09:29)","巳(09:30~11:29)","午(11:30~13:29)","未(13:30~15:29)","申(15:30~17:29)","酉(17:30~19:29)","戌(19:30~21:29)","亥(21:30~23:29)"];

function runTaekIlFilter(centerYear, centerMonth, centerDay, gender, parentPillars=null){
  const results=[];
  const seen=new Set();
  // 예정일 기준 ±10일
  let startJD=getJD(centerYear,centerMonth,centerDay)-10;
  let endJD=getJD(centerYear,centerMonth,centerDay)+10;
  for(let jd=startJD;jd<=endJD;jd++){
    const dt=jdToDate(jd);
    const {year:y,month:m,day:d}=dt;
    if(y<1900||y>2030) continue;
    for(let sijiIdx=0;sijiIdx<12;sijiIdx++){
      const h=SIJI_HOURS[sijiIdx];
      const min=SIJI_MINUTES[sijiIdx];
      try{
        const saju=calcSaju(y,m,d,h,min);
        const key=saju.pillars[1].stem+saju.pillars[1].branch+saju.pillars[0].stem+saju.pillars[0].branch;
        if(seen.has(key)) continue;
        const res=scoreTaekIlCandidate(saju.pillars,saju.dayStem,parentPillars);
        if(res.score<50) continue;
        seen.add(key);
        // 대운 가중평균 반영 (20%)
        const daeunList=calcDaeun(y,m,d,gender,saju.pillars[2]);
        const daeunAvg=calcDaeunWeightedScore(daeunList,saju.pillars,saju.dayStem,y);
        const finalScore=Math.round(res.score*0.8+(daeunAvg||50)*0.2);
        results.push({...res,score:finalScore,rawScore:res.score,daeunAvg,saju,day:d,month:m,year:y,hour:h,minute:0,sijiIdx,daeunList});
      }catch(e){}
    }
  }
  results.sort((a,b)=>b.score-a.score);
  return results.slice(0,3);
}

function hourLabel(h,m=0){return SIJI_LABELS[getHB(h,m)]||`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;}
// 시지 인덱스로 실제 시간 범위 텍스트
function sijiTimeLabel(sijiIdx){return SIJI_LABELS[sijiIdx]||"";}

// ============================================================
// 물상 이미지
// ============================================================
const STEM_SCENE={甲:"a towering ancient pine forest",乙:"a delicate wildflower meadow with cascading vines",丙:"a blazing sun at zenith scorching the horizon",丁:"a lone lantern flame against vast cold darkness",戊:"colossal mountain peaks wrapped in storm clouds",己:"deep fertile terraced earth heavy with possibility",庚:"sheer steel-grey cliffs with razor edges",辛:"glittering crystal formations in dark caverns",壬:"a boundless surging ocean eroding ancient shores",癸:"quiet rain and mist-shrouded mountain pools"};
const BRANCH_SCENE={子:"frozen tundra under a pale winter moon",丑:"frost-locked earth in deepest winter",寅:"misty spring forest at dawn",卯:"rolling hills of cherry blossoms",辰:"rain-soaked fields in early spring",巳:"parched summer earth shimmering in heat haze",午:"blazing midsummer noon, cracked earth",未:"golden late-summer dusk",申:"vivid mountain autumn slopes",酉:"endless harvest fields under clear autumn sky",戌:"bare branches in melancholy late-autumn dusk",亥:"cold dark winter rain on bare branches"};
function getJohuExpression(tS,hS){const tL=tS<35,tH=tS>68,hL=hS<35,hH=hS>68,tot=Math.round((tS+hS)/2);if(tL&&hH)return{body:"hunched against cold and dampness, arms wrapped tightly",face:"cheek in profile, tense cold expression, furrowed brow"};if(tL)return{body:"bundled tightly, body curled, cautious posture",face:"three-quarter profile, pensive cold expression"};if(tH&&hL)return{body:"slouched, hand raised to shade from sunlight",face:"profile squinting against harsh light, fatigued"};if(tH)return{body:"leaning back, light clothing, overwhelmed by heat",face:"three-quarter view, flushed strained expression"};if(tot>=70)return{body:"relaxed upright, arms slightly open, deep contentment",face:"soft three-quarter view, peaceful gentle smile"};return{body:"composed natural stance",face:"partial profile, neutral peaceful expression"};}
function getJohuCostume(tS,hS,gender){const f=gender==="female",tL=tS<40,tH=tS>68,hL=hS<40,hH=hS>68;let o="";if(tL&&hH)o=f?"heavy layered hanbok, dark indigo":"dark heavy overcoat, deep navy";else if(tL)o=f?"winter hanbok, fur-trimmed, silver and white":"thick Korean overcoat, charcoal and midnight blue";else if(tH&&hL)o=f?"light summer hanbok, vibrant red and orange":"lightweight linen Korean robe, warm amber";else if(tH)o=f?"sheer summer hanbok, coral and gold":"light Korean summer robe, golden yellow";else if(hL)o=f?"autumn hanbok, golden amber":"Korean autumn robe, chestnut and gold";else if(hH)o=f?"spring hanbok, jade green and misty blue":"spring Korean robe, moss green";else o=f?"classic hanbok, jade and ivory":"traditional Korean robe, deep teal and ivory";return`a Korean ${f?"woman":"man"} in three-quarter angle, ${o}`;}
function buildNarrativeTransition(mb,db){const cold=["亥","子","丑"],spr=["寅","卯","辰"],sum=["巳","午","未"],aut=["申","酉","戌"],g=b=>cold.includes(b)?"cold":spr.includes(b)?"spring":sum.includes(b)?"summer":"autumn",T={"cold->summer":"The frozen world cracks — blazing heat arrives","cold->spring":"Gentle warmth dissolves the frozen landscape","summer->cold":"Sudden cold crashes over scorched earth","summer->autumn":"Peak heat breaks into harvest gold","spring->summer":"Spring erupts into full summer glory","autumn->cold":"Autumn descends into deep winter","cold->cold":"Cold compounds upon cold","summer->summer":"Heat compounds with doubled intensity","spring->spring":"Spring multiplies into lush abundance","autumn->autumn":"Autumn settles deep and golden"};return T[`${g(mb)}->${g(db)}`]||"a subtle seasonal shift";}
function buildOriginPrompt(ds,mb,gender,tS,hS){const char=getJohuCostume(tS,hS,gender),expr=getJohuExpression(tS,hS);return`Photorealistic cinematic 8K photograph. Primary landscape: ${STEM_SCENE[ds]}. Seasonal environment: ${BRANCH_SCENE[mb]}. Character (20% of frame): ${char}. Body: ${expr.body}. Face: ${expr.face}. Landscape dominates. Dramatic cinematic lighting. STRICT: NO text, NO watermark. One figure only.`;}
function buildDaeunFusionPrompt(ds,mb,db,gender,tS,hS){const char=getJohuCostume(tS,hS,gender),expr=getJohuExpression(tS,hS),tr=buildNarrativeTransition(mb,db);return`Photorealistic cinematic 8K photograph. Primary identity: ${STEM_SCENE[ds]}. TRANSFORMATION: ${tr}. New energy: ${BRANCH_SCENE[db]}. Character at boundary: ${char}. Body: ${expr.body}. Face: ${expr.face}. Two color palettes bleed across frame. Epic scale. STRICT: NO text, NO watermark.`;}
async function generateImage(prompt,onProgress){if(OFFLINE_APP)throw new Error("이미지 생성은 오프라인 앱에서 지원하지 않습니다.");onProgress?.(10,"요청 전송 중...");const r=await fetch("/api/image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})});const data=await r.json();if(!r.ok)throw new Error(data.error||"이미지 생성 실패");if(data.url){onProgress?.(100,"완료!");return data.url;}if(data.id){for(let i=0;i<60;i++){await new Promise(res=>setTimeout(res,2000));const poll=await fetch(`/api/image?id=${data.id}`);const pd=await poll.json();onProgress?.(Math.min(90,30+i*2),"AI 렌더링 중...");if(pd.status==="succeeded"){onProgress?.(100,"완료!");return pd.url;}if(pd.status==="failed")throw new Error(pd.error||"생성 실패");}throw new Error("시간 초과");}throw new Error("응답 오류");}

// 궁합
const HS_HAP={甲:"己",己:"甲",乙:"庚",庚:"乙",丙:"辛",辛:"丙",丁:"壬",壬:"丁",戊:"癸",癸:"戊"};
const HS_CHUNG={甲:"庚",庚:"甲",乙:"辛",辛:"乙",丙:"壬",壬:"丙",丁:"癸",癸:"丁"};
const WANG_JI=["子","午","卯","酉"],WANG_CHUNG={子:"午",午:"子",卯:"酉",酉:"卯"};
const SAMHYUNG=[["寅","巳","申"],["丑","戌","未"],["子","卯"]];
function calcCompatScore(s1,s2){const d1=s1.pillars[1].stem,d2=s2.pillars[1].stem,b1=s1.pillars[1].branch,b2=s2.pillars[1].branch;let score=50;const details=[];if(HS_HAP[d1]===d2){score+=20;details.push({type:"일간합",icon:"✦",desc:`${d1}·${d2} 천간합`,positive:true,pts:20});}if(HS_CHUNG[d1]===d2){score-=15;details.push({type:"일간충",icon:"✕",desc:`${d1}·${d2} 천간충`,positive:false,pts:-15});}const el1=HS_EL[s1.pillars[1].stemIdx],el2=HS_EL[s2.pillars[1].stemIdx];const tcpa1=calcTCPA(s1.pillars),tcpa2=calcTCPA(s2.pillars);const n1=tcpa1.sBase<=-6?["火"]:tcpa1.sBase>=6?["水"]:[];const n2=tcpa2.sBase<=-6?["火"]:tcpa2.sBase>=6?["水"]:[];let jPts=0;if(n1.includes(el2))jPts+=10;if(n2.includes(el1))jPts+=10;score+=jPts;details.push(jPts>0?{type:"조후보완",icon:"◎",desc:`오행 상호보완 (${el2}·${el1})`,positive:true,pts:jPts}:{type:"조후보완",icon:"△",desc:"조후 보완 관계 없음",positive:false,pts:0});if(WANG_JI.includes(b1)&&WANG_JI.includes(b2)&&WANG_CHUNG[b1]===b2){score-=12;details.push({type:"왕지충",icon:"⚡",desc:`${b1}·${b2} 왕지충`,positive:false,pts:-12});}const combined=[...s1.pillars.map(p=>p.branch),...s2.pillars.map(p=>p.branch)];if(SAMHYUNG.some(grp=>grp.every(b=>combined.includes(b)))){score-=10;details.push({type:"삼형살",icon:"⚠",desc:"삼형살 완성",positive:false,pts:-10});}return{score:Math.max(0,Math.min(100,score)),details};}
function compatLabel(s){if(s>=85)return{label:"천생연분",color:"#f59e0b"};if(s>=70)return{label:"좋은 인연",color:"#4ade80"};if(s>=55)return{label:"보통 궁합",color:C.gold};if(s>=40)return{label:"주의 필요",color:"#fb923c"};return{label:"충극 관계",color:C.red};}

// ============================================================
// 공통 UI
// ============================================================
function Card({children,style}){return <div style={{background:C.card,borderRadius:18,padding:16,border:"1px solid rgba(215,180,105,0.22)",boxShadow:"0 4px 20px rgba(0,0,0,0.22)",...style}}>{children}</div>;}
function CardTitle({children,style}){return <p style={{textAlign:"center",fontWeight:700,color:C.goldL,fontFamily:"'Noto Serif KR',serif",marginBottom:12,fontSize:"0.85rem",letterSpacing:"0.1em",...style}}>{children}</p>;}
function Field({label,children}){return <div><label style={{fontSize:"0.65rem",fontWeight:700,color:C.muted,display:"block",marginBottom:8,letterSpacing:"0.1em"}}>{label}</label>{children}</div>;}
function SI({style,...p}){return <input {...p} style={{width:"100%",padding:"13px 16px",borderRadius:14,border:"1.5px solid rgba(215,180,105,0.32)",background:"rgba(255,255,255,0.10)",color:C.text,fontSize:"0.95rem",outline:"none",boxSizing:"border-box",...style}}/>;}
function GoldBtn({children,style,...p}){return <button {...p} style={{padding:"14px 24px",borderRadius:14,background:p.disabled?`${C.gold}12`:`linear-gradient(135deg,${C.gold},${C.goldD})`,color:p.disabled?C.muted:"#160c00",fontWeight:700,fontSize:"0.88rem",border:"none",cursor:p.disabled?"not-allowed":"pointer",letterSpacing:"0.08em",fontFamily:"'Noto Serif KR',serif",...style}}>{children}</button>;}
function GhBtn({children,active,style,...p}){return <button {...p} style={{padding:"10px 0",borderRadius:0,background:"transparent",color:active?C.gold:`${C.gold}55`,border:"none",borderBottom:active?`2px solid ${C.gold}`:"2px solid transparent",cursor:"pointer",fontSize:"0.68rem",fontWeight:700,whiteSpace:"nowrap",flex:1,letterSpacing:"0.05em",textAlign:"center",transition:"all 0.18s",...style}}>{children}</button>;}
function GenderBtn({v,l,form,setForm}){return <button onClick={()=>setForm({...form,gender:v})} style={{flex:1,padding:12,borderRadius:12,background:form.gender===v?`${C.gold}28`:"rgba(255,255,255,0.07)",color:form.gender===v?C.gold:`${C.gold}88`,border:form.gender===v?`1.5px solid ${C.gold}70`:"1.5px solid rgba(255,255,255,0.14)",cursor:"pointer",fontWeight:700,fontSize:"0.85rem"}}>{l}</button>;}

// ============================================================
// ★ 새 만세력 스타일 기둥 카드 (사진 UI 스타일)
// ============================================================
function PillarCard({p, dayStem, isDay=false, isHighlight=false, accentColor=null, showUnsung=true}){
  const sc = EL_COL[HS_EL[p.stemIdx]] || C.gold;
  const bc = EL_COL[EB_EL[p.branchIdx]] || C.gold;
  const stemSS = isDay ? "본원" : getSS(dayStem, p.stem);
  const bonStem = EBH[p.branch]?.bon?.[0];
  const branchSS = bonStem ? getSS(dayStem, bonStem) : "";
  const hid = EBH[p.branch] || {};
  const hidItems = [hid.yo, hid.jung, hid.bon].filter(Boolean);
  // 12운성: 일간 기준
  const unsungStr = showUnsung && dayStem ? getUnsung(dayStem, p.branch) : "";

  const bgStem = isDay ? "#2c3e6b" : isHighlight ? `${accentColor||sc}22` : "#2a2a2a";
  const bgBranch = isDay ? "#2c6b3a" : isHighlight ? `${accentColor||bc}22` : "#1e1e1e";
  const borderCol = isDay ? "#4a90d9" : isHighlight ? (accentColor||sc) : "rgba(255,255,255,0.12)";

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1,gap:3,minWidth:0}}>
      <div style={{fontSize:"0.85rem",fontWeight:700,color:isDay?"#7ab8ff":isHighlight?(accentColor||C.gold):C.muted,letterSpacing:"0.08em",marginBottom:2}}>{p.label}주</div>
      <div style={{fontSize:"0.72rem",fontWeight:700,color:isDay?"#7ab8ff":C.muted,background:"rgba(255,255,255,0.08)",borderRadius:6,padding:"2px 8px",marginBottom:2}}>{stemSS}</div>
      <div style={{width:"100%",padding:"10px 4px",borderRadius:14,background:bgStem,border:`2px solid ${borderCol}`,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
        <div style={{fontSize:"2.2rem",lineHeight:1,color:sc,fontFamily:"'Noto Serif KR',serif",fontWeight:KANJI_YANG[p.stem]?900:300}}>{p.stem}</div>
        <div style={{fontSize:"0.65rem",color:sc,fontWeight:700}}>{HS_EL[p.stemIdx]}</div>
      </div>
      <div style={{width:"100%",padding:"10px 4px",borderRadius:14,background:bgBranch,border:`2px solid ${isDay?"#4aaa6b":isHighlight?(accentColor||bc)+"66":"rgba(255,255,255,0.1)"}`,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
        <div style={{fontSize:"2.2rem",lineHeight:1,color:bc,fontFamily:"'Noto Serif KR',serif",fontWeight:KANJI_YANG[p.branch]?900:300}}>{p.branch}</div>
        <div style={{fontSize:"0.65rem",color:bc,fontWeight:700}}>{EB_EL[p.branchIdx]}</div>
      </div>
      {branchSS && <div style={{fontSize:"0.68rem",fontWeight:700,color:isDay?"#4aaa6b":C.muted,background:"rgba(255,255,255,0.06)",borderRadius:6,padding:"2px 7px"}}>{branchSS}</div>}
      {/* 지장간 */}
      <div style={{display:"flex",gap:2,justifyContent:"center",flexWrap:"wrap",marginTop:1}}>
        {hidItems.map(([stem,days],j)=>{
          const hsc=EL_COL[HS_EL[HS.indexOf(stem)]]||C.gold;
          return <div key={j} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"1px 4px",borderRadius:5,background:`${hsc}15`}}>
            <span style={{fontSize:"0.7rem",color:hsc,fontFamily:"serif",fontWeight:700}}>{stem}</span>
            <span style={{fontSize:"0.42rem",color:hsc,opacity:0.7}}>{days}일</span>
          </div>;
        })}
      </div>
      {/* 12운성 */}
      {unsungStr && <div style={{fontSize:"0.65rem",fontWeight:700,color:bc,background:`${bc}18`,borderRadius:6,padding:"2px 8px",marginTop:1,letterSpacing:"0.05em"}}>{unsungStr}</div>}
    </div>
  );
}

// ============================================================
// 용신 뱃지 (통합 컴포넌트) — [신약] [억부 火] [조후 水] [통관 木]
// ============================================================
function YongsinBadges({pillars, dayStem, compact=false, showAll=false}){
  const tcpaBase=calcTCPA(pillars);
  const ys=calcYongsin(pillars,tcpaBase.sBase);
  const sc5=strengthColor5(ys.strength);
  const fs=compact?"0.6rem":"0.68rem";
  const elFs=compact?"0.8rem":"0.9rem";
  return(
    <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
      {/* 신강/신약 */}
      <div style={{padding:"3px 9px",borderRadius:99,background:`${sc5}22`,border:`1px solid ${sc5}55`,fontSize:fs,fontWeight:700,color:sc5}}>{ys.strength}</div>
      {/* 억부용신 */}
      {ys.eobbu?.primary?(
        <div style={{display:"flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:99,background:`${EL_COL[ys.eobbu.primary]||C.gold}18`,border:`1.5px solid ${EL_COL[ys.eobbu.primary]||C.gold}55`}}>
          <span style={{fontSize:"0.5rem",color:C.muted}}>억부</span>
          <span style={{fontSize:elFs,fontFamily:"serif",fontWeight:900,color:EL_COL[ys.eobbu.primary]||C.gold}}>{ys.eobbu.primary}</span>
          {ys.isTrueYongsin&&<span style={{fontSize:"0.46rem",color:"#f5c842"}}>⭐</span>}
        </div>
      ):(
        <div style={{display:"flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:99,background:"rgba(255,255,255,0.05)",border:"1px dashed rgba(255,255,255,0.2)"}}>
          <span style={{fontSize:"0.5rem",color:C.muted}}>억부</span>
          <span style={{fontSize:"0.6rem",color:"rgba(255,255,255,0.3)"}}>없음</span>
        </div>
      )}
      {/* 조후용신 */}
      {ys.johu?.primary
        ? (showAll||ys.johu.primary!==ys.eobbu?.primary)
          ? <div style={{display:"flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:99,background:`${EL_COL[ys.johu.primary]||C.water}12`,border:`1.5px dashed ${EL_COL[ys.johu.primary]||C.water}55`}}>
              <span style={{fontSize:"0.5rem",color:C.muted}}>조후</span>
              <span style={{fontSize:elFs,fontFamily:"serif",fontWeight:900,color:EL_COL[ys.johu.primary]||C.water}}>{ys.johu.primary}</span>
            </div>
          : null
        : <div style={{display:"flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:99,background:"rgba(255,255,255,0.05)",border:"1px dashed rgba(255,255,255,0.2)"}}>
            <span style={{fontSize:"0.5rem",color:C.muted}}>조후</span>
            <span style={{fontSize:"0.6rem",color:"rgba(255,255,255,0.3)"}}>없음</span>
          </div>
      }
      {/* 통관용신 */}
      {ys.tongwan?.primary
        ? (showAll||(ys.tongwan.primary!==ys.eobbu?.primary&&ys.tongwan.primary!==ys.johu?.primary))
          ? <div style={{display:"flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:99,background:`${EL_COL[ys.tongwan.primary]||"#c084fc"}12`,border:`1.5px dotted ${EL_COL[ys.tongwan.primary]||"#c084fc"}55`}}>
              <span style={{fontSize:"0.5rem",color:C.muted}}>통관</span>
              <span style={{fontSize:elFs,fontFamily:"serif",fontWeight:900,color:EL_COL[ys.tongwan.primary]||"#c084fc"}}>{ys.tongwan.primary}</span>
            </div>
          : null
        : <div style={{display:"flex",alignItems:"center",gap:3,padding:"3px 9px",borderRadius:99,background:"rgba(255,255,255,0.05)",border:"1px dashed rgba(255,255,255,0.2)"}}>
            <span style={{fontSize:"0.5rem",color:C.muted}}>통관</span>
            <span style={{fontSize:"0.6rem",color:"rgba(255,255,255,0.3)"}}>없음</span>
          </div>
      }
      {/* 진용신 */}
      {ys.isTrueYongsin&&(
        <div style={{padding:"3px 8px",borderRadius:99,background:"rgba(245,200,66,0.12)",border:"1px solid rgba(245,200,66,0.4)",fontSize:"0.5rem",color:"#f5c842",fontWeight:700}}>진용신</div>
      )}
    </div>
  );
}
function SajuBoard({pillars, dayStem, showMulsang=true, selDaeun=null, selSeun=null}){
  const dayEl = HS_EL[HS.indexOf(dayStem)];
  const monthBranch = pillars[2].branch;
  const mh = showMulsang ? buildMulsangHeader(dayStem, monthBranch) : null;

  // 대운 필러 객체 생성
  const daeunPillar = selDaeun ? {
    stem: selDaeun.stem, branch: selDaeun.branch,
    stemIdx: selDaeun.stemIdx, branchIdx: selDaeun.branchIdx,
    label: "대운"
  } : null;
  // 세운 필러 객체 생성
  const seunPillar = selSeun ? {
    stem: selSeun.stem, branch: selSeun.branch,
    stemIdx: selSeun.stemIdx, branchIdx: selSeun.branchIdx,
    label: "세운"
  } : null;

  return (
    <div>
      {mh && <div style={{marginBottom:8,padding:"5px 10px",background:`${EL_COL[dayEl]}12`,borderRadius:8,textAlign:"center"}}><span style={{fontSize:"0.68rem",color:C.goldL,fontFamily:"'Noto Serif KR',serif"}}>{mh}</span></div>}
      <div style={{display:"flex",gap:6}}>
        {/* 세운 필러 — 대운 왼쪽 */}
        {seunPillar && (
          <PillarCard p={seunPillar} dayStem={dayStem} isHighlight accentColor={"#86efac"}/>
        )}
        {/* 대운 필러 — 시주 왼쪽 */}
        {daeunPillar && (
          <PillarCard p={daeunPillar} dayStem={dayStem} isHighlight accentColor={C.gold}/>
        )}
        {/* 원국 4주 */}
        {pillars.map((p,i)=><PillarCard key={i} p={p} dayStem={dayStem} isDay={i===1}/>)}
      </div>
    </div>
  );
}

// ============================================================
// 오행 오각형 (절반 크기)
// ============================================================
function Pentagon({pillars,dayStem,elementScores=null,strength=null,pillars2=null,compact=false}){
  const cnt1=elementScores||calcElementCount(pillars);
  const cnt2=pillars2?calcElementCount(pillars2):null;
  const currentStrength=strength||calcStrength(pillars);
  const dayEl=HS_EL[HS.indexOf(dayStem)];
  const BASE_ORDER=["木","火","土","金","水"],startIdx=Math.max(0,BASE_ORDER.indexOf(dayEl));
  const ORDER=[...BASE_ORDER.slice(startIdx),...BASE_ORDER.slice(0,startIdx)];
  const EC={水:C.water,木:C.wood,火:C.fire,土:C.earth,金:C.metal};
  // compact=true이면 작게, 아니면 기본
  const sz=compact?70:100,cx=sz,cy=sz,R=compact?42:58;
  const pts=ORDER.map((_,i)=>{const a=(i*72-90)*Math.PI/180;return{x:cx+R*Math.cos(a),y:cy+R*Math.sin(a)};});
  const max1=Math.max(...Object.values(cnt1),1);
  const makePath=(cnt,maxv)=>{const rp=ORDER.map((el,i)=>{const a=(i*72-90)*Math.PI/180,rr=8+(R-8)*((cnt[el]||0)/maxv);return{x:cx+rr*Math.cos(a),y:cy+rr*Math.sin(a)};});return rp.map((p,i)=>(i===0?"M":"L")+p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ")+"Z";};
  const rd1=makePath(cnt1,max1),rd2=cnt2?makePath(cnt2,Math.max(...Object.values(cnt2),1)):null;
  const strengthColor=strengthColor5(currentStrength);
  const total=sz*2;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
      <svg width="100%" viewBox={`0 0 ${total} ${total}`} style={{overflow:"visible",maxWidth:compact?140:200}}>
        <rect width={total} height={total} fill="#1e1508" rx="12"/>
        {[0.33,0.66,1.0].map((lv,gi)=>{const gp=ORDER.map((_,i)=>{const a=(i*72-90)*Math.PI/180,rr=(R-8)*lv+8;return{x:cx+rr*Math.cos(a),y:cy+rr*Math.sin(a)};});return<path key={gi} d={gp.map((p,i)=>(i===0?"M":"L")+p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ")+"Z"} fill="none" stroke="rgba(220,185,120,0.18)" strokeWidth={gi===2?1:0.5}/>;}) }
        {pts.map((p,i)=><line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(220,185,120,0.10)" strokeWidth="0.6"/>)}
        {rd2&&<path d={rd2} fill={`${C.water}0a`} stroke={C.water} strokeWidth="1.2" strokeOpacity="0.5" strokeDasharray="3 2"/>}
        <path d={rd1} fill={`${C.gold}08`} stroke={C.gold} strokeWidth="1.5" strokeOpacity="0.75"/>
        {ORDER.map((el,i)=>{const ratio=(cnt1[el]||0)/max1,r=8+(28-8)*ratio,isDay=el===dayEl,fs=compact?9:11;return(<g key={el}><circle cx={pts[i].x} cy={pts[i].y} r={r+3} fill={EC[el]} fillOpacity="0.04"/><circle cx={pts[i].x} cy={pts[i].y} r={r} fill={EC[el]} fillOpacity={0.15+ratio*0.5} stroke={isDay?EC[el]:"none"} strokeWidth={isDay?1.5:0}/><text x={pts[i].x} y={pts[i].y} textAnchor="middle" dominantBaseline="middle" fontSize={r>14?fs:fs-2} fontWeight="900" fontFamily="serif" fill={EC[el]}>{el}</text><text x={pts[i].x} y={pts[i].y+r+7} textAnchor="middle" fontSize={compact?"6":"7"} fill={EC[el]} fillOpacity="0.65">{(cnt1[el]||0).toFixed(1)}</text></g>);})}
        <circle cx={cx} cy={cy} r="10" fill={EC[dayEl]||C.gold} fillOpacity="0.15" stroke={EC[dayEl]||C.gold} strokeWidth="1.2"/>
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="900" fontFamily="serif" fill={EC[dayEl]||C.gold}>{dayStem}</text>
      </svg>
    </div>
  );
}

// 조후 통변 (기존 유지)
function JohuTab({pillars, johuDetail, selDaeun=null, selSeun=null, birthYear=1990, daeunList=[]}){
  // TCPA 점수 산출
  const tcpaBase = calcTCPA(pillars);
  const tcpaNow = calcTCPA(pillars, selDaeun?.stem, selDaeun?.branch, selSeun?.stem, selSeun?.branch);
  const lBase = tcpaLabel(tcpaBase.sBase);
  const lNow = tcpaLabel(tcpaNow.sTotal);

  // 습도 계산 — 대운/세운 지지 포함
  const humBase = calcHumidity(pillars);
  const humNowPillars = selDaeun||selSeun ? [
    ...pillars,
    ...(selDaeun?[{stem:selDaeun.stem,branch:selDaeun.branch,stemIdx:HS.indexOf(selDaeun.stem),branchIdx:EB.indexOf(selDaeun.branch)}]:[]),
    ...(selSeun?[{stem:selSeun.stem,branch:selSeun.branch,stemIdx:HS.indexOf(selSeun.stem),branchIdx:EB.indexOf(selSeun.branch)}]:[]),
  ] : pillars;
  const humNow = (selDaeun||selSeun) ? calcHumidity(humNowPillars) : humBase;
  const humMin=-20, humMax=20;
  const humVal = isNaN(humNow) ? 0 : Math.max(humMin, Math.min(humMax, humNow));
  const humPct = (humVal - humMin) / (humMax - humMin) * 100;
  const humColor = humVal > 2 ? "#4da0f0" : humVal < -2 ? "#d4a843" : "#4ade80";

  // 합산점수 7:3
  const combinedNow  = Math.round((tcpaNow.sTotal*0.7 + humVal*0.3)*100)/100;
  const combinedBase = Math.round((tcpaBase.sBase*0.7 + Math.max(-20,Math.min(20,humBase))*0.3)*100)/100;
  const combinedColor = combinedNow>4?"#fb923c":combinedNow<-4?"#4da0f0":"#4ade80";

  // 연도별 추이 — 합산 7:3
  const curYear = new Date().getFullYear();
  const trendYears = Array.from({length:7},(_,i)=>curYear-2+i);
  const gaugeMin=-20, gaugeMax=20;
  const trendData = trendYears.map(y=>{
    const sy = calcSeun(y);
    const rawTemp = y===curYear ? tcpaNow.sTotal : calcTCPA(pillars, selDaeun?.stem, selDaeun?.branch, sy.stem, sy.branch).sTotal;
    const rawHum = calcHumidity(pillars); // 원국 기준 고정
    const combined = Math.round((rawTemp*0.7 + Math.max(-20,Math.min(20,rawHum))*0.3)*100)/100;
    const val = Math.round(Math.max(gaugeMin, Math.min(gaugeMax, combined)) * 100) / 100;
    return{year:y, val, label:tcpaLabel(val)};
  });
  const gaugeVal = Math.max(gaugeMin, Math.min(gaugeMax, combinedNow));
  const gaugePct = (gaugeVal - gaugeMin) / (gaugeMax - gaugeMin) * 100;

  // 꺾은선 그래프 SVG
  const GW=300,GH=80,GPT=14,GPB=20,GPL=24,GPR=10;
  const gW2=GW-GPL-GPR, gH2=GH-GPT-GPB;
  const n=trendData.length;
  const xOf=i=>GPL+i*(gW2/(n-1));
  const yOf=v=>GPT+gH2*(1-(Math.max(gaugeMin,Math.min(gaugeMax,v))-gaugeMin)/(gaugeMax-gaugeMin));
  const pts=trendData.map((d,i)=>({x:xOf(i),y:yOf(d.val)}));
  function lp(pts){if(pts.length<2)return"";let d=`M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;for(let i=1;i<pts.length;i++){const p0=i>1?pts[i-2]:pts[i-1],p1=pts[i-1],p2=pts[i],p3=i<pts.length-1?pts[i+1]:p2;const cp1x=(p1.x+(p2.x-p0.x)*0.2).toFixed(1),cp1y=(p1.y+(p2.y-p0.y)*0.2).toFixed(1),cp2x=(p2.x-(p3.x-p1.x)*0.2).toFixed(1),cp2y=(p2.y-(p3.y-p1.y)*0.2).toFixed(1);d+=` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;}return d;}
  const linePath=lp(pts);
  const fillPath=linePath+` L${pts[n-1].x.toFixed(1)},${(GPT+gH2).toFixed(1)} L${pts[0].x.toFixed(1)},${(GPT+gH2).toFixed(1)}Z`;

  const msgs = getJohuMessages(tcpaNow.sTotal, humNow);
  const delta = (tcpaNow.sLuck||0) + (tcpaNow.sYear||0);
  const narrative = (selDaeun||selSeun) ? getJohuNarrative(tcpaBase.sBase, delta) : null;
  const johuYongsin = tcpaNow.sTotal<=-6?"火":tcpaNow.sTotal>=6?"水":null;

  // 온도×습도 9조합 레이블
  const tempZone = tcpaNow.sTotal<=-6?"한랭":tcpaNow.sTotal>=6?"과열":"균형";
  const humZone  = humVal<=-4?"건조":humVal>=4?"다습":"보통";
  const COMBO_LABEL={
    "한랭건조":{text:"한랭건조",emoji:"❄️🏜️",color:"#8040ff"},
    "한랭보통":{text:"한랭",    emoji:"❄️",    color:"#4da0f0"},
    "한랭다습":{text:"한랭다습",emoji:"❄️🌊",color:"#2080ff"},
    "균형건조":{text:"건조",    emoji:"🏜️",   color:"#d4a843"},
    "균형보통":{text:"최적",    emoji:"🌿",    color:"#4ade80"},
    "균형다습":{text:"과습",    emoji:"🌊",    color:"#4da0f0"},
    "과열건조":{text:"조열건조",emoji:"🔥🏜️",color:"#f55030"},
    "과열보통":{text:"과열",    emoji:"🔥",    color:"#fb923c"},
    "과열다습":{text:"과열다습",emoji:"🔥🌊",color:"#f87171"},
  };
  const comboKey=tempZone+humZone;
  const combo=COMBO_LABEL[comboKey]||{text:tempZone,emoji:"🌿",color:lNow.color};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {/* 조후점수 상태 카드 */}
      <Card>
        {/* 헤드 */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{fontSize:"2rem",lineHeight:1}}>{combo.emoji}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
              <div style={{fontSize:"1rem",fontWeight:900,color:combo.color,fontFamily:"'Noto Serif KR',serif"}}>{combo.text}</div>
              {johuYongsin&&(
                <div style={{display:"flex",alignItems:"center",gap:3,padding:"2px 9px",borderRadius:99,background:`${EL_COL[johuYongsin]}22`,border:`1.5px solid ${EL_COL[johuYongsin]}66`}}>
                  <span style={{fontSize:"0.5rem",color:EL_COL[johuYongsin],fontWeight:700}}>조후용신</span>
                  <span style={{fontSize:"0.9rem",fontFamily:"serif",color:EL_COL[johuYongsin],fontWeight:900}}>{johuYongsin}</span>
                </div>
              )}
            </div>
            <div style={{fontSize:"0.62rem",color:C.muted,marginTop:2}}>{lNow.sublabel} · 합산 <span style={{color:combinedColor,fontWeight:700}}>{combinedNow>0?"+":""}{combinedNow}</span></div>
            {msgs.climate&&<div style={{fontSize:"0.56rem",color:C.gold,marginTop:3,fontWeight:700}}>{msgs.climate}</div>}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"0.52rem",color:C.muted}}>원국기준</div>
            <div style={{fontSize:"0.72rem",color:lBase.color,fontWeight:700}}>{lBase.emoji} {combinedBase>0?"+":""}{combinedBase}</div>
          </div>
        </div>
        {/* 온도계 */}
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,alignItems:"center"}}>
            <span style={{fontSize:"0.52rem",color:"#8040ff"}}>☃️ -20</span>
            <span style={{fontSize:"0.58rem",color:C.muted,fontWeight:700}}>온도계 <span style={{color:lNow.color}}>{tcpaNow.sTotal>0?"+":""}{tcpaNow.sTotal}</span></span>
            <span style={{fontSize:"0.52rem",color:"#ff2020"}}>🌋 +20</span>
          </div>
          <div style={{position:"relative",height:16,borderRadius:99,background:"linear-gradient(to right,#8040ff,#4da0f0,#4ade80,#f5c842,#f55030,#ff2020)",overflow:"visible"}}>
            <div style={{position:"absolute",top:"50%",left:`${gaugePct}%`,transform:"translate(-50%,-50%)",width:18,height:18,borderRadius:"50%",background:"white",border:`3px solid ${lNow.color}`,boxShadow:`0 0 8px ${lNow.color}`,zIndex:2,transition:"left 0.8s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
            <span style={{fontSize:"0.45rem",color:C.muted}}>빙하</span>
            <span style={{fontSize:"0.45rem",color:C.muted}}>냉기</span>
            <span style={{fontSize:"0.45rem",color:"#4ade80",fontWeight:700}}>균형</span>
            <span style={{fontSize:"0.45rem",color:C.muted}}>열기</span>
            <span style={{fontSize:"0.45rem",color:C.muted}}>용암</span>
          </div>
        </div>
        {/* 습도계 */}
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,alignItems:"center"}}>
            <span style={{fontSize:"0.52rem",color:"#d4a843"}}>🏜️ -20</span>
            <span style={{fontSize:"0.58rem",color:C.muted,fontWeight:700}}>습도계 <span style={{color:humColor}}>{humVal>0?"+":""}{Math.round(humVal*10)/10}</span></span>
            <span style={{fontSize:"0.52rem",color:"#4da0f0"}}>🌊 +20</span>
          </div>
          <div style={{position:"relative",height:16,borderRadius:99,background:"linear-gradient(to right,#d4a843,#c8b87a,#4ade80,#7bc8ef,#4da0f0)",overflow:"visible"}}>
            <div style={{position:"absolute",top:"50%",left:`${humPct}%`,transform:"translate(-50%,-50%)",width:18,height:18,borderRadius:"50%",background:"white",border:`3px solid ${humColor}`,boxShadow:`0 0 8px ${humColor}`,zIndex:2,transition:"left 0.8s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
            <span style={{fontSize:"0.45rem",color:C.muted}}>사막</span>
            <span style={{fontSize:"0.45rem",color:C.muted}}>건조</span>
            <span style={{fontSize:"0.45rem",color:"#4ade80",fontWeight:700}}>균형</span>
            <span style={{fontSize:"0.45rem",color:C.muted}}>습윤</span>
            <span style={{fontSize:"0.45rem",color:C.muted}}>우림</span>
          </div>
        </div>
        {/* 점수 분해 — 온도 */}
        <div style={{display:"flex",gap:6,padding:"8px 10px",borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",marginBottom:5}}>
          <div style={{fontSize:"0.44rem",color:C.muted,alignSelf:"center",minWidth:20}}>🌡️</div>
          <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:"0.44rem",color:C.muted,marginBottom:2}}>원국</div><div style={{fontSize:"0.82rem",fontWeight:700,color:lBase.color}}>{tcpaBase.sBase>0?"+":""}{tcpaBase.sBase}</div></div>
          <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:"0.44rem",color:C.gold,marginBottom:2}}>대운</div><div style={{fontSize:"0.82rem",fontWeight:700,color:selDaeun?C.gold:C.muted}}>{selDaeun?(tcpaNow.sLuck>0?"+":"")+tcpaNow.sLuck:"—"}</div></div>
          <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:"0.44rem",color:"#86efac",marginBottom:2}}>세운</div><div style={{fontSize:"0.82rem",fontWeight:700,color:selSeun?"#86efac":C.muted}}>{selSeun?(tcpaNow.sYear>0?"+":"")+tcpaNow.sYear:"—"}</div></div>
          <div style={{flex:1,textAlign:"center",borderLeft:"1px solid rgba(255,255,255,0.1)",paddingLeft:6}}><div style={{fontSize:"0.44rem",color:C.muted,marginBottom:2}}>합계</div><div style={{fontSize:"0.9rem",fontWeight:900,color:lNow.color}}>{tcpaNow.sTotal>0?"+":""}{tcpaNow.sTotal}</div></div>
        </div>
        {/* 점수 분해 — 습도 */}
        <div style={{display:"flex",gap:6,padding:"8px 10px",borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{fontSize:"0.44rem",color:C.muted,alignSelf:"center",minWidth:20}}>💧</div>
          <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:"0.44rem",color:C.muted,marginBottom:2}}>원국</div><div style={{fontSize:"0.82rem",fontWeight:700,color:humColor}}>{isNaN(humBase)?"-":(humBase>0?"+":"")+Math.round(humBase*10)/10}</div></div>
          <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:"0.44rem",color:C.gold,marginBottom:2}}>대운</div><div style={{fontSize:"0.82rem",fontWeight:700,color:selDaeun?C.gold:C.muted}}>{selDaeun?(()=>{const v=Math.round((HUM_V_BRANCH[selDaeun.branch]||0)*0.5*10)/10;return(v>0?"+":"")+v;})():"—"}</div></div>
          <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:"0.44rem",color:"#86efac",marginBottom:2}}>세운</div><div style={{fontSize:"0.82rem",fontWeight:700,color:selSeun?"#86efac":C.muted}}>{selSeun?(()=>{const v=Math.round((HUM_V_BRANCH[selSeun.branch]||0)*0.5*10)/10;return(v>0?"+":"")+v;})():"—"}</div></div>
          <div style={{flex:1,textAlign:"center",borderLeft:"1px solid rgba(255,255,255,0.1)",paddingLeft:6}}><div style={{fontSize:"0.44rem",color:C.muted,marginBottom:2}}>합산 <span style={{opacity:0.6}}>7:3</span></div><div style={{fontSize:"0.9rem",fontWeight:900,color:isNaN(combinedNow)?C.muted:combinedColor}}>{isNaN(combinedNow)?"-":(combinedNow>0?"+":"")+combinedNow}</div></div>
        </div>
      </Card>
      {/* 패턴 서사 태그 */}
      {narrative&&(
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:99,background:`${narrative.color}18`,border:`1px solid ${narrative.color}40`,alignSelf:"flex-start"}}>
          <span style={{fontSize:"0.62rem",fontWeight:700,color:narrative.color}}>{narrative.tag}</span>
          <span style={{fontSize:"0.52rem",color:C.muted}}>원국 {tcpaBase.sBase>0?"+":""}{tcpaBase.sBase} · 운 변화 {delta>0?"+":""}{Math.round(delta*100)/100}</span>
        </div>
      )}
      {/* 4카드: 업무/재정/관계/건강 */}
      {[
        {icon:"💼",label:"업무 · 실행",text:narrative?narrative.work:msgs.work,color:narrative?narrative.color:lNow.color},
        {icon:"💰",label:"재정 · 소비",text:narrative?narrative.finance:msgs.finance,color:"#f5c842"},
        {icon:"🤝",label:"관계 · 소통",text:narrative?narrative.relation:msgs.relation,color:"#86efac"},
        {icon:"❤️",label:"건강",text:narrative?narrative.health:msgs.health,color:"#fb923c"},
      ].map(({icon,label,text,color},i)=>(
        <Card key={i}>
          <div style={{display:"flex",gap:10}}>
            <span style={{fontSize:"1.2rem",flexShrink:0,lineHeight:1.4}}>{icon}</span>
            <div>
              <div style={{fontSize:"0.62rem",fontWeight:700,color,marginBottom:5,letterSpacing:"0.08em"}}>{label}</div>
              <div style={{fontSize:"0.7rem",color:"rgba(240,220,180,0.90)",lineHeight:1.75,fontFamily:"'Noto Serif KR',serif"}}>{text}</div>
            </div>
          </div>
        </Card>
      ))}
      {/* 연도별 조후 추이 */}
      <Card>
        <CardTitle style={{marginBottom:8}}>연도별 조후점수 추이 <span style={{fontSize:"0.48rem",color:C.muted,fontWeight:400}}>온도/습도 7:3 합산</span></CardTitle>
        <svg width="100%" viewBox={`0 0 ${GW} ${GH}`} style={{overflow:"visible"}}>
          <defs>
            <linearGradient id="johugrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lNow.color} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={lNow.color} stopOpacity="0.02"/>
            </linearGradient>
          </defs>
          <line x1={GPL} y1={yOf(0)} x2={GW-GPR} y2={yOf(0)} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4,3"/>
          <text x={GPL-3} y={yOf(0)} textAnchor="end" fontSize="7" fill="rgba(255,255,255,0.3)" dominantBaseline="middle">0</text>
          {[5,-5,10,-10].map(v=>(
            <line key={v} x1={GPL} y1={yOf(v)} x2={GW-GPR} y2={yOf(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2,4"/>
          ))}
          <path d={fillPath} fill="url(#johugrad)"/>
          <path d={linePath} fill="none" stroke={lNow.color} strokeWidth="2" strokeLinecap="round" opacity="0.85"/>
          {trendData.map((d,i)=>{
            const col=tcpaLabel(d.val).color;
            const isNow=d.year===curYear;
            return(
              <g key={i}>
                <circle cx={pts[i].x} cy={pts[i].y} r={isNow?5:3.5} fill={col} stroke="rgba(0,0,0,0.3)" strokeWidth="1.2"/>
                {isNow&&<circle cx={pts[i].x} cy={pts[i].y} r="8" fill="none" stroke={col} strokeWidth="1" strokeOpacity="0.4"/>}
                <text x={pts[i].x} y={pts[i].y-(isNow?10:8)} textAnchor="middle" fontSize={isNow?"8":"7"} fill={col} fontWeight={isNow?"bold":"normal"}>{d.val>0?"+":""}{d.val}</text>
                <text x={pts[i].x} y={GPT+gH2+12} textAnchor="middle" fontSize="7" fill={isNow?C.goldL:"rgba(220,185,120,0.5)"} fontWeight={isNow?"bold":"normal"}>{d.year}</text>
              </g>
            );
          })}
        </svg>
      </Card>
    </div>
  );
}

function DaeunPanel({daeunList,birthYear,selDaeun,setSelDaeun}){
  const curYear=new Date().getFullYear(),age=curYear-birthYear;
  return(
    <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4}}>
      {daeunList.map((d,i)=>{const isNow=d.startAge<=age&&age<d.startAge+10,isSel=selDaeun?.startYear===d.startYear;return(
        <button key={i} onClick={()=>setSelDaeun(isSel?null:d)} style={{flexShrink:0,width:54,borderRadius:12,padding:"6px 3px 5px",textAlign:"center",background:isSel?`${C.gold}28`:"#2e1e0e",border:isSel?`1.5px solid ${C.gold}70`:"1.5px solid rgba(255,255,255,0.14)",cursor:"pointer",position:"relative"}}>
          {isNow&&<div style={{position:"absolute",top:4,right:4,width:5,height:5,borderRadius:"50%",background:"#4ade80"}}/>}
          <div style={{fontSize:"1.4rem",color:EL_COL[HS_EL[d.stemIdx]],fontFamily:"serif",lineHeight:1}}>{d.stem}</div>
          <div style={{fontSize:"1.4rem",color:EL_COL[EB_EL[d.branchIdx]],fontFamily:"serif",lineHeight:1}}>{d.branch}</div>
          <div style={{fontSize:"0.42rem",color:isSel?C.gold:C.muted,marginTop:2}}>{d.startAge}세</div>
          <div style={{fontSize:"0.38rem",color:C.muted}}>{d.startYear}~</div>
        </button>
      );})}
    </div>
  );
}

const GRADE_VALUE={S:95,"A+":85,A:80,B:60,C:30};
function LifeGraph({daeunList,pillars,dayStem,birthYear,selDaeun,setSelDaeun}){
  if(!daeunList.length)return <p style={{fontSize:"0.75rem",color:C.muted,padding:"14px 0"}}>표시할 대운이 없습니다. 성별과 계산 기준을 확인해주세요.</p>;
  const grades=daeunList.map(d=>({...d,g:calcDaeunGrade(pillars,dayStem,d.stem,d.branch)}));
  const vals=grades.map(g=>GRADE_VALUE[g.g.grade]??50);
  const curYear=new Date().getFullYear(),curAge=curYear-birthYear;
  const W=320,H=120,PL=14,PR=14,PT=16,PB=28,gW=W-PL-PR,gH=H-PT-PB,n=grades.length;
  const xOf=i=>n<2?W/2:PL+i*(gW/(n-1)),yOf=v=>PT+gH*(1-(v-20)/80);
  const pts=vals.map((v,i)=>({x:xOf(i),y:yOf(v)}));
  function bezierPath(pts){if(pts.length<2)return "";let d=`M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;for(let i=0;i<pts.length-1;i++){const p0=i>0?pts[i-1]:pts[i],p1=pts[i],p2=pts[i+1],p3=i+2<pts.length?pts[i+2]:p2;const cp1x=(p1.x+(p2.x-p0.x)*0.2).toFixed(1),cp1y=(p1.y+(p2.y-p0.y)*0.2).toFixed(1),cp2x=(p2.x-(p3.x-p1.x)*0.2).toFixed(1),cp2y=(p2.y-(p3.y-p1.y)*0.2).toFixed(1);d+=` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;}return d;}
  const linePath=bezierPath(pts),fillPath=linePath+` L ${pts[n-1].x.toFixed(1)} ${(PT+gH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(PT+gH).toFixed(1)} Z`;
  const nowIdx=grades.findIndex(d=>d.startAge<=curAge&&curAge<d.startAge+10),selIdx=selDaeun?grades.findIndex(d=>d.startYear===selDaeun.startYear):-1;
  const gc={S:"#f5c842","A+":"#4ade80",A:"#86efac",B:C.gold,C:"#fb923c"};
  return(
    <div style={{width:"100%"}}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
        <defs><linearGradient id="lgraph" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity="0.35"/><stop offset="100%" stopColor={C.gold} stopOpacity="0.02"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        {[{v:90,l:"S"},{v:75,l:"A"},{v:55,l:"B"},{v:35,l:"C"}].map(({v,l})=><g key={l}><line x1={PL} y1={yOf(v)} x2={W-PR} y2={yOf(v)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3,4"/><text x={PL-4} y={yOf(v)} textAnchor="end" fontSize="7" fill="rgba(220,185,120,0.4)" dominantBaseline="middle">{l}</text></g>)}
        {nowIdx>=0&&<line x1={pts[nowIdx].x} y1={PT} x2={pts[nowIdx].x} y2={PT+gH} stroke="#4ade80" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3,3"/>}
        <path d={fillPath} fill="url(#lgraph)"/>
        <path d={linePath} fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" filter="url(#glow)" opacity="0.85"/>
        {grades.map((g,i)=>{const c=gc[g.g.grade]||C.gold,isSel=selIdx===i,isNow=nowIdx===i;return(<g key={i} style={{cursor:"pointer"}} onClick={()=>setSelDaeun(g.startYear===selDaeun?.startYear?null:g)}>{(isSel||isNow)&&<circle cx={pts[i].x} cy={pts[i].y} r="12" fill={c} fillOpacity="0.12" stroke={c} strokeWidth="1" strokeOpacity="0.4"/>}<circle cx={pts[i].x} cy={pts[i].y} r={isSel?6:4} fill={c} stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/><text x={pts[i].x} y={pts[i].y-9} textAnchor="middle" fontSize={isSel?9:7} fill={c} fontWeight={isSel?"bold":"normal"} opacity={isSel?1:0.8}>{g.g.grade}</text><text x={pts[i].x} y={PT+gH+10} textAnchor="middle" fontSize="7.5" fill={isSel?C.goldL:"rgba(220,185,120,0.55)"}>{g.stem}{g.branch}</text><text x={pts[i].x} y={PT+gH+19} textAnchor="middle" fontSize="6" fill="rgba(220,185,120,0.35)">{g.startAge}세</text></g>);})}
        {nowIdx>=0&&<circle cx={pts[nowIdx].x} cy={pts[nowIdx].y} r="3" fill="#4ade80" opacity="0.9"/>}
      </svg>
    </div>
  );
}

function PhysImageCard({title,prompt,dayStem,label,note}){
  const[url,setUrl]=useState(null),[status,setStatus]=useState("idle"),[prog,setProg]=useState(0),[progMsg,setProgMsg]=useState(""),[err,setErr]=useState("");
  const elColor=EL_COL[HS_EL[HS.indexOf(dayStem)]]||C.gold;
  async function generate(){setStatus("loading");setErr("");setProg(0);try{const imgUrl=await generateImage(prompt,(p,m)=>{setProg(p);setProgMsg(m);});setUrl(imgUrl);setStatus("done");}catch(e){setErr(e.message);setStatus("error");}}
  async function save(){if(!url)return;try{const res=await fetch(url);const blob=await res.blob();const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`saju-${label}-${Date.now()}.webp`;a.click();}catch{window.open(url,"_blank");}}
  return(
    <div style={{borderRadius:16,overflow:"hidden",background:"#1e1508",border:"1px solid rgba(210,175,100,0.22)"}}>
      <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(255,255,255,0.10)",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
        <div><div style={{fontSize:"0.72rem",fontWeight:700,color:C.goldL,fontFamily:"'Noto Serif KR',serif"}}>{title}</div>{note&&<div style={{fontSize:"0.56rem",color:C.muted,marginTop:2}}>{note}</div>}</div>
        {status==="done"&&url&&<button onClick={save} style={{flexShrink:0,padding:"4px 10px",borderRadius:8,background:`${C.gold}15`,border:`1px solid ${C.gold}30`,color:C.gold,fontSize:"0.6rem",fontWeight:700,cursor:"pointer"}}>⬇ 저장</button>}
      </div>
      {status==="idle"&&<div style={{height:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}><div style={{fontSize:40,fontFamily:"serif",color:elColor,opacity:0.25,animation:"float 3s ease-in-out infinite"}}>{dayStem}</div><button onClick={generate} style={{padding:"10px 22px",borderRadius:12,background:`${elColor}18`,color:elColor,border:`1px solid ${elColor}40`,cursor:"pointer",fontSize:"0.78rem",fontWeight:700}}>🎬 이미지 생성</button></div>}
      {status==="loading"&&<div style={{height:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,padding:"1.5rem"}}><div style={{fontSize:28,color:elColor,opacity:0.35,fontFamily:"serif",animation:"shimmer 1.5s ease infinite"}}>{dayStem}</div><div style={{width:"100%",maxWidth:180}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:"0.6rem",color:C.muted}}>{progMsg}</span><span style={{fontSize:"0.65rem",fontWeight:700,color:elColor}}>{prog}%</span></div><div style={{height:4,borderRadius:99,background:"rgba(220,185,120,0.14)"}}><div style={{height:"100%",borderRadius:99,background:elColor,width:`${prog}%`,transition:"width 0.4s ease"}}/></div></div></div>}
      {status==="done"&&url&&<img src={url} alt={title} style={{width:"100%",display:"block"}}/>}
      {status==="error"&&<div style={{height:160,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,padding:"1rem"}}><p style={{color:"#ff6a50",fontSize:"0.68rem",margin:0,textAlign:"center"}}>⚠ {err}</p><button onClick={generate} style={{padding:"7px 14px",borderRadius:10,background:`${C.gold}10`,color:C.gold,border:`1px solid ${C.gold}25`,cursor:"pointer",fontSize:"0.7rem"}}>↺ 다시 시도</button></div>}
    </div>
  );
}

// 시뮬레이터 초소형 균일 필러 (오행세력도 옆 4열용)
function MiniPillarCell({p, dayStem, label, isDay=false, accentColor=null}){
  const sc=EL_COL[HS_EL[p.stemIdx]]||C.gold;
  const bc=EL_COL[EB_EL[p.branchIdx]]||C.gold;
  const ss=isDay?"본원":getSS(dayStem,p.stem);
  const bonStem=EBH[p.branch]?.bon?.[0];
  const branchSS=bonStem?getSS(dayStem,bonStem):"";
  const hid=EBH[p.branch]||{};
  const hidItems=[hid.yo,hid.jung,hid.bon].filter(Boolean);
  const uns=dayStem?getUnsung(dayStem,p.branch):"";
  const acc=accentColor;
  const stemBg=isDay?"#2c3e6b":acc?`${acc}18`:"rgba(255,255,255,0.06)";
  const branchBg=isDay?"#2c6b3a":acc?`${acc}10`:"rgba(0,0,0,0.18)";
  const bdr=isDay?"#4a90d9":acc||"rgba(255,255,255,0.1)";
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,minWidth:0}}>
      <div style={{fontSize:"0.52rem",fontWeight:700,color:isDay?"#7ab8ff":acc||C.muted}}>{label}</div>
      <div style={{fontSize:"0.46rem",color:isDay?"#7ab8ff":C.muted,background:"rgba(255,255,255,0.06)",borderRadius:4,padding:"0px 3px",marginBottom:1}}>{ss}</div>
      <div style={{width:"100%",padding:"4px 1px",borderRadius:7,background:stemBg,border:`1.5px solid ${bdr}`,textAlign:"center"}}>
        <div style={{fontSize:"1.3rem",lineHeight:1,color:sc,fontFamily:"'Noto Serif KR',serif",fontWeight:KANJI_YANG[p.stem]?900:300}}>{p.stem}</div>
        <div style={{fontSize:"0.44rem",color:sc,fontWeight:700}}>{HS_EL[p.stemIdx]}</div>
      </div>
      <div style={{width:"100%",padding:"4px 1px",borderRadius:7,background:branchBg,border:`1.5px solid ${isDay?"#4aaa6b55":acc?`${acc}35`:"rgba(255,255,255,0.08)"}`,textAlign:"center"}}>
        <div style={{fontSize:"1.3rem",lineHeight:1,color:bc,fontFamily:"'Noto Serif KR',serif",fontWeight:KANJI_YANG[p.branch]?900:300}}>{p.branch}</div>
        <div style={{fontSize:"0.44rem",color:bc,fontWeight:700}}>{EB_EL[p.branchIdx]}</div>
      </div>
      {branchSS&&<div style={{fontSize:"0.46rem",fontWeight:700,color:isDay?"#4aaa6b":C.muted,background:"rgba(255,255,255,0.05)",borderRadius:4,padding:"0px 3px"}}>{branchSS}</div>}
      <div style={{display:"flex",gap:1,justifyContent:"center",flexWrap:"wrap"}}>
        {hidItems.map(([stem,days],j)=>{const hsc=EL_COL[HS_EL[HS.indexOf(stem)]]||C.gold;return<span key={j} style={{fontSize:"0.48rem",color:hsc,fontFamily:"serif",fontWeight:700,background:`${hsc}12`,padding:"0 2px",borderRadius:3}}>{stem}</span>;})}
      </div>
      {uns&&<div style={{fontSize:"0.46rem",fontWeight:700,color:bc,background:`${bc}14`,borderRadius:4,padding:"0px 4px"}}>{uns}</div>}
    </div>
  );
}

// 시뮬레이터 전용 균일 너비 필러 (grid 안에서 사용)
function SimPillarCell({p, dayStem, label, isDay=false, accentColor=null, isAdj=false}){
  const sc=EL_COL[HS_EL[p.stemIdx]]||C.gold;
  const bc=EL_COL[EB_EL[p.branchIdx]]||C.gold;
  const ss=isDay?"본원":getSS(dayStem,p.stem);
  const bonStem=EBH[p.branch]?.bon?.[0];
  const branchSS=bonStem?getSS(dayStem,bonStem):"";
  const hid=EBH[p.branch]||{};
  const hidItems=[hid.yo,hid.jung,hid.bon].filter(Boolean);
  const uns=dayStem?getUnsung(dayStem,p.branch):"";
  const accent=accentColor||null;
  const stemBg=isDay?"#2c3e6b":accent?`${accent}20`:"rgba(255,255,255,0.07)";
  const branchBg=isDay?"#2c6b3a":accent?`${accent}14`:"rgba(0,0,0,0.2)";
  const borderC=isDay?"#4a90d9":accent||"rgba(255,255,255,0.12)";
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:0}}>
      <div style={{fontSize:"0.72rem",fontWeight:700,color:isDay?"#7ab8ff":accent||C.muted,letterSpacing:"0.06em"}}>{label}</div>
      <div style={{fontSize:"0.62rem",color:isDay?"#7ab8ff":C.muted,background:"rgba(255,255,255,0.07)",borderRadius:5,padding:"1px 6px"}}>{ss}</div>
      {/* 천간 */}
      <div style={{width:"100%",padding:"8px 2px",borderRadius:12,background:stemBg,border:`2px solid ${borderC}`,textAlign:"center"}}>
        <div style={{fontSize:"2rem",lineHeight:1,color:sc,fontFamily:"'Noto Serif KR',serif",fontWeight:KANJI_YANG[p.stem]?900:300}}>{p.stem}</div>
        <div style={{fontSize:"0.58rem",color:sc,fontWeight:700}}>{HS_EL[p.stemIdx]}</div>
      </div>
      {/* 지지 */}
      <div style={{width:"100%",padding:"8px 2px",borderRadius:12,background:branchBg,border:`2px solid ${isDay?"#4aaa6b55":accent?`${accent}44`:"rgba(255,255,255,0.09)"}`,textAlign:"center"}}>
        <div style={{fontSize:"2rem",lineHeight:1,color:bc,fontFamily:"'Noto Serif KR',serif",fontWeight:KANJI_YANG[p.branch]?900:300}}>{p.branch}</div>
        <div style={{fontSize:"0.58rem",color:bc,fontWeight:700}}>{EB_EL[p.branchIdx]}</div>
      </div>
      {branchSS&&<div style={{fontSize:"0.6rem",fontWeight:700,color:isDay?"#4aaa6b":C.muted,background:"rgba(255,255,255,0.06)",borderRadius:5,padding:"1px 6px"}}>{branchSS}</div>}
      {/* 지장간 */}
      <div style={{display:"flex",gap:2,justifyContent:"center",flexWrap:"wrap"}}>
        {hidItems.map(([stem,days],j)=>{const hsc=EL_COL[HS_EL[HS.indexOf(stem)]]||C.gold;return<div key={j} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"1px 3px",borderRadius:4,background:`${hsc}15`}}><span style={{fontSize:"0.65rem",color:hsc,fontFamily:"serif",fontWeight:700}}>{stem}</span><span style={{fontSize:"0.38rem",color:hsc,opacity:0.7}}>{days}일</span></div>;})}
      </div>
      {uns&&<div style={{fontSize:"0.6rem",fontWeight:700,color:bc,background:`${bc}15`,borderRadius:5,padding:"1px 7px"}}>{uns}</div>}
    </div>
  );
}

// ============================================================
// ============================================================
// 이름 검사 엔진
// ============================================================
// 불용문자 유형별 블랙리스트
// ============================================================
// 성씨 한자 DB (API 없이 즉시 조회)
// ============================================================
const SURNAME_DB={
  "김":[{hanja:"金",char_oheng:"金",sound_oheng:"木",common:true}],
  "이":[{hanja:"李",char_oheng:"木",sound_oheng:"土",common:true},{hanja:"異",char_oheng:"土",sound_oheng:"土",common:false}],
  "박":[{hanja:"朴",char_oheng:"木",sound_oheng:"水",common:true}],
  "최":[{hanja:"崔",char_oheng:"土",sound_oheng:"金",common:true}],
  "정":[{hanja:"鄭",char_oheng:"土",sound_oheng:"金",common:true},{hanja:"丁",char_oheng:"火",sound_oheng:"金",common:false}],
  "강":[{hanja:"姜",char_oheng:"木",sound_oheng:"木",common:true},{hanja:"康",char_oheng:"木",sound_oheng:"木",common:false}],
  "조":[{hanja:"趙",char_oheng:"火",sound_oheng:"金",common:true},{hanja:"曺",char_oheng:"火",sound_oheng:"金",common:true},{hanja:"調",char_oheng:"木",sound_oheng:"金",common:false}],
  "윤":[{hanja:"尹",char_oheng:"金",sound_oheng:"土",common:true}],
  "장":[{hanja:"張",char_oheng:"木",sound_oheng:"金",common:true},{hanja:"蔣",char_oheng:"木",sound_oheng:"金",common:false}],
  "임":[{hanja:"林",char_oheng:"木",sound_oheng:"水",common:true},{hanja:"任",char_oheng:"木",sound_oheng:"水",common:false}],
  "한":[{hanja:"韓",char_oheng:"火",sound_oheng:"土",common:true}],
  "오":[{hanja:"吳",char_oheng:"土",sound_oheng:"土",common:true}],
  "서":[{hanja:"徐",char_oheng:"火",sound_oheng:"金",common:true}],
  "신":[{hanja:"申",char_oheng:"土",sound_oheng:"金",common:true},{hanja:"辛",char_oheng:"金",sound_oheng:"金",common:false}],
  "권":[{hanja:"權",char_oheng:"木",sound_oheng:"木",common:true}],
  "황":[{hanja:"黃",char_oheng:"土",sound_oheng:"土",common:true}],
  "안":[{hanja:"安",char_oheng:"土",sound_oheng:"土",common:true}],
  "송":[{hanja:"宋",char_oheng:"土",sound_oheng:"金",common:true}],
  "류":[{hanja:"柳",char_oheng:"木",sound_oheng:"火",common:true}],
  "유":[{hanja:"柳",char_oheng:"木",sound_oheng:"土",common:true},{hanja:"兪",char_oheng:"木",sound_oheng:"土",common:false}],
  "전":[{hanja:"全",char_oheng:"金",sound_oheng:"金",common:true},{hanja:"田",char_oheng:"土",sound_oheng:"金",common:false}],
  "홍":[{hanja:"洪",char_oheng:"水",sound_oheng:"土",common:true}],
  "고":[{hanja:"高",char_oheng:"土",sound_oheng:"木",common:true}],
  "문":[{hanja:"文",char_oheng:"木",sound_oheng:"水",common:true}],
  "손":[{hanja:"孫",char_oheng:"水",sound_oheng:"金",common:true}],
  "양":[{hanja:"梁",char_oheng:"木",sound_oheng:"土",common:true},{hanja:"楊",char_oheng:"木",sound_oheng:"土",common:false}],
  "배":[{hanja:"裵",char_oheng:"木",sound_oheng:"水",common:true}],
  "백":[{hanja:"白",char_oheng:"金",sound_oheng:"水",common:true}],
  "허":[{hanja:"許",char_oheng:"木",sound_oheng:"土",common:true}],
  "남":[{hanja:"南",char_oheng:"火",sound_oheng:"火",common:true}],
  "심":[{hanja:"沈",char_oheng:"水",sound_oheng:"金",common:true}],
  "노":[{hanja:"盧",char_oheng:"土",sound_oheng:"火",common:true},{hanja:"魯",char_oheng:"水",sound_oheng:"火",common:false}],
  "하":[{hanja:"河",char_oheng:"水",sound_oheng:"土",common:true}],
  "곽":[{hanja:"郭",char_oheng:"土",sound_oheng:"木",common:true}],
  "성":[{hanja:"成",char_oheng:"金",sound_oheng:"金",common:true}],
  "차":[{hanja:"車",char_oheng:"火",sound_oheng:"金",common:true}],
  "주":[{hanja:"朱",char_oheng:"木",sound_oheng:"金",common:true}],
  "우":[{hanja:"禹",char_oheng:"土",sound_oheng:"土",common:true}],
  "구":[{hanja:"具",char_oheng:"金",sound_oheng:"木",common:true}],
  "민":[{hanja:"閔",char_oheng:"木",sound_oheng:"水",common:true}],
  "나":[{hanja:"羅",char_oheng:"木",sound_oheng:"火",common:true}],
  "진":[{hanja:"陳",char_oheng:"土",sound_oheng:"金",common:true}],
  "엄":[{hanja:"嚴",char_oheng:"土",sound_oheng:"土",common:true}],
  "채":[{hanja:"蔡",char_oheng:"木",sound_oheng:"金",common:true}],
  "원":[{hanja:"元",char_oheng:"木",sound_oheng:"土",common:true}],
  "방":[{hanja:"方",char_oheng:"木",sound_oheng:"水",common:true}],
  "변":[{hanja:"卞",char_oheng:"木",sound_oheng:"水",common:true}],
  "여":[{hanja:"呂",char_oheng:"土",sound_oheng:"土",common:true}],
  "추":[{hanja:"秋",char_oheng:"木",sound_oheng:"金",common:true}],
  "도":[{hanja:"都",char_oheng:"土",sound_oheng:"火",common:true}],
  "석":[{hanja:"石",char_oheng:"土",sound_oheng:"金",common:true}],
  "선":[{hanja:"宣",char_oheng:"土",sound_oheng:"金",common:true}],
  "마":[{hanja:"馬",char_oheng:"火",sound_oheng:"水",common:true}],
  "길":[{hanja:"吉",char_oheng:"土",sound_oheng:"木",common:true}],
  "지":[{hanja:"池",char_oheng:"水",sound_oheng:"金",common:true}],
  "형":[{hanja:"邢",char_oheng:"土",sound_oheng:"土",common:true}],
  "공":[{hanja:"孔",char_oheng:"水",sound_oheng:"木",common:true}],
  "현":[{hanja:"玄",char_oheng:"水",sound_oheng:"土",common:true}],
  "함":[{hanja:"咸",char_oheng:"土",sound_oheng:"土",common:true}],
  "염":[{hanja:"廉",char_oheng:"木",sound_oheng:"土",common:true}],
  "천":[{hanja:"千",char_oheng:"土",sound_oheng:"金",common:true}],
  "탁":[{hanja:"卓",char_oheng:"土",sound_oheng:"火",common:true}],
  "반":[{hanja:"潘",char_oheng:"水",sound_oheng:"水",common:true}],
  "봉":[{hanja:"奉",char_oheng:"木",sound_oheng:"水",common:true}],
  "황보":[{hanja:"皇甫",char_oheng:"土",sound_oheng:"土",common:true}],
  "남궁":[{hanja:"南宮",char_oheng:"火",sound_oheng:"火",common:true}],
  "제갈":[{hanja:"諸葛",char_oheng:"木",sound_oheng:"金",common:true}],
  "독고":[{hanja:"獨孤",char_oheng:"水",sound_oheng:"火",common:true}],
};
function lookupSurname(hangul){
  return SURNAME_DB[hangul]||null;
}
const BLYONG_LIST={
  거대자연물:"山海川河湖江太",
  천체자연현상:"天地日月星光雲風雨雪",
  계절시간:"春夏秋冬",
  부정적의미:"悲苦亡死病暗禍災厄",
  왕황실:"皇帝王后妃太子",
  종교신격:"神佛仙聖",
  짐승비하:"犬豚馬牛猿豕",
};
// 욕설/비속어 발음 블랙리스트 (초성+중성 패턴)
const SLUR_SYLLABLES=["씨","발","놈","년","새","끼","미","친","개","쌍","색","쓰","눔","잡","보","지","창","뇨","병","신","꺼","졌","좆","보","자","쭤"];
// 발음오행 매핑
const SOUND_OHENG={ㄱ:"木",ㄲ:"木",ㅋ:"木",ㄴ:"火",ㄷ:"火",ㄹ:"火",ㅌ:"火",ㅇ:"土",ㅎ:"土",ㅅ:"金",ㅆ:"金",ㅈ:"金",ㅊ:"金",ㅁ:"水",ㅂ:"水",ㅍ:"水"};
const SOUND_OHENG_CHO={木:"ㄱㄲㅋ",火:"ㄴㄷㄹㅌ",土:"ㅇㅎ",金:"ㅅㅆㅈㅊ",水:"ㅁㅂㅍ"};
// 자원오행 — 이름용 한자 부수별 (확장판)
const CHAR_OHENG_MAP={
  木:["木","林","森","枝","根","桂","松","梅","桃","柱","樹","植","草","花","芽","葉","莫","荷","蓮","菊",
      "棟","榮","楠","楓","柏","椿","槿","樺","橋","桑","棠","杏","李","栗","棉","柔","柳","桐","楷","模",
      "橡","楊","榆","槐","櫻","柿","梨","棗","橘","橙","檀","楸","橄","楝","樟","檜","楮","梓","榛","棕",
      "枚","柄","架","棚","棺","槨","榻","楊","穗","禾","秀","穎","稼","穰","稔","穗","苗","茂","荊","蔓",
      "蒼","翠","茵","茗","茹","茸","芙","芬","芳","芝","芸","芹","苑","苒","苓","苔","莊","莖","萬","葛",
      "葦","蒲","蓁","蓮","蔚","蕙","蕾","薇","薰","藍","藤","藕","蘭","蘿","艾","艷","菁","菊","菖","菱"],
  火:["火","炎","熱","光","日","明","炳","燦","燈","照","炫","煥","熙","炅","旭","昇","晴","晨","暉","煜",
      "燁","燦","燧","燮","熹","熺","燿","爀","炫","炬","烽","烈","烘","焰","焱","煌","煊","煦","煥","熙",
      "灼","炤","炡","炢","炣","炰","烜","烝","烟","煙","熏","燻","爍","爐","爛","爝","爨","爵","爺","爻",
      "晃","晊","晋","晟","晨","晧","晫","晬","晭","晰","晳","晴","晶","晷","暄","暅","暉","暎","暐","暑",
      "曉","曄","曙","曛","曜","曦","曧","昂","昃","昆","昇","昊","昌","昍","昏","昑","昒","星","映","春",
      "昱","昺","昻","昼","昽","是","時","晁","晄","晅","晆","景","智","暘","曼","炷","炸","爭","燃","燐"],
  土:["土","地","坤","城","基","垠","坦","埈","培","域","堯","壤","坪","岩","山","嶽","峯","丘",
      "堅","堂","堪","報","場","塊","塑","塔","塗","塘","塵","塾","境","墅","墉","墊","墐","墓","墜","墟",
      "墨","墩","墮","墳","墵","墾","壁","壇","壑","壕","壘","壙","壚","壜","壞","壟","壠","壤","壩","壯",
      "垣","垤","垥","垦","垧","垨","垩","垪","垫","垬","垭","垮","垯","垰","垱","垲","垳","垴","垵","垶",
      "坡","坢","坣","坤","坥","坦","坧","坨","坩","坪","坫","坬","坭","坮","坯","坰","坱","坲","坳","坴",
      "志","厚","重","誠","信","義","仁","禮","德","善","良","正","直","賢","哲","聖","博","雅","俊","傑",
      "偉","優","秀","英","傑","豪","毅","剛","勇","武","勤","儉","慎","敬","恭","謙","遜","溫","和","平"],
  金:["金","銀","鐵","鋼","鍾","鍊","銘","錫","鉉","欽","鑫","鐘","鎬","錦","銅",
      "鈺","鉀","鉅","鉉","鉊","鉋","鉍","鉎","鉏","鉐","鉒","鉓","鉔","鉕","鉖","鉗","鉘","鉙","鉚","鉛",
      "鉜","鉝","鉞","鉟","鉠","鉡","鉢","鉣","鉤","鉥","鉦","鉧","鉨","鉩","鉪","鉫","鉬","鉭","鉮","鉯",
      "銃","銅","銑","銓","銕","銖","銗","銘","銙","銚","銛","銜","銝","銞","銟","銠","銡","銢","銣","銤",
      "鋒","鋓","鋔","鋕","鋖","鋗","鋘","鋙","鋚","鋛","鋜","鋝","鋞","鋟","鋠","鋡","鋢","鋣","鋤","鋥",
      "錚","錛","錜","錝","錞","錟","錠","錡","錢","錣","錤","錥","錦","錧","錨","錩","錪","錫","錬","錭",
      "珏","珀","珂","珃","珄","珅","珆","珇","珈","珉","珊","珋","珌","珍","珎","珏","珐","珑","珒","珓",
      "瑞","瑟","瑠","瑡","瑢","瑣","瑤","瑥","瑦","瑧","瑨","瑩","瑪","瑫","瑬","瑭","瑮","瑯","瑰","瑱",
      "璀","璁","璂","璃","璄","璅","璆","璇","璈","璉","璊","璋","璌","璍","璎","璏","璐","璑","璒","璓"],
  水:["水","河","海","湖","江","泉","洋","洙","澤","潤","濟","浩","淳","清","澈","溪","汀","沙","演",
      "汝","汪","汰","汲","汶","汸","汹","汻","汼","汽","汾","沁","沂","沃","沄","沅","沆","沇","沈","沉",
      "沌","沍","沎","沏","沐","沑","沒","沓","沔","沕","沖","沗","沘","沙","沚","沛","沜","沝","沞","沟",
      "泂","泃","泄","泅","泆","泇","泈","泉","泊","泋","泌","泍","泎","泏","泐","泑","泒","泓","泔","法",
      "洄","洅","洆","洇","洈","洉","洊","洋","洌","洍","洎","洏","洐","洑","洒","洓","洔","洕","洖","洗",
      "浚","浛","浜","浝","浞","浟","浠","浡","浢","浣","浤","浥","浦","浧","浨","浩","浪","浫","浬","浭",
      "涵","涶","涷","涸","涹","涺","涻","涼","淀","淁","淂","淃","淄","淅","淆","淇","淈","淉","淊","淋",
      "湧","湨","湩","湪","湫","湬","湭","湮","湯","湰","湱","湲","湳","湴","湵","湶","湷","湸","湹","湺",
      "源","準","溶","溺","漢","漸","潔","潑","潭","潮","瀚","瀛","瀾","灌","灝","灞","灣","灤","灧","灩"],
};
function getCharOheng(hanja){
  for(const [el,chars] of Object.entries(CHAR_OHENG_MAP)){
    if(chars.includes(hanja))return el;
  }
  return null;
}
function getSoundOheng(hangul){
  if(!hangul||hangul.length===0)return null;
  const code=hangul.charCodeAt(0)-0xAC00;
  if(code<0)return null;
  const choIdx=Math.floor(code/21/28);
  const CHO=["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  return SOUND_OHENG[CHO[choIdx]]||null;
}
function checkBlyong(hanja){
  const results={};
  for(const [type,chars] of Object.entries(BLYONG_LIST)){
    const found=[...hanja].filter(c=>chars.includes(c));
    if(found.length>0)results[type]=found;
  }
  return results; // 비어있으면 통과
}
function checkSlur(hangul){
  return SLUR_SYLLABLES.some(s=>hangul.includes(s));
}
function checkSurnameClash(surnameOheng, firstCharOheng){
  if(!surnameOheng||!firstCharOheng)return false;
  // 상극: 성씨가 이름첫자를 극하면 충돌
  return EL_CTRL[surnameOheng]===firstCharOheng;
}
// 이름 체크리스트 산출
function calcNameChecklist(n, yongsinEl, isTrueYongsin, selectedSurname, nameSurname, johuEl=null, isJohuUrgent=false, tongwanEl=null, elementScores=null, desc="사주의 균형을 잡아주는"){
  const checks=[];
  const hangulChars=[...n.hangul];
  const hanjaChars=[...n.hanja];
  const primaryEl = isJohuUrgent && johuEl ? johuEl : yongsinEl;
  const secondaryEl = isJohuUrgent && johuEl ? yongsinEl : johuEl;
  const EL_KR={木:"나무(木)",火:"불(火)",土:"흙(土)",金:"쇠(金)",水:"물(水)"};

  // 1. 발음오행 체크
  const soundEl=getSoundOheng(hangulChars[0]);
  const soundEl2=hangulChars[1]?getSoundOheng(hangulChars[1]):null;
  const soundMatchPrimary=soundEl===primaryEl||soundEl2===primaryEl;
  const soundMatchSecondary=secondaryEl&&(soundEl===secondaryEl||soundEl2===secondaryEl);
  const soundMatch=soundMatchPrimary||soundMatchSecondary;
  const soundDetail = soundMatchPrimary
    ? `한글 발음에 ${desc} ${EL_KR[primaryEl]||primaryEl} 기운을 담았습니다`
    : soundMatchSecondary
    ? `한글 발음에 보조용신 ${EL_KR[secondaryEl]||secondaryEl} 기운을 담았습니다`
    : `한글 발음이 용신 오행과 다릅니다`;
  checks.push({label:"발음오행",ok:soundMatch,detail:soundDetail});

  // 2. 자원오행 체크
  const charEl1=getCharOheng(hanjaChars[0]);
  const charEl2=hanjaChars[1]?getCharOheng(hanjaChars[1]):null;
  const charMatchPrimary=charEl1===primaryEl||charEl2===primaryEl;
  const charMatchSecondary=secondaryEl&&(charEl1===secondaryEl||charEl2===secondaryEl);
  const charMatch=charMatchPrimary||charMatchSecondary;
  const charDetail = charMatchPrimary
    ? `한자에 ${desc} ${EL_KR[primaryEl]||primaryEl} 기운을 담았습니다`
    : charMatchSecondary
    ? `한자에 보조용신 ${EL_KR[secondaryEl]||secondaryEl} 기운을 담았습니다`
    : charEl1||charEl2
    ? `한자 오행이 용신과 다릅니다 (${charEl1||"?"}·${charEl2||"?"})`
    : `한자 자원오행을 확인 중입니다`;
  checks.push({label:"자원오행",ok:charMatch,detail:charDetail});

  // 3. 성씨 상극 체크
  if(selectedSurname&&selectedSurname.char_oheng&&selectedSurname.char_oheng!=="?"){
    const sOheng=selectedSurname.char_oheng;
    const clash=checkSurnameClash(sOheng,charEl1);
    checks.push({label:"성씨 조화",ok:!clash,detail:clash?`성씨와 이름 첫 글자가 서로 극하여 충돌합니다`:`성씨와 이름이 조화롭게 어울립니다`});
  } else if(nameSurname){
    checks.push({label:"성씨 조화",ok:true,detail:"성씨 한자 미선택 — 상극 검사 생략"});
  }

  // 4. 불용문자
  const blyong=checkBlyong(n.hanja);
  const hasBlyong=Object.keys(blyong).length>0;
  checks.push({label:"불용문자",ok:!hasBlyong,detail:hasBlyong?`이름에 쓰지 않는 한자가 포함되어 있습니다 (${Object.values(blyong).flat().join("")})`:"꺼리는 한자가 없어 좋습니다"});

  // 5. 욕설/비속어
  const hasSlur=checkSlur(n.hangul);
  checks.push({label:"발음 주의",ok:!hasSlur,detail:hasSlur?"발음이 부정적으로 들릴 수 있으니 주의가 필요합니다":"발음에 문제가 없습니다"});

  // 6. 진용신
  if(isTrueYongsin){
    checks.push({label:"진용신",ok:true,detail:`억부·조후 용신이 모두 ${EL_KR[primaryEl]||primaryEl}로 일치하여 이름에 강하게 담겼습니다`});
  }

  return checks;
}

// ★★★ 출산택일 시뮬레이터

// ============================================================
function TaekIlSimulator(){
  const now = new Date();
  const[simYear,setSimYear]=useState(now.getFullYear());
  const[simMonth,setSimMonth]=useState(now.getMonth()+1);
  const[simDay,setSimDay]=useState(now.getDate());
  const[simSijiIdx,setSimSijiIdx]=useState(6); // 午時 기본
  const[simGender,setSimGender]=useState("male");
  const[simSaju,setSimSaju]=useState(null);
  const[simErr,setSimErr]=useState("");
  const[aiResults,setAiResults]=useState([]);
  const[aiLoading,setAiLoading]=useState(false);
  const[aiErr,setAiErr]=useState("");
  // 예정일 (±10일 자동)
  const[centerYear,setCenterYear]=useState(now.getFullYear());
  const[centerMonth,setCenterMonth]=useState(now.getMonth()+1);
  const[centerDay,setCenterDay]=useState(now.getDate());
  // 부모 사주 (엄마/아빠 각각)
  const[momForm,setMomForm]=useState({year:"",month:"",day:"",hour:"12",minute:"0",absent:false});
  const[dadForm,setDadForm]=useState({year:"",month:"",day:"",hour:"12",minute:"0",absent:false});
  const[parentSaju,setParentSaju]=useState(null); // {mom, dad} 형태
  const[showParentForm,setShowParentForm]=useState(false);
  const[selectedResult,setSelectedResult]=useState(null);
  // 이름짓기
  const[nameResult,setNameResult]=useState(null);
  const[nameLoading,setNameLoading]=useState(false);
  const[nameMoreLoading,setNameMoreLoading]=useState(false); // "다른 3건" 로딩
  const[nameSaju,setNameSaju]=useState(null);
  const[nameMeta,setNameMeta]=useState(null);
  const[nameDetailCache,setNameDetailCache]=useState({});
  const[nameDetailLoading,setNameDetailLoading]=useState({});
  const[expandedName,setExpandedName]=useState(null);
  const[nameDebug,setNameDebug]=useState(null);

  function recalc(y,m,d,sijiIdx){
    const err=validateDate(y,m,d);if(err){setSimErr(err);setSimSaju(null);return;}
    setSimErr("");
    try{
      const h=SIJI_HOURS[sijiIdx];
      const min=SIJI_MINUTES[sijiIdx];
      const r=calcSaju(y,m,d,h,min);
      r.solar={year:y,month:m,day:d,hour:h,minute:min};
      setSimSaju(r);
    }catch(e){setSimErr("계산 오류: "+e.message);}
  }

  useEffect(()=>{recalc(simYear,simMonth,simDay,simSijiIdx);},[]);

  function handleInput(field,val){
    const ny=field==="year"?+val:simYear;
    const nm=field==="month"?Math.min(12,Math.max(1,+val)):simMonth;
    const nd=field==="day"?Math.min(getMaxDay(ny,nm),Math.max(1,+val)):simDay;
    if(field==="year")setSimYear(ny);
    if(field==="month")setSimMonth(nm);
    if(field==="day")setSimDay(nd);
    recalc(ny,nm,nd,simSijiIdx);
  }
  function handleSiji(delta){
    const ni=((simSijiIdx+delta)%12+12)%12;
    setSimSijiIdx(ni);
    recalc(simYear,simMonth,simDay,ni);
  }

  function runAI(){
    const err=validateDate(centerYear,centerMonth,centerDay);
    if(err){setAiErr(err);return;}
    setAiLoading(true);setAiErr("");setAiResults([]);setSelectedResult(null);setNameResult(null);
    setTimeout(()=>{
      try{
        // 부모 pillars: 엄마+아빠 합쳐서 전달 (있는 것만)
        const pp=parentSaju
          ? [...(parentSaju.mom?.pillars||[]),...(parentSaju.dad?.pillars||[])]
          : null;
        const results=runTaekIlFilter(centerYear,centerMonth,centerDay,simGender,pp&&pp.length?pp:null);
        if(results.length===0)setAiErr("해당 범위에서 추천 조합을 찾지 못했습니다.");
        else setAiResults(results);
      }catch(e){setAiErr("오류: "+e.message);}
      setAiLoading(false);
    },100);
  }

  function calcParentSaju(){
    let momSaju=null, dadSaju=null;
    if(!momForm.absent){
      const err=validateDate(momForm.year,momForm.month,momForm.day);
      if(err){alert("엄마 생년월일 오류: "+err);return;}
      try{momSaju=calcSaju(+momForm.year,+momForm.month,+momForm.day,+momForm.hour,+(momForm.minute||0));}
      catch(e){alert("엄마 사주 계산 오류");return;}
    }
    if(!dadForm.absent){
      const err=validateDate(dadForm.year,dadForm.month,dadForm.day);
      if(err){alert("아빠 생년월일 오류: "+err);return;}
      try{dadSaju=calcSaju(+dadForm.year,+dadForm.month,+dadForm.day,+dadForm.hour,+(dadForm.minute||0));}
      catch(e){alert("아빠 사주 계산 오류");return;}
    }
    if(!momSaju&&!dadSaju){alert("부모 사주를 최소 한 명은 입력해주세요.");return;}
    setParentSaju({mom:momSaju,dad:dadSaju});
    setShowParentForm(false);
    alert(`부모 사주 입력 완료! (${momSaju?"엄마 ✅":"엄마 없음"} / ${dadSaju?"아빠 ✅":"아빠 없음"})`);
  }

  // 이름짓기 상태
  const[nameSurname,setNameSurname]=useState(""); // 한글 성씨
  const[nameSurnameOptions,setNameSurnameOptions]=useState([]); // 한자 후보
  const[selectedSurname,setSelectedSurname]=useState(null); // 선택된 성씨 한자 정보

  // 성씨 한자 후보 조회 (내부 DB)
  function fetchSurnameOptions(hangul){
    if(!hangul.trim()){setNameSurnameOptions([]);return;}
    const options=lookupSurname(hangul.trim());
    if(options){
      setNameSurnameOptions(options);
      // 주요(common) 성씨가 1개면 자동 선택
      const common=options.filter(o=>o.common);
      if(common.length===1)setSelectedSurname(common[0]);
    } else {
      // DB에 없는 성씨 → 발음오행만 자동계산
      const code=hangul.charCodeAt(0)-0xAC00;
      const choIdx=code>=0?Math.floor(code/21/28):0;
      const CHO=["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
      const SOUND_MAP={ㄱ:"木",ㄲ:"木",ㅋ:"木",ㄴ:"火",ㄷ:"火",ㄹ:"火",ㅌ:"火",ㅇ:"土",ㅎ:"土",ㅅ:"金",ㅆ:"金",ㅈ:"金",ㅊ:"金",ㅁ:"水",ㅂ:"水",ㅍ:"水"};
      const sOheng=SOUND_MAP[CHO[choIdx]]||"土";
      setNameSurnameOptions([{hanja:"?",char_oheng:"미확인",sound_oheng:sOheng,common:false,unknown:true}]);
    }
  }

  // 이름짓기 (Gemini API)
  async function saveReport(idx){
    const reportEl=document.getElementById(`report-${idx}`);
    if(!reportEl){alert("리포트 영역을 찾을 수 없습니다.");return;}
    if(!window.html2canvas){
      await new Promise((res,rej)=>{
        const s=document.createElement("script");
        s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        s.onload=res;s.onerror=rej;document.head.appendChild(s);
      });
    }
    try{
      const canvas=await window.html2canvas(reportEl,{scale:2,backgroundColor:"#1a1108",useCORS:true,logging:false});
      const a=document.createElement("a");
      a.href=canvas.toDataURL("image/png");
      a.download=`출산택일_리포트_${aiResults[idx]?.year||""}${aiResults[idx]?.month||""}${aiResults[idx]?.day||""}.png`;
      a.click();
    }catch(e){alert("저장 오류: "+e.message);}
  }

  // 공통 사주 컨텍스트 빌더
  function buildSajuContext(saju){
    const {strength,elementScores}=calcStrengthDetail(saju.pillars);
    const tcpaBase=calcTCPA(saju.pillars);
    const yongsin=calcYongsin(saju.pillars,tcpaBase.sBase);
    const dayEl=HS_EL[HS.indexOf(saju.dayStem)];
    const surnameInfo=selectedSurname&&!selectedSurname.unknown
      ?`${nameSurname}(${selectedSurname.hanja}) 자원오행:${selectedSurname.char_oheng} 발음오행:${selectedSurname.sound_oheng}`
      :nameSurname?`${nameSurname} 발음오행:${nameSurnameOptions[0]?.sound_oheng||"미확인"}`
      :"성씨미입력";
    return {strength,elementScores,tcpaBase,yongsin,dayEl,surnameInfo};
  }

  function parseGeminiJSON(raw){
    let clean=raw;
    // 코드블록 제거 후 { } 추출
    clean=clean.replace(/```(?:json)?/gi,"").replace(/```/g,"").trim();
    const s=clean.indexOf("{");const e=clean.lastIndexOf("}");
    if(s>=0&&e>s) clean=clean.slice(s,e+1);
    // 제어문자 제거 (탭/개행 제외)
    clean=clean.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,"");
    // trailing comma 제거
    clean=clean.replace(/,(\s*[}\]])/g,"$1");
    // 1차: 그대로 파싱
    try{ return JSON.parse(clean); }catch(e1){}
    // 2차: 줄바꿈/탭 공백으로 치환 후 파싱
    try{ return JSON.parse(clean.replace(/[\n\r\t]/g," ")); }catch(e2){}
    // 3차: 열린 괄호 닫기
    try{
      let fixed=clean.replace(/[\n\r\t]/g," ");
      fixed=fixed.replace(/,(\s*)$/,"$1");
      const openBr=(fixed.match(/\[/g)||[]).length-(fixed.match(/\]/g)||[]).length;
      const openCu=(fixed.match(/\{/g)||[]).length-(fixed.match(/\}/g)||[]).length;
      for(let i=0;i<openBr;i++) fixed+="]";
      for(let i=0;i<openCu;i++) fixed+="}";
      return JSON.parse(fixed);
    }catch(e3){}
    // 4차: 정규식으로 완전한 name 객체만 추출
    try{
      const nameObjects=[];
      const objRegex=/\{\s*"hangul"\s*:\s*"([^"]+)"[\s\S]*?"hanja"\s*:\s*"([^"]*)"/g;
      let match;
      while((match=objRegex.exec(clean))!==null){
        try{
          // 해당 객체 범위 추출
          const start=match.index;
          let depth=0,end=start;
          for(let i=start;i<clean.length;i++){if(clean[i]==="{")depth++;else if(clean[i]==="}"){depth--;if(depth===0){end=i;break;}}}
          const obj=JSON.parse(clean.slice(start,end+1).replace(/[\n\r\t]/g," "));
          nameObjects.push(obj);
        }catch{}
      }
      if(nameObjects.length>0) return {names:nameObjects};
    }catch{}
    throw new Error("JSON 파싱 실패");
  }

  async function callGemini(prompt, retries=2, debugCb=null){
    const GEMINI_KEY=import.meta.env.VITE_GEMINI_API_KEY||"";
    if(!GEMINI_KEY) throw new Error("API 키 없음");
    const MODELS=["gemini-2.5-flash-lite","gemini-2.5-flash"]; // lite 우선, 실패시 flash 폴백
    let lastErr="";
    for(let mi=0;mi<MODELS.length;mi++){
      const model=MODELS[mi];
      for(let attempt=0;attempt<=retries;attempt++){
        try{
          const res=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,{
            method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{temperature:0.7,maxOutputTokens:4096}})
          });
          if(!res.ok){
            const err=await res.json().catch(()=>({}));
            lastErr=err?.error?.message||`HTTP ${res.status}`;
            // 쿼터 초과(429)면 다음 모델로 폴백
            if(res.status===429){throw new Error("QUOTA_EXCEEDED");}
            throw new Error(lastErr);
          }
          const data=await res.json();
          const parts=data?.candidates?.[0]?.content?.parts||[];
          const finishReason=data?.candidates?.[0]?.finishReason||"";
          const text=parts.filter(p=>!p.thought).map(p=>p.text||"").join("").trim();
          if(debugCb) debugCb({parts,finishReason,text,model});
          if(!text){
            lastErr=`빈 응답 (finishReason:${finishReason})`;
            if(attempt<retries){await new Promise(r=>setTimeout(r,10000));continue;}
            throw new Error(lastErr);
          }
          return text;
        }catch(e){
          lastErr=e.message;
          if(e.message==="QUOTA_EXCEEDED") break; // 폴백
          if(attempt>=retries) throw e;
          await new Promise(r=>setTimeout(r,10000));
        }
      }
    }
    throw new Error("API 호출 실패: "+lastErr);
  }

  // 용신 우선순위별 primaryEl 및 문구 결정
  function resolveNameYongsin(yongsin, tcpaBase, elementScores, pillars){
    const isJohuUrgent=Math.abs(tcpaBase.sBase)>=6;
    const humIndex=calcHumidity(pillars);
    const isWet=humIndex>1;
    const isDry=humIndex<-1;

    // 조후 문구 생성
    function johuDesc(sBase){
      const isCold=sBase<=-6;
      if(isCold&&isDry) return "차갑고 건조한 사주를 따뜻하고 촉촉하게 해주는";
      if(isCold&&isWet) return "차갑고 습한 사주를 따뜻하게 해주는";
      if(isCold) return "차가운 사주를 따뜻하게 해주는";
      if(isDry) return "뜨겁고 건조한 사주를 시원하고 촉촉하게 해주는";
      if(isWet) return "뜨겁고 습한 사주를 시원하게 해주는";
      return "뜨거운 사주를 시원하게 해주는";
    }

    // 1. 조후 긴급
    if(isJohuUrgent && yongsin.johu?.primary){
      return{primaryEl:yongsin.johu.primary, secondaryEl:yongsin.eobbu?.primary||null, label:`조후용신 ${yongsin.johu.primary}`, desc:johuDesc(tcpaBase.sBase), yongsinText:`조후 ${yongsin.johu.primary}(긴급) > 억부 ${yongsin.eobbu?.primary||""}`};
    }
    // 2. 억부
    if(yongsin.eobbu?.primary){
      const johuText=yongsin.johu?.primary?` > 조후 ${yongsin.johu.primary}`:"";
      return{primaryEl:yongsin.eobbu.primary, secondaryEl:yongsin.johu?.primary||null, label:`억부용신 ${yongsin.eobbu.primary}`, desc:"사주의 균형을 잡아주는", yongsinText:`억부 ${yongsin.eobbu.primary}${johuText}`};
    }
    // 3. 조후
    if(yongsin.johu?.primary){
      return{primaryEl:yongsin.johu.primary, secondaryEl:null, label:`조후용신 ${yongsin.johu.primary}`, desc:johuDesc(tcpaBase.sBase), yongsinText:`조후 ${yongsin.johu.primary}`};
    }
    // 4. 통관
    if(yongsin.tongwan?.primary){
      return{primaryEl:yongsin.tongwan.primary, secondaryEl:null, label:`통관용신 ${yongsin.tongwan.primary}`, desc:"오행의 흐름이 막힌 곳을 뚫어주는", yongsinText:`통관 ${yongsin.tongwan.primary}`};
    }
    // 5. 부족 오행
    const total=Object.values(elementScores).reduce((a,b)=>a+b,0)||1;
    const minEl=Object.entries(elementScores).sort((a,b)=>a[1]-b[1])[0]?.[0]||"木";
    return{primaryEl:minEl, secondaryEl:null, label:`부족오행 ${minEl}`, desc:"사주에 부족한", yongsinText:`부족오행 ${minEl}`};
  }

  // 이름 필터 + 점수화
  function scoreAndFilterNames(names, primaryEl, secondaryEl){
    const results=[];
    for(const n of names){
      if(!n.hangul||!n.hanja||n.hangul==="오류") continue;
      const hangulChars=[...n.hangul];
      const hanjaChars=[...n.hanja];
      // ── pass/fail 필터 ──
      // 1. 발음오행
      const soundEl=getSoundOheng(hangulChars[0]);
      const soundEl2=hangulChars[1]?getSoundOheng(hangulChars[1]):null;
      const soundPassPrimary=soundEl===primaryEl||soundEl2===primaryEl;
      const soundPassSecondary=secondaryEl&&(soundEl===secondaryEl||soundEl2===secondaryEl);
      if(!soundPassPrimary&&!soundPassSecondary) continue; // 발음오행 탈락
      // 2. 자원오행 (null이면 pass)
      const charEl1=getCharOheng(hanjaChars[0]);
      const charEl2=hanjaChars[1]?getCharOheng(hanjaChars[1]):null;
      const charPassPrimary=charEl1===primaryEl||charEl2===primaryEl;
      const charPassSecondary=secondaryEl&&(charEl1===secondaryEl||charEl2===secondaryEl);
      const charNull=!charEl1&&!charEl2;
      if(!charPassPrimary&&!charPassSecondary&&!charNull) continue; // 자원오행 불일치 탈락
      // 3. 불용문자
      const blyong=checkBlyong(n.hanja);
      if(Object.keys(blyong).length>0) continue;
      // 4. 욕설
      if(checkSlur(n.hangul)) continue;
      // ── 점수화 ──
      let score=0;
      if(soundPassPrimary) score+=30;
      else if(soundPassSecondary) score+=20;
      if(charPassPrimary) score+=25;
      else if(charPassSecondary) score+=15;
      // 성씨 조화
      if(selectedSurname?.char_oheng&&selectedSurname.char_oheng!=="?"){
        if(!checkSurnameClash(selectedSurname.char_oheng,charEl1)) score+=3;
      }
      // 발음 주의
      if(!checkSlur(n.hangul)) score+=2;
      results.push({...n,_score:score});
    }
    // 점수 내림차순 정렬 후 상위 3개
    return results.sort((a,b)=>b._score-a._score).slice(0,3);
  }

  // 1단계: 이름 생성 (10개 요청 → 필터/정렬 → 상위 3개)
  async function generateNames(saju, excludeNames=[]){
    const isMore=excludeNames.length>0;
    if(isMore) setNameMoreLoading(true);
    else{setNameLoading(true);setNameResult(null);setNameSaju(saju);setNameMeta(null);setNameDetailCache({});setNameDebug(null);}
    try{
      const {strength,elementScores,tcpaBase,yongsin,dayEl,surnameInfo}=buildSajuContext(saju);
      const {primaryEl,secondaryEl,yongsinText}=resolveNameYongsin(yongsin,tcpaBase,elementScores,saju.pillars);
      const soundGuide={木:"ㄱ·ㄲ·ㅋ",火:"ㄴ·ㄷ·ㄹ·ㅌ",土:"ㅇ·ㅎ",金:"ㅅ·ㅆ·ㅈ·ㅊ",水:"ㅁ·ㅂ·ㅍ"};
      const excludeText=excludeNames.length>0?`\n제외: ${excludeNames.join(",")}`:""
      const prompt=`사주명리 아기이름 전문가. 아래 사주로 이름 10개 추천.
일간:${saju.dayStem}(${dayEl}) 신강신약:${strength}
용신:${yongsinText} 월지:${saju.pillars[2].branch}
성씨:${surnameInfo}${excludeText}
조건: 발음 초성이 ${primaryEl}오행(${soundGuide[primaryEl]||""}) 또는 한자 자원이 ${primaryEl}오행. 현대적 이름, 대법원인명용한자, 유명인 동명 제외.
${simGender==="male"?"남성적이거나 중성적인 이름.":"여성적이거나 중성적인 이름."}
JSON만(마크다운없이). hangul은 성씨제외 두글자:
{"names":[{"hangul":"두글자","hanja":"두글자","sound_oheng":"발음오행","char_oheng":"자원오행","point":"장점15자이내"}]}`;
      const raw=await callGemini(prompt, 2, (dbg)=>setNameDebug(dbg));
      const parsed=parseGeminiJSON(raw);
      const allNames=parsed.names||parsed.Names||[];
      if(allNames.length===0) throw new Error("이름 생성 결과가 비어있습니다. 다시 시도해주세요.");
      // 필터 + 정렬 → 상위 3개
      const filtered=scoreAndFilterNames(allNames, primaryEl, secondaryEl||null);
      const finalNames=filtered.length>0?filtered:allNames.slice(0,3); // 필터 전부 탈락 시 원본 상위 3개
      if(isMore) setNameResult(prev=>[...(prev||[]),...finalNames]);
      else setNameResult(finalNames);
    }catch(e){
      if(!isMore) setNameResult([{hangul:"오류",hanja:"—",hanja_detail:"—",sound_oheng:"—",char_oheng:"—",point:"✦ "+e.message}]);
    }
    if(isMore) setNameMoreLoading(false);
    else setNameLoading(false);
  }

  // 2단계: 이름 카드 탭 시 상세 호출
  async function generateNameDetail(saju, name, idx){
    setNameDetailLoading(prev=>({...prev,[idx]:true}));
    try{
      const {strength,elementScores,tcpaBase,yongsin,dayEl,surnameInfo}=buildSajuContext(saju);
      const daeunForName=calcDaeun(saju.solar.year,saju.solar.month,saju.solar.day,simGender,saju.pillars[2]);
      const daeunSummary=daeunForName.slice(0,8).map(d=>{
        const gr=calcDaeunGrade(saju.pillars,saju.dayStem,d.stem,d.branch);
        return `${d.startAge}세${d.stem}${d.branch}(${gr.grade})`;
      }).join(" ");
      const isJohuUrgentDetail = Math.abs(tcpaBase.sBase) >= 6;
      const yongsinTextDetail = [
        yongsin.johu?.primary && isJohuUrgentDetail ? `조후 ${yongsin.johu.primary}(긴급)` : null,
        yongsin.eobbu?.primary ? `억부 ${yongsin.eobbu.primary}` : null,
        yongsin.johu?.primary && !isJohuUrgentDetail ? `조후 ${yongsin.johu.primary}` : null,
      ].filter(Boolean).join(" > ") || yongsin.primary;
      const prompt=`사주명리 아기이름 전문가. 아래 이름의 상세 분석을 작성하세요.

이름: ${nameSurname||""}${name.hangul} (${selectedSurname?.hanja||""}${name.hanja})
일간:${saju.dayStem}(${dayEl}) 신강신약:${strength}
용신(우선순위):${yongsinTextDetail}
성씨:${surnameInfo}
대운흐름:${daeunSummary}

JSON만 응답(마크다운없이 순수JSON). 각 값은 40자이내로 간결하게:
{"reason_oheng":"왜 이 오행인가","reason_sound":"왜 이 발음인가","reason_hanja":"왜 이 한자인가","reason_surname":"성씨와의 조화","personality":"이 아이 성향","career":"어울리는 진로","daeun_flow":"초년 중년 말년 흐름"}`;
      const raw=await callGemini(prompt);
      const parsed=parseGeminiJSON(raw);
      setNameDetailCache(prev=>({...prev,[idx]:parsed}));
    }catch(e){
      setNameDetailCache(prev=>({...prev,[idx]:{error:"상세 로딩 오류: "+e.message}}));
    }
    setNameDetailLoading(prev=>({...prev,[idx]:false}));
  }

  const sResult=simSaju?calcStrengthDetail(simSaju.pillars):null;
  const strength=sResult?.strength;
  const strengthColor=strengthColor5(strength);
  function scoreColor(s){if(s>100)return"#f5c842";if(s>=80)return"#f5c842";if(s>=65)return"#4ade80";if(s>=50)return C.gold;return"#fb923c";}

  // 시뮬 대운
  const simDaeunList = simSaju ? calcDaeun(simYear,simMonth,simDay,simGender,simSaju.pillars[2]) : [];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Card>
        <CardTitle>출산택일 시뮬레이터</CardTitle>

        {/* 성별 */}
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {[["male","아들 ♂"],["female","딸 ♀"]].map(([v,l])=>(
            <button key={v} onClick={()=>setSimGender(v)} style={{flex:1,padding:10,borderRadius:12,background:simGender===v?`${C.gold}28`:"rgba(255,255,255,0.07)",color:simGender===v?C.gold:`${C.gold}88`,border:simGender===v?`1.5px solid ${C.gold}70`:"1.5px solid rgba(255,255,255,0.14)",cursor:"pointer",fontWeight:700,fontSize:"0.82rem"}}>{l}</button>
          ))}
        </div>

        {/* 연/월/일 입력 */}
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {[["year","연도",simYear,1900,2030],["month","월",simMonth,1,12],["day","일",simDay,1,31]].map(([field,label,val,mn,mx])=>(
            <div key={field} style={{flex:field==="year"?2:1}}>
              <label style={{fontSize:"0.58rem",color:C.muted,display:"block",marginBottom:4,textAlign:"center"}}>{label}</label>
              <input type="number" min={mn} max={mx} value={val}
                onChange={e=>handleInput(field,e.target.value)}
                style={{width:"100%",padding:"10px 6px",borderRadius:12,border:"1.5px solid rgba(215,180,105,0.32)",background:"rgba(255,255,255,0.08)",color:C.text,fontSize:"0.92rem",outline:"none",textAlign:"center"}}/>
            </div>
          ))}
        </div>

        {/* 사주판 */}
        {simSaju && (()=>{
          const simBranches=simSaju.pillars.map(p=>p.branch);
          const simStems=simSaju.pillars.map(p=>p.stem);
          const HS_CHUNG2={甲:"庚",庚:"甲",乙:"辛",辛:"乙",丙:"壬",壬:"丙",丁:"癸",癸:"丁"};
          const HS_HAP6t={甲:"己",己:"甲",乙:"庚",庚:"乙",丙:"辛",辛:"丙",丁:"壬",壬:"丁",戊:"癸",癸:"戊"};
          const HS_HAP_ELt={甲:"土",己:"土",乙:"金",庚:"金",丙:"水",辛:"水",丁:"木",壬:"木",戊:"Fire",癸:"火"};
          const ZI_HAP6t={子:"丑",丑:"子",寅:"亥",亥:"寅",卯:"戌",戌:"卯",辰:"酉",酉:"辰",巳:"申",申:"巳",午:"未",未:"午"};
          const ZI_HAP_ELt={"子丑":"土","寅亥":"木","卯戌":"火","辰酉":"金","巳申":"水","午未":"火","丑子":"土","亥寅":"木","戌卯":"火","酉辰":"金","申巳":"水","未午":"火"};
          const stemRels=[],branchRels=[];
          for(let i=0;i<simStems.length;i++)for(let j=i+1;j<simStems.length;j++){
            if(HS_HAP6t[simStems[i]]===simStems[j]){const el=HS_HAP_ELt[simStems[i]]||"";stemRels.push({type:"합",label:`${simStems[i]}${simStems[j]}→${el}`,color:EL_COL[el]||C.gold});}
            if(HS_CHUNG2[simStems[i]]===simStems[j]){const el=HS_EL[HS.indexOf(simStems[i])];stemRels.push({type:"충",label:`${simStems[i]}${simStems[j]}충`,color:EL_COL[el]||"#f87171"});}
          }
          for(let i=0;i<simBranches.length;i++)for(let j=i+1;j<simBranches.length;j++){
            if(ZI_HAP6t[simBranches[i]]===simBranches[j]){const el=ZI_HAP_ELt[simBranches[i]+simBranches[j]]||"";branchRels.push({type:"육합",label:`${simBranches[i]}${simBranches[j]}→${el}`,color:EL_COL[el]||"#c084fc"});}
            if(CHUNG_MAP[simBranches[i]]===simBranches[j]){const el=EB_EL[EB.indexOf(simBranches[i])];branchRels.push({type:"충",label:`${simBranches[i]}${simBranches[j]}충`,color:EL_COL[el]||"#f87171"});}
          }
          const SIJI_TIME=["23:30~01:29","01:30~03:29","03:30~05:29","05:30~07:29","07:30~09:29","09:30~11:29","11:30~13:29","13:30~15:29","15:30~17:29","17:30~19:29","19:30~21:29","21:30~23:29"];
          const SAN_HAPt=[{els:["寅","午","戌"],el:"火",t:"삼합"},{els:["申","子","辰"],el:"水",t:"삼합"},{els:["巳","酉","丑"],el:"金",t:"삼합"},{els:["亥","卯","未"],el:"木",t:"삼합"}];
          const BANG_HAPt=[{els:["寅","卯","辰"],el:"木",t:"방합"},{els:["巳","午","未"],el:"火",t:"방합"},{els:["申","酉","戌"],el:"金",t:"방합"},{els:["亥","子","丑"],el:"水",t:"방합"}];
          for(const g of [...SAN_HAPt,...BANG_HAPt]){
            const cnt=g.els.filter(b=>simBranches.includes(b));
            if(cnt.length===3) branchRels.push({type:g.t,label:`${cnt.join("")}→${g.el}`,color:EL_COL[g.el]||"#fb923c"});
            else if(cnt.length===2&&cnt.some(b=>WANGJI.includes(b))) branchRels.push({type:"반합",label:`${cnt.join("")}(${g.el})`,color:EL_COL[g.el]||"#fbbf24"});
          }
          for(const g of SAMHYUNG3){const cnt=g.filter(b=>simBranches.includes(b));if(cnt.length===3)branchRels.push({type:"삼형",label:`${cnt.join("")}형`,color:"#f55030"});}
          const allRels=[...stemRels,...branchRels];
          return(
            <div style={{marginBottom:8}}>
              {/* 상단: 오각형(좌) + 스위치+4주(우) */}
              <div style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:6}}>
                {/* 좌측: 오각형 — flex:1로 남은 공간 전부 사용 */}
                <div style={{flex:1,minWidth:0}}>
                  <Pentagon pillars={simSaju.pillars} dayStem={simSaju.dayStem} elementScores={sResult?.elementScores} strength={strength}/>
                </div>
                {/* 우측: 스위치 + 4주 — 고정 너비로 축소 */}
                <div style={{flexShrink:0,display:"grid",gridTemplateColumns:"20px repeat(4,38px)",gap:2,alignItems:"stretch"}}>
                  <div style={{display:"flex",flexDirection:"column",justifyContent:"space-between",paddingTop:"18px",paddingBottom:"4px"}}>
                    <button onClick={()=>handleSiji(1)} style={{padding:"3px 0",borderRadius:6,background:`${C.gold}18`,border:`1px solid ${C.gold}40`,color:C.gold,fontSize:"0.85rem",cursor:"pointer",fontWeight:900,lineHeight:1,textAlign:"center"}}>▲</button>
                    <div style={{fontSize:"0.36rem",color:C.muted,textAlign:"center",lineHeight:1.3,wordBreak:"break-all"}}>{SIJI_TIME[simSaju.pillars[0].branchIdx]}</div>
                    <button onClick={()=>handleSiji(-1)} style={{padding:"3px 0",borderRadius:6,background:`${C.gold}18`,border:`1px solid ${C.gold}40`,color:C.gold,fontSize:"0.85rem",cursor:"pointer",fontWeight:900,lineHeight:1,textAlign:"center"}}>▼</button>
                  </div>
                  <MiniPillarCell p={simSaju.pillars[0]} dayStem={simSaju.dayStem} label="시주" accentColor={C.gold}/>
                  {[1,2,3].map(i=>(<MiniPillarCell key={i} p={simSaju.pillars[i]} dayStem={simSaju.dayStem} label={["일주","월주","연주"][i-1]} isDay={i===1}/>))}
                </div>
              </div>
              {/* 하단: 신강/신약·용신 + 합충형 통합 */}
              <div style={{display:"flex",flexDirection:"column",gap:5,padding:"7px 4px 4px",borderTop:"1px solid rgba(215,180,105,0.12)"}}>
                <YongsinBadges pillars={simSaju.pillars} dayStem={simSaju.dayStem} showAll/>
                {allRels.length>0&&(
                  <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                    {allRels.map((it,idx)=>(
                      <div key={idx} style={{display:"flex",alignItems:"center",gap:2,padding:"3px 8px",borderRadius:5,background:`${it.color}18`,border:`1px solid ${it.color}40`}}>
                        <span style={{fontSize:"0.44rem",color:it.color,opacity:0.8}}>{it.type}</span>
                        <span style={{fontSize:"0.62rem",color:it.color,fontWeight:700,fontFamily:"serif"}}>{it.label.replace(it.type,"")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        {simErr&&<div style={{color:"#ff6a50",fontSize:"0.68rem",textAlign:"center",marginBottom:6}}>{simErr}</div>}



        {/* 대운 (10개, 원국 바로 아래) */}
        {simDaeunList.length>0&&(
          <div style={{borderTop:"1px solid rgba(215,180,105,0.15)",paddingTop:8,marginTop:2}}>
            <div style={{fontSize:"0.52rem",color:C.muted,marginBottom:5,fontWeight:700}}>▶ 대운</div>
            <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(simDaeunList.length,8)},1fr)`,gap:3}}>
              {simDaeunList.slice(0,8).map((d,i)=>{
                const sc=EL_COL[HS_EL[d.stemIdx]],bc=EL_COL[EB_EL[d.branchIdx]];
                return(
                  <div key={i} style={{textAlign:"center",padding:"4px 2px 3px",borderRadius:9,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.11)"}}>
                    <div style={{fontSize:"0.36rem",color:C.muted,marginBottom:1}}>{d.startAge}세</div>
                    <div style={{fontSize:"1.1rem",color:sc,fontFamily:"serif",fontWeight:KANJI_YANG[d.stem]?900:300,lineHeight:1}}>{d.stem}</div>
                    <div style={{fontSize:"1.1rem",color:bc,fontFamily:"serif",fontWeight:KANJI_YANG[d.branch]?900:300,lineHeight:1}}>{d.branch}</div>
                    <div style={{fontSize:"0.32rem",color:C.muted}}>{d.startYear}~</div>
                  </div>
                );
              })}
            </div>
            {/* 대운 인생 그래프 */}
            {simDaeunList.length>=2&&(
              <div style={{marginTop:8,width:"100%"}}>
                <LifeGraph daeunList={simDaeunList} pillars={simSaju.pillars} dayStem={simSaju.dayStem} birthYear={simYear} selDaeun={null} setSelDaeun={()=>{}}/>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* AI 추천 */}
      <Card>
        <CardTitle>✦ AI 택일 추천</CardTitle>
        <p style={{fontSize:"0.6rem",color:C.muted,textAlign:"center",marginBottom:12,lineHeight:1.7}}>예정일 기준 ±10일 · 대운 가중평균 반영 · 통관 보정</p>

        {/* 예정일 입력 */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:"0.58rem",color:C.muted,marginBottom:5,fontWeight:700}}>예정일 입력</div>
          <div style={{display:"flex",gap:6}}>
            {[["연도",centerYear,setCenterYear,1900,2030,2],["월",centerMonth,setCenterMonth,1,12,1],["일",centerDay,setCenterDay,1,31,1]].map(([label,val,setter,mn,mx,flex])=>(
              <div key={label} style={{flex}}>
                <label style={{fontSize:"0.52rem",color:C.muted,display:"block",marginBottom:3,textAlign:"center"}}>{label}</label>
                <input type="number" min={mn} max={mx} value={val} onChange={e=>setter(+e.target.value)} style={{width:"100%",padding:"8px 4px",borderRadius:9,border:"1.5px solid rgba(215,180,105,0.25)",background:"rgba(255,255,255,0.07)",color:C.text,fontSize:"0.88rem",outline:"none",textAlign:"center"}}/>
              </div>
            ))}
          </div>
        </div>

        {/* 부모 사주 (선택) */}
        <div style={{marginBottom:12}}>
          <button onClick={()=>setShowParentForm(v=>!v)} style={{width:"100%",padding:"7px 12px",borderRadius:9,background:"rgba(255,255,255,0.05)",border:`1px solid rgba(255,255,255,${showParentForm?0.2:0.1})`,color:parentSaju?"#4ade80":C.muted,fontSize:"0.62rem",cursor:"pointer",textAlign:"left",fontWeight:700}}>
            {parentSaju
              ?`✅ 부모 사주 입력됨 (${parentSaju.mom?"엄마 ✅":"엄마 없음"} / ${parentSaju.dad?"아빠 ✅":"아빠 없음"})`
              :"👪 부모 사주 입력 (선택) — 자녀-부모 적합도 반영"} {showParentForm?"▲":"▼"}
          </button>
          {showParentForm&&(
            <div style={{marginTop:8,padding:"12px",borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)"}}>
              <div style={{fontSize:"0.56rem",color:C.muted,marginBottom:10}}>자녀-부모 천간 충 여부 및 용신 보강 여부를 분석합니다.</div>
              {/* 엄마 */}
              {[["엄마","#f9a8d4",momForm,setMomForm],["아빠","#93c5fd",dadForm,setDadForm]].map(([label,color,form,setForm])=>(
                <div key={label} style={{marginBottom:12,padding:"10px",borderRadius:9,background:`${color}08`,border:`1px solid ${color}25`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:"0.65rem",fontWeight:700,color}}>{label}</span>
                    <label style={{display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}>
                      <input type="checkbox" checked={form.absent} onChange={e=>setForm(f=>({...f,absent:e.target.checked}))} style={{cursor:"pointer"}}/>
                      <span style={{fontSize:"0.56rem",color:C.muted}}>없음</span>
                    </label>
                  </div>
                  {!form.absent&&(
                    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:4}}>
                      {[["연도","year",1900,2030],["월","month",1,12],["일","day",1,31],["시","hour",0,23],["분","minute",0,59]].map(([l,k,mn,mx])=>(
                        <div key={k}>
                          <label style={{fontSize:"0.48rem",color:C.muted,display:"block",marginBottom:2,textAlign:"center"}}>{l}</label>
                          <input type="number" min={mn} max={mx} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{width:"100%",padding:"6px 2px",borderRadius:7,border:`1px solid ${color}30`,background:"rgba(255,255,255,0.06)",color:C.text,fontSize:"0.8rem",outline:"none",textAlign:"center"}}/>
                        </div>
                      ))}
                    </div>
                  )}
                  {form.absent&&<div style={{fontSize:"0.56rem",color:C.muted,textAlign:"center",padding:"6px 0"}}>해당 부모 사주를 고려하지 않습니다</div>}
                </div>
              ))}
              <GoldBtn onClick={calcParentSaju} style={{width:"100%",padding:"8px 0",fontSize:"0.75rem"}}>부모 사주 계산</GoldBtn>
            </div>
          )}
        </div>

        <GoldBtn onClick={runAI} disabled={aiLoading} style={{width:"100%",marginBottom:10,padding:12}}>
          {aiLoading
            ?<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{display:"inline-block",width:14,height:14,border:"2px solid #160c00",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>분석 중...</span>
            :"🔍 AI 추천 분석하기"}
        </GoldBtn>
        {aiErr&&<div style={{color:"#ff6a50",fontSize:"0.68rem",textAlign:"center",marginBottom:8}}>{aiErr}</div>}

        {aiResults.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {aiResults.map((res,idx)=>{
              const sc=scoreColor(res.score);
              const isSel=selectedResult===idx;
              const saju=res.saju;
              const sc5=strengthColor5(res.strength);
              return(
                <div key={idx}>
                  <button onClick={()=>setSelectedResult(isSel?null:idx)} style={{width:"100%",textAlign:"left",padding:"12px 12px",borderRadius:14,background:isSel?`${sc}15`:"rgba(255,255,255,0.05)",border:`1.5px solid ${isSel?sc:sc+"44"}`,cursor:"pointer",transition:"all 0.2s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:`${sc}22`,border:`2px solid ${sc}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <span style={{fontSize:"0.72rem",fontWeight:900,color:sc}}>#{idx+1}</span>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"0.85rem",fontWeight:700,color:C.goldL,fontFamily:"'Noto Serif KR',serif"}}>{res.year}년 {res.month}월 {res.day}일 · {SIJI_LABELS[res.sijiIdx]}</div>
                        <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
                          <span style={{fontSize:"0.58rem",color:sc,background:`${sc}18`,padding:"1px 7px",borderRadius:99,fontWeight:700}}>최종 {res.score>100?`100+${res.score-100}`:res.score}점</span>
                          <span style={{fontSize:"0.55rem",color:sc,padding:"1px 6px",borderRadius:99,fontWeight:600,opacity:0.8}}>원국 {res.rawScore}점</span>
                          {res.daeunAvg&&<span style={{fontSize:"0.55rem",color:C.gold,padding:"1px 6px",borderRadius:99,fontWeight:600}}>대운평균 {res.daeunAvg}점</span>}
                          <span style={{fontSize:"0.55rem",color:sc5,background:`${sc5}15`,padding:"1px 6px",borderRadius:99,fontWeight:700}}>{res.strength}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3}}>
                      {saju.pillars.map((p,i)=>{
                        const sc2=EL_COL[HS_EL[p.stemIdx]],bc2=EL_COL[EB_EL[p.branchIdx]];
                        return(
                          <div key={i} style={{textAlign:"center",padding:"4px 2px",borderRadius:8,background:i===1?"rgba(74,144,217,0.15)":"rgba(255,255,255,0.04)",border:i===1?"1px solid rgba(74,144,217,0.3)":"1px solid rgba(255,255,255,0.08)"}}>
                            <div style={{fontSize:"0.4rem",color:C.muted,marginBottom:1}}>{["시","일","월","년"][i]}</div>
                            <div style={{fontSize:"1.1rem",color:sc2,fontFamily:"serif",fontWeight:KANJI_YANG[p.stem]?900:300,lineHeight:1}}>{p.stem}</div>
                            <div style={{fontSize:"1.1rem",color:bc2,fontFamily:"serif",fontWeight:KANJI_YANG[p.branch]?900:300,lineHeight:1}}>{p.branch}</div>
                          </div>
                        );
                      })}
                    </div>
                  </button>

                  {isSel&&(
                    <div id={`report-${idx}`} style={{margin:"4px 0 0",padding:"14px",borderRadius:12,background:`${sc}08`,border:`1px solid ${sc}25`,animation:"slideUp 0.2s ease"}}>
                      <div style={{fontSize:"0.72rem",fontWeight:700,color:sc,marginBottom:10}}>📋 상세 분석 리포트</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:12}}>
                        {saju.pillars.map((p,i)=>(
                          <SimPillarCell key={i} p={p} dayStem={saju.dayStem} label={["시주","일주","월주","연주"][i]} isDay={i===1}/>
                        ))}
                      </div>
                      {/* 용신 뱃지 */}
                      <div style={{marginBottom:10}}>
                        <YongsinBadges pillars={saju.pillars} dayStem={saju.dayStem} showAll/>
                      </div>
                      {/* 아이 성향 — 일간+월지+메인십신 기반 */}
                      {(()=>{
                        const dayEl=HS_EL[HS.indexOf(saju.dayStem)];
                        const mb=saju.pillars[2].branch;
                        // 메인 십신: 원국에서 가장 세력 강한 십신
                        const ssCount={};
                        saju.pillars.forEach((p,i)=>{
                          if(i===1)return;
                          const ss=getSS(saju.dayStem,p.stem);
                          if(ss&&ss!=="-")ssCount[ss]=(ssCount[ss]||0)+(i===2?2:1);
                        });
                        const mainSS=Object.entries(ssCount).sort((a,b)=>b[1]-a[1])[0]?.[0]||"";
                        const PERSONALITY_MAP={
                          "비견":"독립심이 강하고 경쟁에서 두각을 나타냅니다. 자기 주관이 뚜렷하며 리더십이 있습니다.",
                          "겁재":"추진력과 행동력이 넘칩니다. 때로는 급하고 충동적이나 에너지가 넘칩니다.",
                          "식신":"창의적이고 표현력이 풍부합니다. 예술적 감성과 여유로운 삶을 추구합니다.",
                          "상관":"총명하고 재치가 넘칩니다. 규칙에 얽매이지 않고 독창적 사고를 합니다.",
                          "편재":"활동적이고 사교적입니다. 재물에 대한 감각이 뛰어나고 임기응변이 좋습니다.",
                          "정재":"성실하고 꼼꼼합니다. 안정을 추구하며 신중하게 계획을 세우고 실행합니다.",
                          "편관":"강한 추진력과 결단력을 가집니다. 도전을 두려워하지 않는 강인한 기질입니다.",
                          "정관":"원칙적이고 책임감이 강합니다. 사회적 규범을 중시하며 신뢰를 쌓아갑니다.",
                          "편인":"직관력이 뛰어나고 학문을 좋아합니다. 독창적 사고와 예술적 기질이 있습니다.",
                          "정인":"지혜롭고 배움을 사랑합니다. 인내심이 강하고 어른들의 사랑을 받는 기질입니다.",
                        };
                        const MONTH_CHAR={子:"조용하고 사색적인",丑:"묵묵하고 성실한",寅:"활기차고 진취적인",卯:"온화하고 감성적인",辰:"포용력 있고 다재다능한",巳:"열정적이고 총명한",午:"밝고 활달한",未:"따뜻하고 배려심 깊은",申:"예리하고 행동력 있는",酉:"꼼꼼하고 심미안 있는",戌:"의리 있고 책임감 강한",亥:"지혜롭고 깊이 있는"};
                        const EL_CHAR={木:"성장과 도전을 즐기는",火:"열정과 표현력이 넘치는",土:"안정과 신뢰를 추구하는",金:"원칙과 결단력을 갖춘",水:"지혜와 유연함을 가진"};
                        const personalityText=`${MONTH_CHAR[mb]||""} ${EL_CHAR[dayEl]||""} 기질을 타고났습니다. ${PERSONALITY_MAP[mainSS]||"균형 잡힌 성품을 가지고 있습니다."}`;
                        return(
                          <div style={{padding:"10px 12px",borderRadius:10,background:`${C.gold}10`,border:`1px solid ${C.gold}25`,marginBottom:10}}>
                            <div style={{fontSize:"0.6rem",color:C.gold,fontWeight:700,marginBottom:5}}>🌟 이 아이의 성향</div>
                            <div style={{fontSize:"0.68rem",color:"rgba(240,220,180,0.90)",lineHeight:1.75,fontFamily:"'Noto Serif KR',serif"}}>{personalityText}</div>
                            <div style={{fontSize:"0.52rem",color:C.muted,marginTop:5}}>일간 {saju.dayStem}({dayEl}) · 월지 {mb} · 메인십신 {mainSS||"없음"}</div>
                          </div>
                        );
                      })()}
                      {res.goods.length>0&&(
                        <div style={{marginBottom:8}}>
                          <div style={{fontSize:"0.6rem",color:"#4ade80",fontWeight:700,marginBottom:5}}>✅ 길한 구조</div>
                          {res.goods.map((g,i)=><div key={i} style={{fontSize:"0.64rem",color:"rgba(74,222,128,0.9)",marginBottom:3,display:"flex",gap:5,lineHeight:1.5}}><span>•</span><span>{g}</span></div>)}
                        </div>
                      )}
                      {res.flags.length>0&&(
                        <div style={{marginBottom:8}}>
                          <div style={{fontSize:"0.6rem",color:"#fb923c",fontWeight:700,marginBottom:5}}>⚠️ 주의 항목</div>
                          {res.flags.map((f,i)=><div key={i} style={{fontSize:"0.64rem",color:"rgba(251,146,60,0.9)",marginBottom:3,display:"flex",gap:5,lineHeight:1.5}}><span>•</span><span>{f}</span></div>)}
                      </div>
                      )}
                      {/* 점수 분해 */}
                      <div style={{display:"flex",gap:6,padding:"8px 10px",borderRadius:9,background:"rgba(255,255,255,0.05)",marginBottom:10}}>
                        <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:"0.48rem",color:C.muted}}>원국점수</div><div style={{fontSize:"0.85rem",fontWeight:700,color:sc}}>{res.rawScore}</div></div>
                        <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:"0.48rem",color:C.gold}}>대운평균</div><div style={{fontSize:"0.85rem",fontWeight:700,color:C.gold}}>{res.daeunAvg||"-"}</div></div>
                        {res.tongGwanBonus>0&&<div style={{flex:1,textAlign:"center"}}><div style={{fontSize:"0.48rem",color:"#86efac"}}>통관보정</div><div style={{fontSize:"0.85rem",fontWeight:700,color:"#86efac"}}>+{res.tongGwanBonus}</div></div>}
                        {res.parentBonus!==0&&<div style={{flex:1,textAlign:"center"}}><div style={{fontSize:"0.48rem",color:"#c084fc"}}>부모적합</div><div style={{fontSize:"0.85rem",fontWeight:700,color:"#c084fc"}}>{res.parentBonus>0?"+":""}{res.parentBonus}</div></div>}
                        <div style={{flex:1,textAlign:"center",borderLeft:"1px solid rgba(255,255,255,0.1)"}}><div style={{fontSize:"0.48rem",color:C.muted}}>최종</div><div style={{fontSize:"0.9rem",fontWeight:900,color:sc}}>{res.score>100?`100+${res.score-100}`:res.score}</div></div>
                      </div>
                      {/* 성씨 입력 + 이름짓기 버튼 */}
                      <div style={{marginBottom:8}}>
                        <div style={{fontSize:"0.58rem",color:C.muted,marginBottom:5,fontWeight:700}}>아이 성씨 (선택)</div>
                        <div style={{display:"flex",gap:6,marginBottom:6}}>
                          <input value={nameSurname} onChange={e=>{setNameSurname(e.target.value);setSelectedSurname(null);setNameSurnameOptions([]);}} placeholder="한글 성씨 입력 (예: 김)" style={{flex:1,padding:"7px 10px",borderRadius:9,border:"1px solid rgba(215,180,105,0.3)",background:"rgba(255,255,255,0.07)",color:C.text,fontSize:"0.85rem",outline:"none"}}
                            onKeyDown={e=>e.key==="Enter"&&fetchSurnameOptions(nameSurname)}
                          />
                          <button onClick={()=>fetchSurnameOptions(nameSurname)} disabled={!nameSurname} style={{padding:"7px 12px",borderRadius:9,background:`${C.gold}22`,border:`1px solid ${C.gold}44`,color:C.goldL,fontSize:"0.72rem",cursor:"pointer",fontWeight:700}}>
                            한자 조회
                          </button>
                        </div>
                        {nameSurnameOptions.length>0&&(
                          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
                            {nameSurnameOptions.filter(opt=>!opt.unknown).map((opt,oi)=>(
                              <button key={oi} onClick={()=>setSelectedSurname(opt)} style={{padding:"4px 10px",borderRadius:8,background:selectedSurname===opt?`${C.gold}30`:"rgba(255,255,255,0.07)",border:selectedSurname===opt?`1.5px solid ${C.gold}`:"1px solid rgba(255,255,255,0.15)",color:selectedSurname===opt?C.goldL:C.text,cursor:"pointer",fontSize:"0.72rem",fontWeight:selectedSurname===opt?700:400}}>
                                {nameSurname}{opt.hanja} <span style={{fontSize:"0.6rem",color:C.muted}}>({opt.char_oheng})</span>
                                {opt.common&&<span style={{fontSize:"0.5rem",color:"#4ade80",marginLeft:3}}>주요</span>}
                              </button>
                            ))}
                            {nameSurnameOptions[0]?.unknown&&(
                              <div style={{fontSize:"0.6rem",color:"#fb923c",padding:"4px 8px",borderRadius:7,background:"rgba(251,146,60,0.1)"}}>
                                등록되지 않은 성씨입니다. 발음오행({nameSurnameOptions[0].sound_oheng})만 반영됩니다.
                              </div>
                            )}
                          </div>
                        )}
                        {selectedSurname&&selectedSurname.char_oheng&&selectedSurname.char_oheng!=="?"&&(
                          <div style={{fontSize:"0.56rem",color:"#4ade80",marginBottom:4}}>✅ {nameSurname}({selectedSurname.hanja}) 선택됨 — 자원오행: {selectedSurname.char_oheng||"-"} / 발음오행: {selectedSurname.sound_oheng||"-"}</div>
                        )}
                      </div>
                      <button onClick={()=>generateNames(saju)} disabled={nameLoading&&nameSaju===saju} style={{width:"100%",padding:"10px 0",borderRadius:10,background:`linear-gradient(135deg,${C.gold}22,${C.goldD}22)`,border:`1.5px solid ${C.gold}55`,color:C.goldL,fontSize:"0.75rem",fontWeight:700,cursor:"pointer",letterSpacing:"0.06em",marginBottom:nameResult&&nameSaju===saju?10:0}}>
                        {nameLoading&&nameSaju===saju?"✨ 이름 생성 중...":"✨ 이름 짓기 (AI 추천 3가지)"}
                      </button>
                      {/* 이름 결과 */}
                      {nameResult&&nameSaju===saju&&(
                        <div style={{display:"flex",flexDirection:"column",gap:8,animation:"slideUp 0.2s ease"}}>
                          {nameResult.map((n,ni)=>{
                            const isExp=expandedName===`${saju.dayStem}-${ni}`;
                            const detail=nameDetailCache[`${saju.dayStem}-${ni}`];
                            const detailLoading=nameDetailLoading[`${saju.dayStem}-${ni}`];
                            const tcpaB=calcTCPA(saju.pillars);
                            const ys=calcYongsin(saju.pillars,tcpaB.sBase);
                            const isJohuUrgentCheck=Math.abs(tcpaB.sBase)>=6;
                            const {desc:nameDesc}=resolveNameYongsin(ys,tcpaB,calcStrengthDetail(saju.pillars).elementScores,saju.pillars);
                            const checks=calcNameChecklist(n,ys.primary,ys.isTrueYongsin,selectedSurname,nameSurname,ys.johu?.primary,isJohuUrgentCheck,ys.tongwan?.primary,calcStrengthDetail(saju.pillars).elementScores,nameDesc);
                            return(
                              <div key={ni} style={{borderRadius:14,background:"rgba(255,255,255,0.05)",border:`1.5px solid ${isExp?C.gold+"88":C.gold+"30"}`,overflow:"hidden",transition:"border-color 0.2s"}}>
                                {/* 이름 헤더 — 탭으로 상세 토글 */}
                                <button onClick={()=>{
                                  const key=`${saju.dayStem}-${ni}`;
                                  if(isExp){setExpandedName(null);}
                                  else{
                                    setExpandedName(key);
                                    if(!detail&&!detailLoading) generateNameDetail(saju,n,key);
                                  }
                                }} style={{width:"100%",textAlign:"left",padding:"12px 14px",background:"none",border:"none",cursor:"pointer"}}>
                                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                    <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                                      <span style={{fontSize:"1.5rem",fontWeight:900,color:C.goldL,fontFamily:"'Noto Serif KR',serif",letterSpacing:"0.1em"}}>{nameSurname||""}{n.hangul}</span>
                                      <span style={{fontSize:"1rem",color:C.gold,fontFamily:"serif"}}>{selectedSurname?.hanja||""}{n.hanja}</span>
                                    </div>
                                    <span style={{fontSize:"0.6rem",color:isExp?C.gold:C.muted}}>{isExp?"▲":"▼"}</span>
                                  </div>
                                  {n.hanja_detail&&<div style={{fontSize:"0.58rem",color:C.muted,marginTop:3}}>{n.hanja_detail}</div>}
                                  <div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>
                                    <span style={{fontSize:"0.52rem",padding:"1px 6px",borderRadius:99,background:"rgba(255,255,255,0.07)",color:C.muted}}>발음 {n.sound_oheng}</span>
                                    <span style={{fontSize:"0.52rem",padding:"1px 6px",borderRadius:99,background:"rgba(255,255,255,0.07)",color:C.muted}}>자원 {n.char_oheng}</span>
                                  </div>
                                  {n.point&&<div style={{fontSize:"0.62rem",color:"rgba(240,220,180,0.8)",marginTop:5,fontFamily:"'Noto Serif KR',serif",lineHeight:1.5}}>✦ {n.point}</div>}
                                </button>
                                {/* 펼쳐진 상세 */}
                                {isExp&&(
                                  <div style={{padding:"0 14px 14px",borderTop:`1px solid ${C.gold}25`}}>
                                    {/* 체크리스트 */}
                                    <div style={{padding:"8px 10px",borderRadius:9,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",margin:"10px 0 8px"}}>
                                      <div style={{fontSize:"0.55rem",color:C.muted,fontWeight:700,marginBottom:5}}>✦ 이름 검증</div>
                                      {checks.map((c,ci)=>(
                                        <div key={ci} style={{display:"flex",gap:5,alignItems:"flex-start",marginBottom:3}}>
                                          <span style={{fontSize:"0.65rem",flexShrink:0,color:c.ok?"#4ade80":"#fb923c"}}>{c.ok?"✅":"⚠️"}</span>
                                          <div><span style={{fontSize:"0.56rem",fontWeight:700,color:c.ok?"#4ade80":"#fb923c"}}>{c.label} </span><span style={{fontSize:"0.56rem",color:"rgba(240,220,180,0.75)"}}>{c.detail}</span></div>
                                        </div>
                                      ))}
                                    </div>
                                    {/* 2단계 상세 */}
                                    {detailLoading&&(
                                      <div style={{textAlign:"center",padding:"14px 0",fontSize:"0.62rem",color:C.muted}}>
                                        <span style={{display:"inline-block",width:12,height:12,border:"2px solid rgba(212,174,110,0.3)",borderTopColor:C.gold,borderRadius:"50%",animation:"spin 0.8s linear infinite",marginRight:6}}/>
                                        상세 분석 중...
                                      </div>
                                    )}
                                    {detail&&!detail.error&&(
                                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                                        {[
                                          {icon:"🔥",label:"왜 이 오행인가",text:detail.reason_oheng,color:C.fire},
                                          {icon:"🔊",label:"왜 이 발음인가",text:detail.reason_sound,color:"#86efac"},
                                          {icon:"漢",label:"왜 이 한자인가",text:detail.reason_hanja,color:C.gold},
                                          {icon:"👨‍👩‍👧",label:"성씨와의 조화",text:detail.reason_surname,color:"#c084fc"},
                                        ].filter(r=>r.text&&r.text!=="—").map(({icon,label,text,color},ri)=>(
                                          <div key={ri} style={{display:"flex",gap:7,padding:"7px 10px",borderRadius:8,background:`${color}08`,border:`1px solid ${color}20`}}>
                                            <span style={{flexShrink:0,fontSize:"0.85rem",lineHeight:1.5}}>{icon}</span>
                                            <div><div style={{fontSize:"0.52rem",color,fontWeight:700,marginBottom:2}}>{label}</div><div style={{fontSize:"0.64rem",color:"rgba(240,220,180,0.88)",lineHeight:1.65,fontFamily:"'Noto Serif KR',serif"}}>{text}</div></div>
                                          </div>
                                        ))}
                                        {(detail.personality||detail.career||detail.daeun_flow)&&(
                                          <div style={{padding:"10px 12px",borderRadius:10,background:`${C.gold}08`,border:`1px solid ${C.gold}20`,marginTop:2}}>
                                            {detail.personality&&<div style={{marginBottom:6}}><div style={{fontSize:"0.52rem",color:C.gold,fontWeight:700,marginBottom:3}}>🌟 성향</div><div style={{fontSize:"0.64rem",color:"rgba(240,220,180,0.9)",lineHeight:1.7,fontFamily:"'Noto Serif KR',serif"}}>{detail.personality}</div></div>}
                                            {detail.career&&<div style={{marginBottom:6}}><div style={{fontSize:"0.52rem",color:"#86efac",fontWeight:700,marginBottom:3}}>💼 진로</div><div style={{fontSize:"0.64rem",color:"rgba(240,220,180,0.9)",lineHeight:1.7,fontFamily:"'Noto Serif KR',serif"}}>{detail.career}</div></div>}
                                            {detail.daeun_flow&&<div><div style={{fontSize:"0.52rem",color:"#c084fc",fontWeight:700,marginBottom:3}}>🌊 대운 흐름</div><div style={{fontSize:"0.64rem",color:"rgba(240,220,180,0.9)",lineHeight:1.85,fontFamily:"'Noto Serif KR',serif",whiteSpace:"pre-line"}}>{detail.daeun_flow}</div></div>}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {detail?.error&&<div style={{fontSize:"0.62rem",color:"#f87171",padding:"8px 0"}}>{detail.error}</div>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div style={{display:"flex",gap:6}}>
                            <button onClick={()=>{
                              const excludeList=(nameResult||[]).map(n=>n.hangul).filter(h=>h&&h!=="오류");
                              generateNames(saju, excludeList);
                            }} disabled={nameMoreLoading} style={{flex:1,padding:"7px 0",borderRadius:9,background:`linear-gradient(135deg,${C.gold}18,${C.gold}08)`,border:`1px solid ${C.gold}55`,color:C.goldL,fontSize:"0.65rem",cursor:"pointer",fontWeight:700}}>
                              {nameMoreLoading?"✨ 생성 중...":"✦ 다른 이름 보기"}
                            </button>
                            <button onClick={()=>{generateNames(saju);setExpandedName(null);}} style={{flex:1,padding:"7px 0",borderRadius:9,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.15)",color:C.muted,fontSize:"0.65rem",cursor:"pointer"}}>↺ 처음부터 다시</button>
                          </div>
                        </div>
                      )}
                      {/* 디버그 패널 */}
                      {nameDebug&&nameSaju===saju&&(
                        <div style={{marginTop:8,padding:"8px 10px",borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,100,100,0.3)"}}>
                          <div style={{fontSize:"0.5rem",color:"#f87171",fontWeight:700,marginBottom:4}}>🔍 디버그 (개발용)</div>
                          <div style={{fontSize:"0.48rem",color:"rgba(220,185,120,0.7)",lineHeight:1.7,wordBreak:"break-all"}}>
                            <div>parts수: {nameDebug.parts?.length} | finishReason: {nameDebug.finishReason}</div>
                            <div>thought파트: {nameDebug.parts?.filter(p=>p.thought).length}개</div>
                            <div style={{marginTop:4,padding:"6px 8px",borderRadius:6,background:"rgba(0,0,0,0.3)",maxHeight:200,overflowY:"auto",whiteSpace:"pre-wrap"}}>
                              {nameDebug.text}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* 리포트 저장 */}
                      <button onClick={()=>saveReport(idx)} style={{width:"100%",marginTop:10,padding:"10px 0",borderRadius:10,background:`linear-gradient(135deg,rgba(74,222,128,0.15),rgba(74,222,128,0.08))`,border:"1.5px solid rgba(74,222,128,0.4)",color:"#4ade80",fontSize:"0.75rem",fontWeight:700,cursor:"pointer",letterSpacing:"0.06em"}}>
                        📥 리포트 이미지로 저장
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function CompatResult({compat,s1,s2,name1,name2}){
  const{score,details}=compat,{label,color}=compatLabel(score),r=48,circ=2*Math.PI*r;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <Card><div style={{display:"flex",alignItems:"center",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
        <div style={{position:"relative",width:110,height:110}}><svg width="110" height="110" viewBox="0 0 110 110"><circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="9"/><circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="9" strokeDasharray={circ} strokeDashoffset={circ*(1-score/100)} strokeLinecap="round" transform="rotate(-90 55 55)" style={{transition:"stroke-dashoffset 1.5s ease"}}/></svg><div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:"1.8rem",fontWeight:900,color,lineHeight:1}}>{score}</span><span style={{fontSize:"0.46rem",color,opacity:0.7}}>/ 100</span></div></div>
        <div><div style={{fontSize:"1.1rem",fontWeight:900,color,fontFamily:"'Noto Serif KR',serif",marginBottom:5}}>{label}</div><div style={{fontSize:"0.62rem",color:C.muted,lineHeight:1.8}}>{name1} × {name2}<br/>일간 <span style={{color:EL_COL[HS_EL[s1.pillars[1].stemIdx]]}}>{s1.pillars[1].stem}</span>·<span style={{color:EL_COL[HS_EL[s2.pillars[1].stemIdx]]}}>{s2.pillars[1].stem}</span></div></div>
      </div></Card>
      <Card><CardTitle>궁합 세부 분석</CardTitle><div style={{display:"flex",flexDirection:"column",gap:8}}>{details.map((d,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 11px",borderRadius:11,background:d.positive?`${C.gold}12`:`${C.red}10`,border:`1px solid ${d.positive?C.gold:C.red}30`}}><span style={{fontSize:"1rem",flexShrink:0,color:d.positive?C.gold:C.red,lineHeight:1.2,marginTop:1}}>{d.icon}</span><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}><span style={{fontSize:"0.7rem",fontWeight:700,color:d.positive?C.gold:C.red,fontFamily:"'Noto Serif KR',serif"}}>{d.type}</span>{d.pts!==0&&<span style={{fontSize:"0.56rem",color:d.positive?"#4ade80":C.red,background:d.positive?"rgba(74,222,128,0.1)":"rgba(224,80,64,0.1)",padding:"1px 5px",borderRadius:5,fontWeight:700}}>{d.pts>0?"+":""}{d.pts}점</span>}</div><p style={{fontSize:"0.66rem",color:C.muted,lineHeight:1.6}}>{d.desc}</p></div></div>)}</div></Card>
      <Card><CardTitle>오행 세력 비교</CardTitle><Pentagon pillars={s1.pillars} dayStem={s1.dayStem} pillars2={s2.pillars}/></Card>
    </div>
  );
}

export default function App({initialForm=null,onReturn=null}={}){
  const[screen,setScreen]=useState("input");
  const[form,setForm]=useState(()=>initialForm||{name:"",year:"1990",month:"1",day:"1",hour:"12",minute:"0",gender:"male"});
  const[form2,setForm2]=useState(()=>OFFLINE_APP?{name:"",year:"",month:"",day:"",hour:"",minute:"",gender:""}:{name:"",year:"1992",month:"6",day:"15",hour:"12",minute:"0",gender:"female"});
  useEffect(()=>{ensureLunar(()=>{});},[]);
  const[saju,setSaju]=useState(null),[saju2,setSaju2]=useState(null);
  const[daeunList,setDaeunList]=useState([]),[selDaeun,setSelDaeun]=useState(null);
  const[selSeun,setSelSeun]=useState(null);
  const[imgKey,setImgKey]=useState(0),[tab,setTab]=useState("chart");
  const[chartTab,setChartTab]=useState("천간");
  const[err,setErr]=useState(""),[compat,setCompat]=useState(null),[compatErr,setCompatErr]=useState("");

  useEffect(()=>{if(initialForm)handleCalc();},[]);
  function returnToInput(){if(OFFLINE_APP&&onReturn){onReturn();return;}setScreen("input");}

  function handleCalc(){
    setErr("");
    const de=validateDate(form.year,form.month,form.day);if(de){setErr(de);return;}
    const te=validateTime(form.hour,form.minute);if(te){setErr(te);return;}
    try{
      const r=calcSaju(+form.year,+form.month,+form.day,+form.hour,+form.minute);
      const dl=["male","female"].includes(form.gender)?calcDaeun(+form.year,+form.month,+form.day,form.gender,r.pillars[2]):[];
      setSaju(r);setDaeunList(dl);
      const curAge=new Date().getFullYear()-+form.year;
      const cur=dl.find((d,i)=>d.startAge<=curAge&&(dl[i+1]?dl[i+1].startAge>curAge:true));
      setSelDaeun(cur||null);setSelSeun(null);setImgKey(0);setSaju2(null);setCompat(null);setTab("chart");setScreen("result");
    }catch(e){setErr("계산 오류: "+e.message);}
  }
  function handleCompat(){
    setCompatErr("");
    const de=validateDate(form2.year,form2.month,form2.day);if(de){setCompatErr(de);return;}
    if(form2.hour===""||form2.minute===""){setCompatErr("궁합 분석에는 확인된 출생 시와 분이 필요합니다.");return;}
    const te=validateTime(form2.hour,form2.minute);if(te){setCompatErr(te);return;}
    if(![form2.year,form2.month,form2.day,form2.hour,form2.minute].every(v=>Number.isInteger(+v))){setCompatErr("날짜와 시각은 정수로 입력해주세요.");return;}
    try{const r2=calcSaju(+form2.year,+form2.month,+form2.day,+form2.hour,+form2.minute);setSaju2(r2);setCompat(calcCompatScore(saju,r2));}
    catch(e){setCompatErr("오류: "+e.message);}
  }

  if(screen==="input") return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.text}}>
      <style>{globalStyle}</style>
      <div style={{padding:"60px 24px 24px",textAlign:"center",background:`linear-gradient(180deg,#3c2410 0%,${C.bg} 100%)`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% -10%, rgba(201,169,110,0.07) 0%, transparent 65%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-55%)",fontSize:"18rem",fontFamily:"'Noto Serif KR',serif",fontWeight:900,color:"transparent",WebkitTextStroke:"1px rgba(220,185,120,0.08)",userSelect:"none",pointerEvents:"none",lineHeight:1}}>命</div>
        <div style={{position:"relative",zIndex:1,animation:"fadeIn 0.7s ease"}}>
          <div style={{fontSize:"5.5rem",fontFamily:"'Noto Serif KR',serif",fontWeight:900,color:C.gold,lineHeight:1,marginBottom:8,textShadow:"0 0 60px rgba(201,169,110,0.5)",animation:"float 4s ease-in-out infinite"}}>命</div>
          <h1 style={{fontSize:"1.5rem",fontWeight:900,fontFamily:"'Noto Serif KR',serif",letterSpacing:"0.55em",color:C.goldL,marginBottom:8}}>사주명리</h1>
          <p style={{fontSize:"0.62rem",color:C.muted,letterSpacing:"0.18em"}}>四柱命理 · 조후분석 · 물상이미지 · 출산택일</p>
        </div>
      </div>
      <div style={{padding:"12px 20px 100px",display:"flex",flexDirection:"column",gap:14,maxWidth:480,margin:"0 auto",animation:"fadeIn 0.6s ease 0.1s both"}}>
        <Field label="이름 (선택)"><SI placeholder="성함을 입력하세요" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
        <Field label="생년월일">
          <div style={{display:"flex",gap:8}}>
            <SI type="number" placeholder="년도 (1900~2030)" value={form.year} onChange={e=>setForm({...form,year:e.target.value})} style={{flex:2}}/>
            <SI type="number" placeholder="월" value={form.month} onChange={e=>setForm({...form,month:e.target.value})} style={{flex:1}}/>
            <SI type="number" placeholder="일" value={form.day} onChange={e=>setForm({...form,day:e.target.value})} style={{flex:1}}/>
          </div>
        </Field>
        <Field label="출생 시각 (직접 입력)">
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <SI type="number" placeholder="시 (0~23)" value={form.hour} onChange={e=>setForm({...form,hour:e.target.value})} style={{flex:1}}/>
            <span style={{color:C.muted,fontSize:"1.1rem",flexShrink:0}}>:</span>
            <SI type="number" placeholder="분 (0~59)" value={form.minute} onChange={e=>setForm({...form,minute:e.target.value})} style={{flex:1}}/>
            {form.hour!==""&&!isNaN(+form.hour)&&+form.hour>=0&&+form.hour<=23&&(
              <div style={{flexShrink:0,padding:"8px 12px",borderRadius:10,background:`${C.gold}18`,border:`1px solid ${C.gold}30`,textAlign:"center",minWidth:52}}>
                <div style={{fontSize:"1.1rem",color:C.gold,fontFamily:"serif",fontWeight:900,lineHeight:1}}>{EB[getHB(+form.hour,+form.minute||0)]}</div>
                <div style={{fontSize:"0.45rem",color:C.muted,marginTop:2}}>{EB_KR[getHB(+form.hour,+form.minute||0)]}시</div>
              </div>
            )}
          </div>
          {form.hour!==""&&!isNaN(+form.hour)&&<div style={{marginTop:4,fontSize:"0.56rem",color:C.muted}}>{form.hour}시 {form.minute||0}분 → {EB[getHB(+form.hour,+(form.minute||0))]}時 ({EB_KR[getHB(+form.hour,+(form.minute||0))]}시)</div>}
        </Field>
        <Field label="성별"><div style={{display:"flex",gap:8}}><GenderBtn v="male" l="남성 ♂" form={form} setForm={setForm}/><GenderBtn v="female" l="여성 ♀" form={form} setForm={setForm}/></div></Field>
        {err&&<div style={{background:"rgba(180,40,20,0.1)",color:"#ff6a50",padding:"11px 16px",borderRadius:12,fontSize:"0.8rem",border:"1px solid rgba(180,40,20,0.22)"}}>{err}</div>}
        {/* 테스트 명식 버튼 */}
        <div style={{display:"flex",gap:6}}>
          {[
            {label:"테스트 ①",sub:"1984.1.30 未時",y:1984,m:1,d:30,h:13,min:31,gender:"male"},
            {label:"테스트 ②",sub:"1989.10.13 戌時",y:1989,m:10,d:13,h:19,min:31,gender:"male"},
          ].map((t,i)=>(
            <button key={i} onClick={()=>{
              const tf={name:"",year:String(t.y),month:String(t.m),day:String(t.d),hour:String(t.h),minute:String(t.min),gender:t.gender};
              setForm(tf);
              setErr("");
              try{
                const r=calcSaju(t.y,t.m,t.d,t.h,t.min);
                const dl=calcDaeun(t.y,t.m,t.d,t.gender,r.pillars[2]);
                setSaju(r);setDaeunList(dl);
                const curAge=new Date().getFullYear()-t.y;
                const cur=dl.find((d,i)=>d.startAge<=curAge&&(dl[i+1]?dl[i+1].startAge>curAge:true));
                setSelDaeun(cur||null);setSelSeun(null);setImgKey(0);setSaju2(null);setCompat(null);setTab("chart");setScreen("result");
              }catch(e){setErr("계산 오류: "+e.message);}
            }} style={{flex:1,padding:"10px 6px",borderRadius:12,background:"rgba(255,255,255,0.05)",border:`1px dashed ${C.gold}44`,color:C.muted,cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:"0.6rem",color:C.gold,fontWeight:700,marginBottom:2}}>{t.label}</div>
              <div style={{fontSize:"0.52rem",color:C.muted}}>{t.sub}</div>
            </button>
          ))}
        </div>
        <GoldBtn onClick={handleCalc} style={{width:"100%",padding:18,fontSize:"1rem",letterSpacing:"0.2em",borderRadius:18,marginTop:4}}>命 팔자 산출하기</GoldBtn>
      </div>
    </div>
  );

  if(screen==="result"&&saju){
    // 렌더링 에러 방어
    let pillars,dayStem,solar,lunar;
    try{({pillars,dayStem,solar,lunar}=saju);}
    catch(e){return <div style={{minHeight:"100vh",background:C.bg,color:C.text,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}><p style={{color:"#ff6a50"}}>사주 계산 오류가 발생했습니다.</p><button onClick={returnToInput} style={{padding:"10px 20px",borderRadius:10,background:`${C.gold}22`,border:`1px solid ${C.gold}44`,color:C.gold,cursor:"pointer"}}>← 다시 입력</button></div>;}
    if(!pillars||pillars.length!==4){return <div style={{minHeight:"100vh",background:C.bg,color:C.text,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}><p style={{color:"#ff6a50"}}>사주 데이터가 올바르지 않습니다.</p><button onClick={returnToInput} style={{padding:"10px 20px",borderRadius:10,background:`${C.gold}22`,border:`1px solid ${C.gold}44`,color:C.gold,cursor:"pointer"}}>← 다시 입력</button></div>;}
    const zodiacIdx=pillars[3].branchIdx;
    let sResult,strength,strengthColor,johuDetail,tcpaNowResult,tcpaLabelNow;
    try{
      sResult=calcStrengthDetail(pillars);
      strength=sResult.strength;
      strengthColor=strengthColor5(strength);
      johuDetail=calcJohuDetail(pillars,selDaeun?.branch||null);
      tcpaNowResult=calcTCPA(pillars,selDaeun?.stem,selDaeun?.branch,selSeun?.stem,selSeun?.branch);
      tcpaLabelNow=tcpaLabel(tcpaNowResult.sTotal);
    }catch(e){
      return <div style={{minHeight:"100vh",background:C.bg,color:C.text,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}>
        <p style={{color:"#ff6a50",fontSize:"0.9rem"}}>분석 중 오류: {e.message}</p>
        <button onClick={returnToInput} style={{padding:"10px 20px",borderRadius:10,background:`${C.gold}22`,border:`1px solid ${C.gold}44`,color:C.gold,cursor:"pointer"}}>← 다시 입력</button>
      </div>;
    }
    const activeDaeunBranch=selDaeun?.branch||null;
    const activeSeunBranch=selSeun?.branch||null;
    const sResultWithRun=(()=>{
      const elScore={...sResult.elementScores};
      if(activeDaeunBranch){const de=EB_EL[EB.indexOf(activeDaeunBranch)];if(de)elScore[de]=(elScore[de]||0)+1.25;}
      if(activeSeunBranch){const se=EB_EL[EB.indexOf(activeSeunBranch)];if(se)elScore[se]=(elScore[se]||0)+0.5;}
      return{...sResult,elementScores:elScore};
    })();
    const TABS=[{k:"chart",l:"오행",i:"⬠"},{k:"johu",l:"조후",i:"☯"},{k:"image",l:"물상",i:"🎬"},{k:"taekil",l:"택일",i:"✦"},{k:"compat",l:"궁합",i:"♡"}].filter(t=>!OFFLINE_APP||!["image","taekil"].includes(t.k));
    const curYear=new Date().getFullYear();
    // 세운: 현재 연도 기준 앞뒤 ±4년 (총 10개), 100세 초과 제거
    const seunList=Array.from({length:10},(_,i)=>calcSeun(curYear-4+i))
      .filter(s=>s.year-+form.year<=100);

    return(
      <div style={{minHeight:"100vh",background:C.bg,color:C.text}}>
        <style>{globalStyle}</style>
        <div style={{padding:"44px 16px 0",background:`linear-gradient(180deg,#2a1c0a 0%,${C.bg} 100%)`}}>
          <button onClick={returnToInput} style={{fontSize:"0.7rem",color:C.muted,marginBottom:8,display:"block",background:"none",border:"none",cursor:"pointer"}}>← 다시 입력</button>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:18}}>{ZODIAC_E[zodiacIdx]}</span>
            <div style={{flex:1,minWidth:0}}>
              <h2 style={{fontSize:"0.95rem",fontWeight:900,fontFamily:"'Noto Serif KR',serif",color:C.goldL}}>{form.name?`${form.name}님의 사주`:"사주팔자"}</h2>
              <p style={{fontSize:"0.5rem",color:C.muted,marginTop:1}}>양력 {solar.year}.{solar.month}.{solar.day} {solar.hour}시{+solar.minute>0?` ${solar.minute}분`:""} · 음력 {lunar.year}.{lunar.isLeap?"윤":""}{lunar.month}.{lunar.day} · {ZODIAC[zodiacIdx]}띠</p>
            </div>
            <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
              <YongsinBadges pillars={pillars} dayStem={dayStem} compact/>
              <span style={{fontSize:"0.58rem",fontWeight:700,color:tcpaLabelNow.color}}>{tcpaLabelNow.emoji} {tcpaLabelNow.label}</span>
            </div>
          </div>
          <div style={{display:"flex",borderBottom:`1px solid rgba(215,180,105,0.15)`}}>
            {TABS.map(({k,l,i})=><GhBtn key={k} active={tab===k} onClick={()=>setTab(k)}>{i} {l}</GhBtn>)}
          </div>
        </div>

        <div style={{padding:"10px 14px 100px",display:"flex",flexDirection:"column",gap:10,maxWidth:520,margin:"0 auto"}}>
          <div style={{animation:"fadeIn 0.3s ease"}}>

            {tab==="chart"&&(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {/* 원국 팔자 — 대운/세운 선택 시 좌측에 추가 표시 */}
                <Card style={{padding:"12px 8px 14px"}}>
                  <SajuBoard pillars={pillars} dayStem={dayStem} showMulsang selDaeun={selDaeun} selSeun={selSeun}/>
                </Card>
                {/* 오행 오각형 — 대운/세운 반영 */}
                <Card style={{padding:12}}>
                  <div style={{display:"flex",gap:4,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:"0.55rem",color:C.muted}}>오행 세력도</span>
                    {selDaeun&&<span style={{fontSize:"0.55rem",color:C.gold,background:`${C.gold}18`,padding:"1px 7px",borderRadius:99}}>대운 {selDaeun.stem}{selDaeun.branch} 반영</span>}
                    {selSeun&&<span style={{fontSize:"0.55rem",color:"#86efac",background:"rgba(134,239,172,0.15)",padding:"1px 7px",borderRadius:99}}>세운 {selSeun.stem}{selSeun.branch} 반영</span>}
                  </div>
                  <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <Pentagon pillars={pillars} dayStem={dayStem} elementScores={sResultWithRun.elementScores} strength={strength} compact/>
                    {(()=>{
                      const branches=pillars.map(p=>p.branch);
                      const stems=pillars.map(p=>p.stem);
                      const HS_HAP6t={甲:"己",己:"甲",乙:"庚",庚:"乙",丙:"辛",辛:"丙",丁:"壬",壬:"丁",戊:"癸",癸:"戊"};
                      const HS_HAP_ELt={甲:"土",己:"土",乙:"金",庚:"金",丙:"水",辛:"水",丁:"木",壬:"木",戊:"火",癸:"火"};
                      // 천간 관계
                      const stemItems=[];
                      const HS_CHUNG={甲:"庚",庚:"甲",乙:"辛",辛:"乙",丙:"壬",壬:"丙",丁:"癸",癸:"丁"};
                      for(let i=0;i<stems.length;i++)for(let j=i+1;j<stems.length;j++){
                        if(HS_HAP6t[stems[i]]===stems[j]){const el=HS_HAP_ELt[stems[i]];stemItems.push({type:"합",label:`${stems[i]}${stems[j]}합→${el}`,color:EL_COL[el]||C.gold});}
                        if(HS_CHUNG[stems[i]]===stems[j]){const el=HS_EL[HS.indexOf(stems[i])];stemItems.push({type:"충",label:`${stems[i]}${stems[j]}충`,color:EL_COL[el]||"#f87171"});}
                      }
                      // 지지 관계 (반합 왕지 체크 포함)
                      const branchItems=[];
                      const ZI_HAP6={子:"丑",丑:"子",寅:"亥",亥:"寅",卯:"戌",戌:"卯",辰:"酉",酉:"辰",巳:"申",申:"巳",午:"未",未:"午"};
                      const ZI_HAP_EL={"子丑":"土","寅亥":"木","卯戌":"火","辰酉":"金","巳申":"水","午未":"火","丑子":"土","亥寅":"木","戌卯":"火","酉辰":"金","申巳":"水","未午":"火"};
                      for(let i=0;i<branches.length;i++)for(let j=i+1;j<branches.length;j++){
                        if(ZI_HAP6[branches[i]]===branches[j]){const el=ZI_HAP_EL[branches[i]+branches[j]]||"";branchItems.push({type:"육합",label:`${branches[i]}${branches[j]}합→${el}`,color:EL_COL[el]||"#c084fc"});}
                      }
                      const SAN_HAP=[{els:["寅","午","戌"],el:"火",t:"삼합"},{els:["申","子","辰"],el:"水",t:"삼합"},{els:["巳","酉","丑"],el:"金",t:"삼합"},{els:["亥","卯","未"],el:"木",t:"삼합"}];
                      const BANG_HAP=[{els:["寅","卯","辰"],el:"木",t:"방합"},{els:["巳","午","未"],el:"火",t:"방합"},{els:["申","酉","戌"],el:"金",t:"방합"},{els:["亥","子","丑"],el:"水",t:"방합"}];
                      for(const g of [...SAN_HAP,...BANG_HAP]){
                        const cnt=g.els.filter(b=>branches.includes(b));
                        if(cnt.length===3){branchItems.push({type:g.t,label:`${cnt.join("")}→${g.el}`,color:EL_COL[g.el]});}
                        else if(cnt.length===2){
                          // 반합: 왕지 포함 필수
                          const hasWangji=cnt.some(b=>WANGJI.includes(b));
                          if(hasWangji) branchItems.push({type:"반합",label:`${cnt.join("")}(${g.el})`,color:EL_COL[g.el]});
                        }
                      }
                      for(let i=0;i<branches.length;i++)for(let j=i+1;j<branches.length;j++){
                        if(CHUNG_MAP[branches[i]]===branches[j]){const el=EB_EL[EB.indexOf(branches[i])];branchItems.push({type:"충",label:`${branches[i]}${branches[j]}충`,color:EL_COL[el]||"#f87171"});}
                      }
                      for(const g of SAMHYUNG3){
                        const cnt=g.filter(b=>branches.includes(b));
                        if(cnt.length===3) branchItems.push({type:"삼형",label:`${cnt.join("")}형`,color:"#f55030"});
                      }
                      // 신살 뱃지
                      const sinsal=calcSinsal(pillars);
                      const sinsalBadges=[];
                      for(const cu of sinsal.cheonUl) sinsalBadges.push({label:`천을귀인 ${cu.branch}`,good:true});
                      for(const dh of sinsal.doHwa) sinsalBadges.push({label:`도화 ${dh.branch}`,good:true});
                      for(const ym of sinsal.yeokMa) sinsalBadges.push({label:`역마 ${ym.branch}`,good:true});
                      for(const yi of sinsal.yangIn) sinsalBadges.push({label:`양인 ${yi.pillar.branch}`,good:false});
                      for(const bh of sinsal.baekHo) sinsalBadges.push({label:`백호 ${bh.pillar.stem}${bh.pillar.branch}`,good:false});
                      for(const gg of sinsal.goeGang) sinsalBadges.push({label:`괴강 ${gg.pillar.stem}${gg.pillar.branch}`,good:false});
                      for(const wj of sinsal.wonJin) sinsalBadges.push({label:`원진 ${wj.a}${wj.b}`,good:false});
                      const tabs=["천간","지지","신살"];
                      const curItems=chartTab==="천간"?stemItems:chartTab==="지지"?branchItems:null;
                      return(
                        <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                          <YongsinBadges pillars={pillars} dayStem={dayStem}/>
                          {/* 탭 스위치 */}
                          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                            {tabs.map(t=>(
                              <button key={t} onClick={()=>setChartTab(t)} style={{padding:"2px 9px",borderRadius:99,fontSize:"0.5rem",fontWeight:700,cursor:"pointer",background:chartTab===t?`${C.gold}28`:"rgba(255,255,255,0.06)",border:chartTab===t?`1px solid ${C.gold}70`:"1px solid rgba(255,255,255,0.15)",color:chartTab===t?C.gold:C.muted}}>{t}</button>
                            ))}
                          </div>
                          {/* 탭 콘텐츠 */}
                          {chartTab!=="신살"&&curItems&&(
                            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                              {curItems.length===0
                                ?<span style={{fontSize:"0.5rem",color:"rgba(220,185,120,0.3)"}}>없음</span>
                                :curItems.map((it,idx)=>(
                                  <div key={idx} style={{display:"flex",alignItems:"center",gap:2,padding:"2px 7px",borderRadius:5,background:`${it.color}18`,border:`1px solid ${it.color}40`}}>
                                    <span style={{fontSize:"0.44rem",color:it.color,opacity:0.75}}>{it.type}</span>
                                    <span style={{fontSize:"0.62rem",color:it.color,fontWeight:700,fontFamily:"serif"}}>{it.label.replace(it.type,"")}</span>
                                  </div>
                                ))
                              }
                            </div>
                          )}
                          {chartTab==="신살"&&(
                            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                              {sinsalBadges.length===0
                                ?<span style={{fontSize:"0.5rem",color:"rgba(220,185,120,0.3)"}}>없음</span>
                                :sinsalBadges.map((b,idx)=>(
                                  <div key={idx} style={{padding:"2px 7px",borderRadius:5,fontSize:"0.58rem",fontWeight:700,background:b.good?"rgba(74,222,128,0.12)":"rgba(248,113,113,0.12)",border:`1px solid ${b.good?"rgba(74,222,128,0.4)":"rgba(248,113,113,0.4)"}`,color:b.good?"#4ade80":"#f87171"}}>{b.label}</div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </Card>

                {/* 대운 + 세운 */}
                <Card>
                  <CardTitle style={{marginBottom:8}}>대운 · 세운</CardTitle>
                  {/* 대운 한 줄 */}
                  <div style={{fontSize:"0.52rem",color:C.muted,marginBottom:5,fontWeight:700}}>▶ 대운</div>
                  <DaeunPanel daeunList={daeunList} birthYear={+form.year} selDaeun={selDaeun} setSelDaeun={setSelDaeun}/>
                  {/* 세운 한 줄 */}
                  <div style={{fontSize:"0.52rem",color:C.muted,margin:"12px 0 5px",fontWeight:700}}>▶ 세운</div>
                  <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:4}}>
                    {seunList.map(s=>{
                      const isNow=s.year===curYear,sc=EL_COL[HS_EL[s.stemIdx]],bc=EL_COL[EB_EL[s.branchIdx]];
                      const isSel=selSeun?.year===s.year;
                      return(
                        <button key={s.year} onClick={()=>setSelSeun(isSel?null:s)} style={{flexShrink:0,width:54,textAlign:"center",padding:"6px 3px 5px",borderRadius:12,background:isSel?`rgba(134,239,172,0.18)`:isNow?`${C.gold}22`:"rgba(255,255,255,0.05)",border:isSel?`1.5px solid #86efac`:isNow?`1.5px solid ${C.gold}55`:"1.5px solid rgba(255,255,255,0.10)",position:"relative",cursor:"pointer"}}>
                          {isNow&&!isSel&&<div style={{position:"absolute",top:4,right:4,width:5,height:5,borderRadius:"50%",background:"#4ade80"}}/>}
                          <div style={{fontSize:"0.42rem",color:isSel?"#86efac":C.muted,marginBottom:2}}>{s.year}</div>
                          <div style={{fontSize:"1.4rem",color:sc,fontFamily:"serif",fontWeight:KANJI_YANG[s.stem]?900:300,lineHeight:1}}>{s.stem}</div>
                          <div style={{fontSize:"1.4rem",color:bc,fontFamily:"serif",fontWeight:KANJI_YANG[s.branch]?900:300,lineHeight:1}}>{s.branch}</div>
                          <div style={{fontSize:"0.38rem",color:sc,opacity:0.7}}>{HS_EL[s.stemIdx]}</div>
                          <div style={{fontSize:"0.38rem",color:bc,opacity:0.7}}>{EB_EL[s.branchIdx]}</div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* 대운 상세 */}
                {selDaeun&&(()=>{
                  const grade=calcDaeunGrade(pillars,dayStem,selDaeun.stem,selDaeun.branch);
                  const tcpaBase=calcTCPA(pillars);
                  const ys=calcYongsin(pillars,tcpaBase.sBase);
                  // 억부/조후/통관 각각 표시용
                  const eobbuEl=ys.eobbu?.primary;
                  const johuEl=ys.johu?.primary;
                  const tongwanEl=ys.tongwan?.primary;
                  const dStemEl=HS_EL[HS.indexOf(selDaeun.stem)];
                  const dBranchEl=EB_EL[EB.indexOf(selDaeun.branch)];
                  // 각 용신 대비 대운 평가
                  const tcpaWithDaeun=calcTCPA(pillars,selDaeun.stem,selDaeun.branch);
                  function evalEl(yongsinEl,label,color){
                    if(!yongsinEl)return null;
                    const inStem=dStemEl===yongsinEl,inBranch=dBranchEl===yongsinEl;
                    // 기신 = 용신을 극하는 오행
                    const gisin=EL_CTRL_ME[yongsinEl];
                    const gisinInStem=dStemEl===gisin,gisinInBranch=dBranchEl===gisin;
                    let mark,markColor,desc;
                    if(inBranch&&inStem){mark="✚";markColor="#4ade80";desc=`천간·지지 모두 ${yongsinEl} — 강하게 작용`;}
                    else if(inBranch){mark="✚";markColor="#4ade80";desc=`지지 ${selDaeun.branch}(${yongsinEl}) 도래 — 뿌리 형성`;}
                    else if(inStem){mark="＋";markColor="#86efac";desc=`천간 ${selDaeun.stem}(${yongsinEl}) 진입`;}
                    else if(gisinInBranch){mark="－";markColor="#f87171";desc=`지지 ${selDaeun.branch}(${gisin})가 용신 ${yongsinEl}을 극함`;}
                    else if(gisinInStem){mark="－";markColor="#f87171";desc=`천간 ${selDaeun.stem}(${gisin})가 용신 ${yongsinEl}을 극함`;}
                    else{mark="△";markColor="rgba(220,185,120,0.5)";desc="직접 관여 없음";}
                    return(
                      <div key={label} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",borderRadius:7,background:`${color}08`,border:`1px solid ${color}20`}}>
                        <span style={{fontSize:"0.9rem",fontWeight:900,color:markColor,lineHeight:1,minWidth:14,textAlign:"center"}}>{mark}</span>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            <span style={{fontSize:"0.52rem",color,fontWeight:700}}>{label}용신</span>
                            <span style={{fontSize:"0.82rem",fontFamily:"serif",color:EL_COL[yongsinEl]||color,fontWeight:900}}>{yongsinEl}</span>
                          </div>
                          <div style={{fontSize:"0.58rem",color:"rgba(240,220,180,0.75)",marginTop:1}}>{desc}</div>
                        </div>
                      </div>
                    );
                  }
                  return(
                    <Card>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        <div style={{flexShrink:0,padding:"4px 10px",borderRadius:8,background:`${grade.color}22`,border:`1.5px solid ${grade.color}55`}}>
                          <span style={{fontSize:"1.1rem",fontWeight:900,color:grade.color,fontFamily:"'Noto Serif KR',serif"}}>{grade.grade}</span>
                        </div>
                        <div>
                          <div style={{fontSize:"0.72rem",fontWeight:700,color:grade.color,fontFamily:"'Noto Serif KR',serif"}}>{selDaeun.stem}{selDaeun.branch} 대운 · {grade.label}</div>
                          <div style={{fontSize:"0.56rem",color:"rgba(230,195,130,0.8)",marginTop:1}}>{grade.desc}</div>
                        </div>
                      </div>
                      {/* 용신별 평가 */}
                      <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
                        {evalEl(eobbuEl,"억부",C.gold)}
                        {johuEl&&johuEl!==eobbuEl&&evalEl(johuEl,"조후",C.water)}
                        {tongwanEl&&tongwanEl!==eobbuEl&&tongwanEl!==johuEl&&evalEl(tongwanEl,"통관","#c084fc")}
                      </div>
                      {/* 분석 근거 */}
                      {grade.reasons&&grade.reasons.length>0&&(
                        <div style={{borderTop:`1px dashed ${grade.color}40`,paddingTop:10}}>
                          <div style={{fontSize:"0.58rem",color:grade.color,fontWeight:700,marginBottom:5}}>💡 분석 근거</div>
                          {grade.reasons.map((r,idx)=>{
                            const isPos=r.startsWith("✨")||(!r.startsWith("⚠️")&&!r.includes("기구신")&&!r.includes("불균형")&&!r.includes("주의")&&!r.includes("원치 않는")&&!r.includes("충격"));
                            const sign=r.startsWith("⚠️")||r.includes("기구신")||r.includes("불균형")||r.includes("주의")||r.includes("원치 않는")||r.includes("충격")?"－":"＋";
                            const signColor=sign==="＋"?"#4ade80":"#f87171";
                            return(
                              <div key={idx} style={{fontSize:"0.63rem",color:"rgba(240,220,180,0.9)",marginBottom:4,display:"flex",gap:5,lineHeight:1.4,alignItems:"flex-start"}}>
                                <span style={{color:signColor,fontWeight:900,flexShrink:0,fontSize:"0.72rem",lineHeight:1.3}}>{sign}</span>
                                <span>{r}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  );
                })()}

                <Card><CardTitle style={{marginBottom:8}}>대운 인생 그래프</CardTitle><LifeGraph daeunList={daeunList} pillars={pillars} dayStem={dayStem} birthYear={+form.year} selDaeun={selDaeun} setSelDaeun={setSelDaeun}/></Card>
              </div>
            )}

            {tab==="johu"&&<JohuTab pillars={pillars} johuDetail={johuDetail} selDaeun={selDaeun} selSeun={selSeun} birthYear={+form.year} daeunList={daeunList}/>}

            {tab==="image"&&(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <PhysImageCard key={`origin-${imgKey}`} title="나의 원국 물상" prompt={buildOriginPrompt(dayStem,pillars[2].branch,form.gender,johuDetail.tempScore,johuDetail.humScore)} dayStem={dayStem} label="origin" note={`일간 ${dayStem}(${HS_EL[pillars[1].stemIdx]}) · 월지 ${pillars[2].branch}`}/>
                <Card>
                  <CardTitle>대운 반영 물상</CardTitle>
                  <p style={{fontSize:"0.62rem",color:C.muted,textAlign:"center",marginBottom:12,lineHeight:1.8}}>대운의 기운이 원국에 스며들 때<br/>서사적 전환을 담은 이미지입니다</p>
                  <DaeunPanel daeunList={daeunList} birthYear={+form.year} selDaeun={selDaeun} setSelDaeun={d=>{setSelDaeun(d);setImgKey(k=>k+1);}}/>
                  {selDaeun?<div style={{marginTop:12}}><PhysImageCard key={`daeun-${imgKey}-${selDaeun.startYear}`} title={`${selDaeun.stem}${selDaeun.branch} 대운 융합 물상`} prompt={buildDaeunFusionPrompt(dayStem,pillars[2].branch,selDaeun.branch,form.gender,johuDetail.tempScore,johuDetail.humScore)} dayStem={dayStem} label="daeun" note={`원국 ${pillars[2].branch} + 대운 ${selDaeun.branch}`}/></div>:<div style={{marginTop:12,padding:"14px",borderRadius:12,background:"rgba(255,255,255,0.07)",border:"1px dashed rgba(220,185,120,0.35)",textAlign:"center"}}><p style={{fontSize:"0.65rem",color:C.muted}}>위에서 대운을 선택하면 융합 이미지를 생성할 수 있습니다</p></div>}
                </Card>
              </div>
            )}

            {tab==="taekil"&&<TaekIlSimulator/>}

            {tab==="compat"&&(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                <Card>
                  <CardTitle>상대방 정보 입력</CardTitle>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <Field label="이름 (선택)"><SI value={form2.name} onChange={e=>setForm2({...form2,name:e.target.value})} placeholder="상대방 이름"/></Field>
                    <Field label="생년월일"><div style={{display:"flex",gap:8}}><SI type="number" placeholder="년도" value={form2.year} onChange={e=>setForm2({...form2,year:e.target.value})} style={{flex:2}}/><SI type="number" placeholder="월" value={form2.month} onChange={e=>setForm2({...form2,month:e.target.value})} style={{flex:1}}/><SI type="number" placeholder="일" value={form2.day} onChange={e=>setForm2({...form2,day:e.target.value})} style={{flex:1}}/></div></Field>
                    <Field label="출생 시각">
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <SI type="number" placeholder="시 (0~23)" value={form2.hour} onChange={e=>setForm2({...form2,hour:e.target.value})} style={{flex:1}}/>
                        <span style={{color:C.muted}}>:</span>
                        <SI type="number" placeholder="분 (0~59)" value={form2.minute} onChange={e=>setForm2({...form2,minute:e.target.value})} style={{flex:1}}/>
                        {form2.hour!==""&&!isNaN(+form2.hour)&&+form2.hour>=0&&+form2.hour<=23&&<div style={{flexShrink:0,padding:"8px 10px",borderRadius:10,background:`${C.gold}18`,border:`1px solid ${C.gold}30`,textAlign:"center",minWidth:48}}><div style={{fontSize:"1rem",color:C.gold,fontFamily:"serif",fontWeight:900,lineHeight:1}}>{EB[getHB(+form2.hour,+form2.minute||0)]}</div><div style={{fontSize:"0.42rem",color:C.muted,marginTop:1}}>{EB_KR[getHB(+form2.hour,+form2.minute||0)]}시</div></div>}
                      </div>
                    </Field>
                    <Field label="성별"><div style={{display:"flex",gap:8}}><GenderBtn v="male" l="남성 ♂" form={form2} setForm={setForm2}/><GenderBtn v="female" l="여성 ♀" form={form2} setForm={setForm2}/></div></Field>
                    <GoldBtn onClick={handleCompat} style={{width:"100%",marginTop:4}}>♡ 궁합 분석하기</GoldBtn>
                    {compatErr&&<p style={{color:"#ff6a50",fontSize:"0.68rem",textAlign:"center"}}>{compatErr}</p>}
                  </div>
                </Card>
                {saju2&&<Card style={{padding:"0.9rem 0.5rem"}}><CardTitle style={{marginBottom:8}}>{form2.name||"상대방"} 사주</CardTitle><SajuBoard pillars={saju2.pillars} dayStem={saju2.dayStem} showMulsang={false}/></Card>}
                {compat&&saju2&&<CompatResult compat={compat} s1={saju} s2={saju2} name1={form.name||"나"} name2={form2.name||"상대방"}/>}
              </div>
            )}
          </div>
          <button onClick={()=>{if(OFFLINE_APP&&onReturn){onReturn();return;}setSaju(null);setSaju2(null);setCompat(null);setScreen("input");}} style={{marginTop:10,padding:14,borderRadius:12,background:"rgba(255,255,255,0.09)",color:"rgba(230,190,120,0.70)",border:"1px solid rgba(210,175,100,0.15)",cursor:"pointer",fontSize:"0.78rem"}}>↺ 처음으로</button>
        </div>
      </div>
    );
  }
  return null;
}

export { calcSaju, calcDaeun, calcStrengthDetail, calcTCPA, calcYongsin, getDP, getMP, getYP, buildLunarYear, jdToDate, getMaxDay, HS, EB, HS_EL, EB_EL, EBH, getSS, getUnsung };
