import React,{useState} from 'react';
import {HS,EB,STEM_KO,BRANCH_KO} from './engine.js';
import {exportPngFile} from '../vault/persistence.js';
const group=stem=>({甲:'#27a983',乙:'#27a983',丙:'#ed586b',丁:'#ed586b',戊:'#f3c938',己:'#f3c938',庚:'#d3e3e7',辛:'#d3e3e7',壬:'#373f4b',癸:'#373f4b'})[stem]||'#edf1f6';
const branch=stem=>({子:'#373f4b',丑:'#f3c938',寅:'#27a983',卯:'#27a983',辰:'#f3c938',巳:'#ed586b',午:'#ed586b',未:'#f3c938',申:'#d3e3e7',酉:'#d3e3e7',戌:'#f3c938',亥:'#373f4b'})[stem]||'#edf1f6';
function wrappedLines(ctx,content,width){const lines=[];let buffer='';for(const char of content){if(char==='\n'){lines.push(buffer);buffer='';continue;}if(buffer&&ctx.measureText(buffer+char).width>width){lines.push(buffer);buffer='';}buffer+=char;}if(buffer||!lines.length)lines.push(buffer);return lines;}
/** Renders a new offscreen image; never captures a private page or sends data to a server. */
export function renderChartPng({name,birth,columns,selectedYear}){
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=930;
 const g=canvas.getContext('2d');if(!g)throw new Error('이 기기는 이미지 생성을 지원하지 않습니다.');
 g.font='31px sans-serif';const lines=wrappedLines(g,`${name} · ${birth||'생년월일 미확인'}`,1050);
 const headerBottom=145+(lines.length-1)*38,offset=Math.max(0,headerBottom+45-218);
 canvas.height=930+offset;
 g.fillStyle='#fff';g.fillRect(0,0,1200,canvas.height);
 g.fillStyle='#42526d';g.font='bold 44px sans-serif';g.fillText('사주 명식',65,90);
 g.font='31px sans-serif';lines.forEach((line,i)=>g.fillText(line,65,145+i*38));
 const label=['세운','대운','시주','일주','월주','연주'];
 for(let i=0;i<6;i++){
  const x=45+i*185,c=columns?.[i],p=c?.kind==='calculated'?c.pillar:null;
  g.fillStyle=i===3?'#fef6d9':'#f2f6fb';g.fillRect(x,218+offset,178,502);
  g.textAlign='center';g.fillStyle='#58677b';g.font='28px sans-serif';g.fillText(label[i],x+89,258+offset);
  for(const [row,sym,background] of [[0,p?.stem,group],[1,p?.branch,branch]]){
   const y=288+offset+row*185,fill=background(sym);g.fillStyle=fill;
   g.beginPath();g.roundRect(x+12,y,154,155,22);g.fill();
   g.fillStyle=['#373f4b','#ed586b','#27a983'].includes(fill)?'#fff':'#384653';g.font='bold 82px serif';g.fillText(sym||'—',x+89,y+95);
   const map=row===0?HS:EB,ko=row===0?STEM_KO:BRANCH_KO;
   g.font='27px sans-serif';g.fillText(sym?ko[map.indexOf(sym)]||'':'미확인',x+89,y+132);
  }
  g.fillStyle='#748095';g.font='22px sans-serif';g.fillText(c?.kind==='reference'?'원문 확인 전':p?'계산된 명식':'미상',x+89,693+offset);
 }
 g.textAlign='left';g.fillStyle='#47576f';g.font='28px sans-serif';g.fillText(`선택 연도 ${selectedYear}년`,65,795+offset);
 g.fillStyle='#8793a6';g.font='24px sans-serif';g.fillText('이 파일은 개인 정보를 포함할 수 있습니다. 공유 전 내용을 확인하세요.',65,858+offset);
 return canvas.toDataURL('image/png');
}
export default function ChartExport({entry,columns,year,busy}){
 const [working,setWorking]=useState(false),[message,setMessage]=useState('');
 const b=entry.birth,birthLabel=b?.date_raw||([b?.input_year,b?.input_month,b?.input_day].every(Number.isInteger)?`${b.input_year}/${String(b.input_month).padStart(2,'0')}/${String(b.input_day).padStart(2,'0')}`:'');
 const save=async()=>{setWorking(true);setMessage('');try{const image=renderChartPng({name:entry.name,birth:birthLabel,columns,selectedYear:year});await exportPngFile(image,`명식_${new Date().toISOString().slice(0,10)}.png`);setMessage('명식 이미지를 저장했습니다.');}catch(e){setMessage(e.message||'이미지 내보내기가 실패했습니다.');}finally{setWorking(false);}};
 return <div className="chart-export"><button type="button" className="rr-secondary-action" disabled={busy||working} onClick={save}>명식 이미지 PNG로 저장</button><small>이름·생년월일이 포함될 수 있습니다. 저장 전 개인정보를 확인하세요.</small>{message&&<p role="status">{message}</p>}</div>;
}
