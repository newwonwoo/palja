/** Independent arithmetic/table oracles for Palja's declared research contract.
 * These checks establish implementation consistency, not predictive validity.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {nayinOf} from '../src/mobile/traditional-reference.js';
import {DEFAULT_WEIGHTS} from '../src/vault/integrated-schema.js';
import {DEFAULT_RULES} from '../src/vault/analysis-rules.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=await build({stdin:{contents:`
 export {weightedAnalysis} from './src/mobile/weighted-analysis.js';
 export {researchAnalysis,monthCommand} from './src/mobile/research-analysis.js';
 export {compatibilityComposition,similarChartFacts} from './src/mobile/compatibility-model.js';
 export {getSS,getUnsung} from './src/mobile/engine.js';
 export {luckyChoice} from './src/mobile/lucky-choice.js';
 export {extraShinsal} from './src/mobile/shinsal-catalog.js';
 import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
 import ResearchPanel from './src/mobile/ResearchPanel.jsx';
 export const renderResearch=result=>renderToStaticMarkup(React.createElement(ResearchPanel,{result,luck:[],weights:{enabled:false},vault:{},change:()=>{}}));
 `,resolveDir:root},bundle:true,write:false,platform:'node',format:'esm',banner:{js:`import {createRequire} from 'node:module';const require=createRequire(${JSON.stringify(root+'package.json')});`},loader:{'.css':'empty'},define:{'import.meta.env.VITE_APP_MODE':'"mobile"','import.meta.env.VITE_GEMINI_API_KEY':'""'},logLevel:'silent'});
const c=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
const stems=[...'甲乙丙丁戊己庚辛壬癸'],branches=[...'子丑寅卯辰巳午未申酉戌亥'],elements=[...'木火土金水'];
const mod=(x,n)=>(x%n+n)%n,pair=i=>({stem:stems[mod(i,10)],branch:branches[mod(i,12)],stemIdx:mod(i,10),branchIdx:mod(i,12)});
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
// Literal 30-day allocation of the selected convention, independently expressed
// as stem indices/days. Other schools' hidden-stem allocations are not implied.
const hidden=[[[8,7],null,[9,23]],[[9,9],[7,3],[5,18]],[[4,7],[2,7],[0,16]],[[0,10],null,[1,20]],[[1,9],[9,3],[4,18]],[[4,7],[6,7],[2,16]],[[2,10],[5,9],[3,11]],[[3,9],[1,3],[5,18]],[[4,7],[8,7],[6,16]],[[6,10],null,[7,20]],[[7,9],[3,3],[4,18]],[[4,7],[0,5],[8,18]]];
function oracle(pillars,luck,w){
 const mass=Array(10).fill(0);
 for(let i=0;i<pillars.length+luck.length;i++){
  const natal=i<pillars.length,p=natal?pillars[i]:luck[i-pillars.length];if(!p||p.unknown)continue;
  const sw=natal?w.stems[i]:w.luck[i-pillars.length],bw=natal?w.branches[i]:sw;mass[p.stemIdx]+=sw;
  const allocation=hidden[p.branchIdx],denominator=allocation.reduce((sum,x,k)=>sum+(x?x[1]*w.hidden[k]:0),0);
  if(denominator)for(let k=0;k<3;k++){const x=allocation[k];if(x)mass[x[0]]+=bw*x[1]*w.hidden[k]/denominator;}
 }
 return {scores:elements.map((_,i)=>mass[2*i]+mass[2*i+1]),yin:mass.filter((_,i)=>i%2===1).reduce((a,b)=>a+b,0),yang:mass.filter((_,i)=>i%2===0).reduce((a,b)=>a+b,0)};
}
test('weighted five elements and polarity match an independent 10-stem mass ledger over 240 charts',()=>{
 for(let i=0;i<240;i++){
  const natal=[pair(i+2),pair(i),pair(i+14),i%7===0?{unknown:true}:pair(i+31)],luck=Array.from({length:5},(_,j)=>i%11===j?null:pair(i+j*11));
  const w={enabled:true,stems:[.6,.6,1.2,.6].map((x,j)=>x*(i%4+j)/3),branches:[.6,1.2,3,.6].map((x,j)=>x*(i%3+j)/3),hidden:[i%2,1,(i%5)/2],luck:[0,.5,1,2,3]};
  const expected=oracle(natal,luck,w),actual=c.weightedAnalysis(natal,luck,w);elements.forEach((e,j)=>close(actual.scores[e],expected.scores[j]));close(actual.yin,expected.yin);close(actual.yang,expected.yang);close(actual.total,expected.yin+expected.yang);
  const research=c.researchAnalysis({status:'partial',saju:{pillars:natal}},luck,w),total=expected.scores.reduce((a,b)=>a+b,0),day=Math.floor(natal[1].stemIdx/2),support=(expected.scores[day]+expected.scores[(day+4)%5])/total;
  close(research.strength.ratio,support);assert.equal(research.strength.name,support>=.6?'신강 경향':support<=.4?'신약 경향':'중화 구간');assert.equal(research.strength.deukSe,support>=.5);
  assert.equal(research.methods[0].element,support>.6?elements[(day+1)%5]:support<.4?elements[(day+4)%5]:null);
  assert.equal(research.methods[1].element,null);close(research.roles.reduce((a,b)=>a+b.ratio,0),1);
 }
});
test('all month-command allocations switch at stated boundaries without inventing timing',()=>{
 for(let month=0;month<12;month++){
  const p=[pair(0),pair(0),pair(month),pair(0)];let elapsed=0;
  for(const value of hidden[month].filter(Boolean)){
   for(const days of [elapsed,elapsed+value[1]-.0001]){const result={saju:{pillars:p,clock:{instant:days*86400000},lastJie:{instant:0}}};assert.equal(c.monthCommand(result).current,stems[value[0]]);}
   elapsed+=value[1];
  }
  assert.equal(c.monthCommand({saju:{pillars:p}}).current,null);
 }
});
test('strict remedy thresholds distinguish 40/60 percent from strength labels',()=>{
 const p=[pair(0),pair(0),pair(2),pair(4)];
 for(const ratio of [.399,.4,.5,.6,.601]){
  const weights={...DEFAULT_WEIGHTS,stems:[0,ratio,1-ratio,0],branches:[0,0,0,0]};
  const r=c.researchAnalysis({status:'ready',saju:{pillars:p}},[],weights);
  assert.equal(r.methods[0].element,ratio<.4?'水':ratio>.6?'火':null);
 }
});
test('60 day pillars render day-specific metaphors and observation questions without changing results',()=>{
 const images=['큰 나무','풀과 덩굴','태양','등불','산','밭','단단한 쇠','보석','큰 강','빗물'];
 for(let i=0;i<60;i++){
  const result={status:'partial',saju:{pillars:[{unknown:true},pair(i),pair(i+14),pair(i+30)]}},before=JSON.stringify(result),text=c.renderResearch(result);
  assert.ok(text.includes(images[i%10]+' 물상 관계'));assert.ok(text.includes(pair(i).stem+pair(i).branch));assert.ok(text.includes('자체 작성한 전통 상징 해설과 관찰 질문'));
  for(const phrase of ['강점 질문','점검 질문','기회 질문','주의 질문','실제 성격은 상담 기록과 함께 확인'])assert.ok(text.includes(phrase));assert.equal(JSON.stringify(result),before);
 }
});
test('30 Nayin pairs match the published 六十甲子納音 table in cycle order',()=>{
 // 三命通會 卷一, 論納音取象: adjacent Yang/Yin pairs share each name.
 const names='海中金 爐中火 大林木 路傍土 劍鋒金 山頭火 澗下水 城頭土 白蠟金 楊柳木 泉中水 屋上土 霹靂火 松柏木 長流水 沙中金 山下火 平地木 壁上土 金箔金 覆燈火 天河水 大驛土 釵釧金 桑柘木 大溪水 沙中土 天上火 石榴木 大海水'.split(' ');
 for(let i=0;i<60;i++)assert.equal(nayinOf(pair(i)).hanja,names[Math.floor(i/2)]);
});
test('all 100 ten-god entries follow five-phase generation/control and polarity',()=>{
 for(let a=0;a<10;a++)for(let b=0;b<10;b++){
  const distance=mod(Math.floor(b/2)-Math.floor(a/2),5),same=a%2===b%2;
  const labels=[['비견','겁재'],['식신','상관'],['편재','정재'],['편관','정관'],['편인','정인']];
  assert.equal(c.getSS(stems[a],stems[b]),labels[distance][same?0:1]);
 }
});
test('Hetu five element correspondences are fixed for all five chosen methods',()=>{
 const numbers=[[3,8],[2,7],[5,10],[4,9],[1,6]],directions=['동','남','중앙','서','북'];
 for(let i=0;i<5;i++)for(const name of ['억부','조후','통관','병약','용격']){const r=c.luckyChoice({status:'ready',methods:[{name,element:elements[i],reason:'합성 후보'}]},name);assert.deepEqual(r.numbers,numbers[i]);assert.equal(r.direction,directions[i]);}
});
test('all 3600 day-pair comparisons match independent identity/combine/clash/other tables',()=>{
 const sh=['甲己','乙庚','丙辛','丁壬','戊癸'],sc=['甲庚','乙辛','丙壬','丁癸'],bh=['子丑','寅亥','卯戌','辰酉','巳申','午未'],bc=['子午','丑未','寅申','卯酉','辰戌','巳亥'];
 const other=[['子酉','丑辰','寅亥','卯午','巳申','未戌'],['子未','丑午','寅巳','卯辰','申亥','酉戌'],['子未','丑午','寅酉','卯申','辰亥','巳戌'],['子卯','寅巳','巳申','申寅','丑戌','戌未','未丑'],['辰辰','午午','酉酉','亥亥']];
 const has=(table,a,b)=>table.includes(a+b)||table.includes(b+a),weights={same:1,combine:2,clash:3,other:.5};
 for(let a=0;a<60;a++)for(let b=0;b<60;b++){
  const x=pair(a),y=pair(b),left={saju:{pillars:[{unknown:true},x,x,x]}},right={saju:{pillars:[{unknown:true},y,y,y]}},r=c.compatibilityComposition(left,right,weights);
  const counts={same:Number(x.stem===y.stem)+2*Number(x.branch===y.branch),combine:Number(has(sh,x.stem,y.stem))+2*Number(has(bh,x.branch,y.branch)),clash:Number(has(sc,x.stem,y.stem))+2*Number(has(bc,x.branch,y.branch)),other:other.reduce((sum,t)=>sum+Number(has(t,x.branch,y.branch)),0)};
  assert.deepEqual(r.counts,counts);assert.equal(r.glyphs,6);close(r.structuralSimilarity,(Number(x.stem===y.stem)+Number(x.branch===y.branch))*50);
  const total=Object.entries(counts).reduce((sum,[key,n])=>sum+n*weights[key],0);for(const [key,n] of Object.entries(counts))if(total)close(r.composition[key],n*weights[key]/total);else assert.equal(r.composition[key],null);
 }
});
test('similarity filters the full collection before limiting; stable ties and missing-hour evidence',()=>{
 const source={saju:{pillars:[{unknown:true},pair(0),pair(2),pair(4)]}},entries=Array.from({length:100},(_,i)=>({id:String(i).padStart(3,'0'),name:'합성 '+i,result:{saju:{pillars:[{unknown:true},pair(i),pair(2),pair(4)]}}}));
 for(const condition of ['daySame','stemSame','branchSame','monthSame']){
  const actual=c.similarChartFacts(source,entries,e=>e.result,50,{condition});
  const expected=entries.filter(e=>condition==='daySame'?e.result.saju.pillars[1].stem==='甲'&&e.result.saju.pillars[1].branch==='子':condition==='stemSame'?e.result.saju.pillars[1].stem==='甲':condition==='branchSame'?e.result.saju.pillars[1].branch==='子':true);
  assert.equal(actual.length,Math.min(50,expected.length));assert.ok(actual.every(x=>x[condition]&&x.compared===3));
 }
});
test('fixed monthly/yearly stars check hits and misses for every valid JiaZi',()=>{
 const virtues=[...'巳庚丁申壬辛亥甲癸寅丙乙'],monthly=[...'壬庚丙甲壬庚丙甲壬庚丙甲'];
 const join={甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊',子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};
 const lonely=[...'寅寅巳巳巳申申申亥亥亥寅'],widow=[...'戌戌丑丑丑辰辰辰未未未戌'],red=[...'卯寅丑子亥戌酉申未午巳辰'];
 for(let base=0;base<12;base++)for(let i=0;i<60;i++){
  const p=pair(i),matches=value=>p.stem===value||p.branch===value;
  const monthExpected=[['천덕귀인',matches(virtues[base])],['천덕합',matches(join[virtues[base]])],['월덕귀인',p.stem===monthly[base]],['월덕합',p.stem===join[monthly[base]]],['천의',p.branch===branches[(base+11)%12]]].filter(x=>x[1]).map(x=>x[0]).sort();
  assert.deepEqual(c.extraShinsal(p,{monthBranch:branches[base]}).map(x=>x.name).sort(),monthExpected);
  const yearExpected=[['고신',p.branch===lonely[base]],['과숙',p.branch===widow[base]],['홍란',p.branch===red[base]],['천희',p.branch===branches[(branches.indexOf(red[base])+6)%12]]].filter(x=>x[1]).map(x=>x[0]).sort();
  assert.deepEqual(c.extraShinsal(p,{yearBranch:branches[base]}).map(x=>x.name).sort(),yearExpected);
 }
});
test('pair-only nets and ghost gates cover all 144 ordered branch pairs; ten defeat days derive from Lu in void',()=>{
 const ghost=['子酉','丑午','寅未','卯申','辰亥','巳戌'];
 for(const a of branches)for(const b of branches){const p={...pair(branches.indexOf(a)),branch:a},names=c.extraShinsal(p,{natalBranches:[b]}).map(x=>x.name).sort(),has=values=>values.includes(a+b)||values.includes(b+a);
  const expected=[['귀문관살',has(ghost)],['천라(지지쌍)',has(['戌亥'])],['지망(지지쌍)',has(['辰巳'])]].filter(x=>x[1]).map(x=>x[0]).sort();assert.deepEqual(names,expected);
 }
 const lu=[...'寅卯巳午巳午申酉亥子'];let count=0;
 for(let i=0;i<60;i++){
  const used=new Set(Array.from({length:10},(_,j)=>branches[(Math.floor(i/10)*10+j)%12])),expected=!used.has(lu[i%10]),actual=c.extraShinsal(pair(i),{isNatalDay:true}).some(x=>x.name==='십악대패(일주)');assert.equal(actual,expected);if(actual)count++;
 }
 assert.equal(count,10);
});
