import React,{useMemo,useState} from 'react';
import {currentBirth} from './profile-banner-model.js';
import {precisePillars} from '../calendar/precise.js';
import {SixPillars} from './ReaderTiles.jsx';
import {readPreferences} from '../vault/workspace.js';
export default function CurrentChart({vault,navigate}){
 const [now,setNow]=useState(()=>new Date()),prefs=readPreferences(vault);
 const view=useMemo(()=>{try{const birth=currentBirth(now),s=precisePillars({year:birth.input_year,month:birth.input_month,day:birth.input_day,hour:birth.input_hour,minute:birth.input_minute},birth.calculation_policy);return {birth,s,columns:s.pillars.map((pillar,i)=>({key:['hour','day','month','birthYear'][i],label:['시주','일주','월주','연주'][i],kind:'calculated',pillar}))};}catch(e){return {error:e.message};}},[now]);
 return <section className="panel current-chart reference-reader"><h1>현재 명식</h1><p>{now.toLocaleString('ko-KR')}</p><button type="button" className="secondary" onClick={()=>setNow(new Date())}>현재 시각으로 갱신</button>{view.error?<p role="status">{view.error}</p>:<><SixPillars columns={view.columns} dayStem={view.s.dayStem} appearance={prefs.appearance} manseDetails={prefs.manseDetails} hanja={prefs.hanja}/><p className="muted">기기 현지 시각을 독립 절입·시각 기준으로 조회합니다. 현재 화면은 보관함에 자동 저장되지 않습니다.</p><button type="button" className="primary" onClick={()=>navigate({name:'form',seedBirth:view.birth})}>이 시각으로 명식 입력</button></>}</section>;
}
