import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const scope=JSON.parse(await readFile(new URL('docs/full-feature-scope.json',root),'utf8'));
const overrides=JSON.parse(await readFile(new URL('docs/implementation-progress.json',root),'utf8'));
const counts={implemented:0,partial:0,not_implemented:0,verified:0};
const gateNames=['input','action','result','persistenceWhenApplicable','offline','regression','independentEngineOrPublishedReferenceWhenApplicable'];
const rows=scope.features.map(f=>{
 const p=overrides.features[f.id]||{},status=p.implementation||f.implementation;
 if(!Object.hasOwn(counts,status))throw new Error('구현 상태 오류 '+f.id);
 counts[status]++;
 const complete=status==='verified'&&p.gates?.every(g=>g.status==='passed')&&p.gates?.length===7;
 const gates=gateNames.map(name=>p.gates?.find(g=>g.name===name)?.status==='passed'?'✓':'대기').join(' / ');
 return `| ${complete?'[x]':'[ ]'} | ${f.id} | ${f.title} | ${{implemented:'구현 · 검증 대기',partial:'일부 구현',not_implemented:'미구현',verified:'검증 완료'}[status]} | ${p.note||f.gap} | ${gates} | ${(p.evidence||f.implementationEvidence||[]).map(s=>`[${s}](${s.startsWith('src/')||s.startsWith('tests/')?'../':''}${s})`).join(' · ')||'미기록'} |`;
});
const completed=rows.filter(r=>r.startsWith('| [x]')).length;
const text=`# 전체 구현 체크리스트\n\n기준일: ${overrides.updatedAt}. 79개 기능을 추적한다. **코드 구현 ${counts.implemented+counts.verified}/${scope.features.length}, 일부 구현 ${counts.partial}, 미구현 ${counts.not_implemented}.** 전체 게이트 검증 완료 ${completed}/${scope.features.length}.\n\n완료 체크는 입력 → 조작 → 결과 → 재열기/백업 → 오프라인 → 회귀 → 독립 근거의 7개 게이트를 모두 통과해야 한다. 표의 검증 열은 이 순서다. 실기기 검증은 자동 테스트와 구분한다. 안내만 있는 버튼, 근거 없는 점수, 원본 앱과의 일치 추정은 완료로 처리하지 않는다.\n\n명세 원본: [full-feature-scope.json](full-feature-scope.json). 진행 근거: [implementation-progress.json](implementation-progress.json). 검증 범위: [작업 기록](completion-20261020.md). 다시 생성: \`npm run checklist\`. 미완료가 있으면 실패하는 배포 게이트: \`npm run checklist:complete\`.\n\n| 완료 | ID | 기능 | 상태 | 남은 작업 / 구현 범위 | 7개 검증 게이트 | 근거 |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`;
if(process.argv.includes('--check')){
 const old=await readFile(new URL('docs/IMPLEMENTATION_CHECKLIST.md',root),'utf8').catch(()=>null);
 if(old!==text)throw new Error('체크리스트가 오래되었습니다. npm run checklist를 실행하세요.');
}else await writeFile(new URL('docs/IMPLEMENTATION_CHECKLIST.md',root),text);
for(const [id,p] of Object.entries(overrides.features)){
 if(!scope.features.some(f=>f.id===id))throw new Error('알 수 없는 항목 '+id);
 for(const path of p.evidence||[])await readFile(new URL(path,root));
 if(p.gates){
  if(!Array.isArray(p.gates)||p.gates.length!==7||new Set(p.gates.map(g=>g.name)).size!==7||p.gates.some(g=>!gateNames.includes(g.name)||!['passed','pending','blocked'].includes(g.status)))throw new Error('검증 게이트 형식 오류 '+id);
  for(const gate of p.gates)if(gate.status==='passed'){if(!gate.evidence)throw new Error('검증 근거 누락 '+id);await readFile(new URL(gate.evidence,root));}
 }
 if(p.implementation==='verified'&&(!p.gates||p.gates.some(g=>g.status!=='passed')))throw new Error('검증 근거 누락 '+id);
}
console.log(JSON.stringify({features:scope.features.length,completed,counts,checklist:fileURLToPath(new URL('docs/IMPLEMENTATION_CHECKLIST.md',root))},null,2));
if(process.argv.includes('--require-complete')&&completed!==scope.features.length)process.exitCode=1;
