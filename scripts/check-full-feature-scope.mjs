import {readFile} from 'node:fs/promises';
const scope=JSON.parse(await readFile(new URL('../docs/full-feature-scope.json',import.meta.url),'utf8'));
const ids=new Set(), errors=[];
const statuses=['not_implemented','partial','implemented','verified'];
for(const item of scope.features){
 if(ids.has(item.id)||!item.title||!item.gap||!statuses.includes(item.implementation))errors.push('Invalid feature: '+item.id);
 ids.add(item.id);
 if(!Array.isArray(item.apkEvidence)||!item.apkEvidence.length)errors.push('Missing inventory evidence: '+item.id);
 if(item.implementation==='verified' && (item.referenceBehavior!=='verified' || item.independentVerification!=='passed'
   || typeof item.originalComparisonEvidence!=='string' || !item.originalComparisonEvidence.trim()))
   errors.push('Cannot mark verified without original comparison evidence and independent validation: '+item.id);
}
const families=new Set(scope.apkFeatureFamilies.map(x=>x.name));
for(const required of ['profile_input','profile_list','myeongjo','saju_analysis','woonse','match','memo','drawing','search','similar_manse','manse_calendar','guide','setting','share'])if(!families.has(required))errors.push('Missing whole-app family: '+required);
const open=scope.features.filter(x=>x.implementation!=='verified'||x.referenceBehavior!=='verified'
  ||x.independentVerification!=='passed'||!x.originalComparisonEvidence?.trim());
console.log(JSON.stringify({features:scope.features.length,apkFeatureFamilies:families.size,open:open.length,wholeAppComplete:!open.length,errors},null,2));
if(errors.length||process.argv.includes('--require-complete')&&open.length)process.exitCode=1;
