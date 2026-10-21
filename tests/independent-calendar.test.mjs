import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=await build({stdin:{contents:`export * from './src/calendar/precise.js';export {SUPPORTED_ZONES} from './src/calendar/locations.js';`,resolveDir:root},bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});
const c=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
const reference=JSON.parse(readFileSync(new URL('./fixtures/independent-calendar.json',import.meta.url)));
const mod=(x,n)=>(x%n+n)%n,stems=[...'甲乙丙丁戊己庚辛壬癸'],branches=[...'子丑寅卯辰巳午未申酉戌亥'];
const metrics={terms:0,equation:0};
test('408 solar terms, 1900–2050, agree with independent Swiss Moshier within two minutes',()=>{
 assert.equal(reference.terms.length,408);
 for(const [year,index,instant] of reference.terms){const difference=Math.abs(c.solarTerms(year)[index].instant-instant);metrics.terms=Math.max(metrics.terms,difference);assert.ok(difference<120000,`${year}/${index}: ${difference}ms`);}
 console.log('Swiss solar-term maximum difference seconds',metrics.terms/1000);
});
test('NOAA approximate equation of time stays within 90 seconds of Swiss across 204 dates',()=>{
 for(const [iso,minutes] of reference.equations){const error=Math.abs(c.equationOfTime(Date.parse(iso))-minutes);metrics.equation=Math.max(metrics.equation,error);assert.ok(error<1.5,iso+': '+error+' minutes');}
 console.log('Swiss EOT maximum difference seconds',metrics.equation*60);
});
test('all 17 embedded zones agree with independently generated IANA monthly and transition samples',()=>{
 assert.equal(reference.zones.length,c.SUPPORTED_ZONES.length);let count=0;
 for(const {zone,samples} of reference.zones)for(const [instant,offset,dst] of samples){const actual=c.zoneAt(instant,{...c.DEFAULT_POLICY,zone});assert.equal(actual.offsetSeconds,offset,zone+' '+new Date(instant).toISOString()+' offset');assert.equal(actual.dstSeconds,dst,zone+' '+new Date(instant).toISOString()+' DST');count++;}
 console.log('IANA independent zone/instant pairs',count);
});
test('604 lunar/date/day-pillar vectors agree with Python Korean-calendar port (shared data disclosed)',()=>{
 for(const [date,ly,lm,ld,leap,day] of reference.dates){const [year,month,d]=date.split('-').map(Number),r=c.solarInput({input_year:year,input_month:month,input_day:d,calendar_type:'solar'});assert.deepEqual([r.lunar.year,r.lunar.month,r.lunar.day,r.lunar.intercalation],[ly,lm,ld,leap],date);
  const p=c.datePillar(year,month,d);assert.equal(p.stem+p.branch,day.slice(0,2),date+' day');
  if(ly>=1900){const reverse=c.solarInput({input_year:ly,input_month:lm,input_day:ld,calendar_type:'lunar',lunar_leap_month:leap});assert.deepEqual([reverse.year,reverse.month,reverse.day],[year,month,d],date+' reverse');}
 }
});
test('year/month pillars change at each independently located Jie, day/hour follow modular conventions',()=>{
 let checked=0;
 for(const [year,index,instant] of reference.terms.filter(t=>t[1]%2===0)){
  // A 3-minute margin exceeds measured astronomical discrepancy. At ±1 ms of
  // Palja's own exact boundary we separately assert its selection contract.
  for(const delta of [-180000,180000]){
   const utc=new Date(instant+delta),s={year:utc.getUTCFullYear(),month:utc.getUTCMonth()+1,day:utc.getUTCDate(),hour:utc.getUTCHours(),minute:utc.getUTCMinutes()};
   const r=c.precisePillars(s,{...c.DEFAULT_POLICY,zone:'fixed',offsetMinutes:0});
   const activeIndex=delta<0?mod(index-2,24):index;
   assert.equal(r.pillars[2].branchIdx,mod(1+activeIndex/2,12));
   const solarYear=index<2||index===2&&delta<0?year-1:year;
   assert.equal(r.pillars[3].stem,stems[mod(solarYear-4,10)]);
   const monthOrdinal=mod(r.pillars[2].branchIdx-2,12);
   assert.equal(r.pillars[2].stem,stems[mod(mod(solarYear-4,10)%5*2+2+monthOrdinal,10)]);checked++;
  }
 }
 assert.equal(checked,408);
 for(const dayBoundary of ['midnight','zi23','zi-split'])for(const hourBoundaryOffset of [0,30])for(const [date,,,,,dayPair] of reference.dates.filter((_,i)=>i%19===0)){
  const [year,month,day]=date.split('-').map(Number);
  for(const minute of [0,59,60,89,90,719,720,1379,1380,1409,1410,1439]){
   const r=c.precisePillars({year,month,day,hour:Math.floor(minute/60),minute:minute%60},{...c.DEFAULT_POLICY,zone:'fixed',offsetMinutes:0,dayBoundary,hourBoundaryOffset});
   const late=minute>=1380+hourBoundaryOffset,dayStem=mod(stems.indexOf(dayPair[0])+(dayBoundary==='zi23'&&late?1:0),10),dayBranch=mod(branches.indexOf(dayPair[1])+(dayBoundary==='zi23'&&late?1:0),12),hourBranch=Math.floor(mod(minute+60-hourBoundaryOffset,1440)/120),hourStem=mod(dayStem+(dayBoundary==='zi-split'&&late?1:0),10);
   assert.equal(r.pillars[1].stemIdx,dayStem);assert.equal(r.pillars[1].branchIdx,dayBranch);assert.equal(r.pillars[0].branchIdx,hourBranch);assert.equal(r.pillars[0].stemIdx,mod(hourStem%5*2+hourBranch,10));
  }
 }
});
test('longitude and DST components use actual UTC once; apparent correction adds independent EOT',()=>{
 for(const {zone,samples} of reference.zones)for(const [instant,offset,dst] of samples.filter((_,i)=>i%37===0)){
  // Convert independent UTC input to a civil minute, allowing historical seconds.
  const wall=new Date(instant+offset*1000),s={year:wall.getUTCFullYear(),month:wall.getUTCMonth()+1,day:wall.getUTCDate(),hour:wall.getUTCHours(),minute:wall.getUTCMinutes()};
  for(const longitude of [-74.006,0,126.978]){
   const policy={...c.DEFAULT_POLICY,zone,clock:'mean-solar',longitude,fold:'earlier'};
   let clock;try{clock=c.correctedClock(s,policy);}catch(error){
    // Historical offsets may include seconds. Flooring an actual instant's
    // civil seconds to minute precision can land in a real gap.
    assert.match(error.message,/실제 존재하지 않는 현지 시각/);continue;
   }
   assert.ok(Math.abs(clock.adjusted-(clock.instant+longitude*240000))<.001);
   assert.equal(clock.audit.totalCorrectionMinutes,-clock.audit.dstMinutes+longitude*4-(clock.audit.offsetMinutes-clock.audit.dstMinutes));
  }
 }
});
