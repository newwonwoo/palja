import test from 'node:test';
import assert from 'node:assert/strict';
import { chartSlots, displayCertainty, isSourceDayDifferent, normalizeElementScores } from '../src/mobile/detail-view-model.js';

const reference={referenceDisplay:{day_stem_ko:'계',day_branch_ko:'해'}};

test('unknown date does not manufacture 3 pillars but keeps original day as reference only',()=>{
  const slots=chartSlots(reference,{status:'needs_confirmation'});
  assert.deepEqual(slots.map(x=>x.kind),['unknown','reference','unknown','unknown']);
  assert.equal(slots[1].stem+slots[1].branch,'계해');
});

test('unknown hour remains unknown while day/month/year are computed',()=>{
  const p=[{unknown:true},{stem:'癸',branch:'亥',stemIdx:9,branchIdx:11},{stem:'乙',branch:'丑',stemIdx:1,branchIdx:1},{stem:'癸',branch:'亥',stemIdx:9,branchIdx:11}];
  const slots=chartSlots(reference,{status:'partial',saju:{pillars:p}});
  assert.deepEqual(slots.map(s=>s.kind),['unknown','calculated','calculated','calculated']);
});

test('original/calculated pillar discrepancy is clearly detected',()=>{
  const entry={referenceDisplay:{day_stem_ko:'갑',day_branch_ko:'자'}};
  const result={saju:{pillars:[{}, {stemIdx:9,branchIdx:11}]}};
  assert.equal(isSourceDayDifferent(entry,result,['갑','을','병','정','무','기','경','신','임','계'],['자','축','인','묘','진','사','오','미','신','유','술','해']),true);
  assert.equal(isSourceDayDifferent(reference,result,['갑','을','병','정','무','기','경','신','임','계'],['자','축','인','묘','진','사','오','미','신','유','술','해']),false);
});

test('zero, missing, negative and invalid element values never produce NaN percent',()=>{
  assert.deepEqual(normalizeElementScores(null),[]);
  const vals=normalizeElementScores({木:2,火:2,土:-10,金:NaN,水:Infinity});
  assert.equal(vals.length,5);
  assert.deepEqual(vals.map(x=>x.percentage),[50,50,0,0,0]);
  assert.equal(normalizeElementScores({}).reduce((s,x)=>s+x.percentage,0),0);
});

test('certainty messages never claim equivalence with 8ja',()=>{
  assert.match(displayCertainty(reference,{status:'ready'}).body,/검증된.*아닙니다/);
  assert.equal(displayCertainty(reference,{status:'partial'}).tone,'warning');
  assert.match(displayCertainty(reference,{status:'needs_confirmation',message:'양력 확인'}).body,/양력 확인/);
});
