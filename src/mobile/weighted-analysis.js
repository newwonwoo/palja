import {HS,HS_EL,EBH} from './engine.js';
import {DEFAULT_WEIGHTS,weightErrors} from '../vault/integrated-schema.js';
export function weightedAnalysis(pillars,luck=[],weights=DEFAULT_WEIGHTS) {
 const err=weightErrors(weights);if(err.length)throw new Error(err.join(' '));
 const scores={木:0,火:0,土:0,金:0,水:0};let yin=0,yang=0;const contributions=[];
 const add=(stem,value,label)=>{const i=HS.indexOf(stem);if(i<0||!Number.isFinite(value)||value<=0)return;scores[HS_EL[i]]+=value;if(i%2)yin+=value;else yang+=value;contributions.push({label,stem,value,element:HS_EL[i]});};
 const each=(p,sw,bw,label)=>{if(!p||p.unknown)return;add(p.stem,sw,label+' 천간');
  const values=['yo','jung','bon'].map((k,i)=>({h:EBH[p.branch]?.[k],weight:weights.hidden[i]})).filter(x=>x.h);
  const sum=values.reduce((s,v)=>s+v.h[1]*v.weight,0);
  for(const v of values)if(sum>0)add(v.h[0],bw*v.h[1]*v.weight/sum,label+' 지장간');
 };
 pillars.forEach((p,i)=>each(p,weights.stems[i]||0,weights.branches[i]||0,['시','일','월','년'][i]));
 luck.forEach((p,i)=>each(p,weights.luck[i]||0,weights.luck[i]||0,['대운','세운','월운','일운','시운'][i]));
 return {scores,yin,yang,total:yin+yang,contributions,convention:'사용자 상대 가중치: 천간 기여 + 지지 비중을 지장간 일수×배율로 정규화. 합화 자동 변환 없음.'};
}
