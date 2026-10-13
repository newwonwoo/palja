import test from 'node:test';
import assert from 'node:assert/strict';
import {NAYIN_PAIRS,nayinOf,gongmangOf,branchPairTypes,samjaeOf} from '../src/mobile/traditional-reference.js';
const P=(stem,branch)=>({stem,branch});
test('all 60 JiaZi map to 30 distinct Nayin pairs without cross-elements',()=>{
 const stems=[...'甲乙丙丁戊己庚辛壬癸'],branches=[...'子丑寅卯辰巳午未申酉戌亥'];
 assert.equal(NAYIN_PAIRS.length,30);
 const all=new Set();
 for(let i=0;i<60;i++){
  const p=P(stems[i%10],branches[i%12]),n=nayinOf(p);
  assert.ok(n,'cycle index '+i);
  assert.equal(n.index,i);
  assert.equal(n.name,NAYIN_PAIRS[Math.floor(i/2)].name);
  assert.ok(['금','목','수','화','토'].includes(n.element));
  all.add(n.hanja);
 }
 assert.equal(all.size,30);
});
test('common Nayin reference examples',()=>{
 for(const [p,expect] of [['甲子','해중금'],['乙丑','해중금'],['丙午','천하수'],['丁未','천하수'],['壬戌','대해수'],['癸亥','대해수']])assert.equal(nayinOf(P(...p)).name,expect);
 assert.equal(nayinOf(P('甲','丑')),null);
 assert.equal(nayinOf({unknown:true}),null);
});
test('ten JiaZi decade voids produce two omitted branches, six disjoint pairs',()=>{
 const stems=[...'甲乙丙丁戊己庚辛壬癸'],branches=[...'子丑寅卯辰巳午未申酉戌亥'],pairs=[];
 for(let i=0;i<60;i+=10){
  const v=gongmangOf(P(stems[i%10],branches[i%12]));
  assert.equal(v.empty.length,2);
  for(let j=i;j<i+10;j++)assert.deepEqual(gongmangOf(P(stems[j%10],branches[j%12])).empty,v.empty);
  pairs.push(v.empty.join(''));
 }
 assert.equal(new Set(pairs).size,6);
 assert.deepEqual(gongmangOf(P('甲','子')).empty,['戌','亥']);
 assert.deepEqual(gongmangOf(P('甲','戌')).empty,['申','酉']);
 assert.equal(gongmangOf(null),null);
});
test('branch injury/break/harm/yuanjin and Xing can overlap; symmetric; no unsupported glyph',()=>{
 for(const [a,b,type] of [['子','酉','파'],['子','未','해'],['子','未','원진'],['寅','巳','형'],['巳','申','파'],['辰','辰','자형'],['亥','亥','자형'],['子','子','-']]){
  const names=branchPairTypes(a,b);
  if(type==='-')assert.deepEqual(names,[]);else assert.ok(names.includes(type),`${a}${b} ${type}`);
  assert.deepEqual(names,branchPairTypes(b,a));
 }
 assert.deepEqual(branchPairTypes('x','子'),[]);
});

test('year-branch samjae cycles classify all four trines and leave other years unmarked',()=>{
 const examples=[['申','寅','들삼재'],['子','卯','눌삼재'],['辰','辰','날삼재'],['寅','申','들삼재'],['午','酉','눌삼재'],['戌','戌','날삼재'],['巳','亥','들삼재'],['酉','子','눌삼재'],['丑','丑','날삼재'],['亥','巳','들삼재'],['卯','午','눌삼재'],['未','未','날삼재']];
 for(const [born,year,name] of examples)assert.equal(samjaeOf(born,year).name,name,born+year);
 assert.equal(samjaeOf('亥','子').active,false);
 assert.equal(samjaeOf('?', '午'),null);
});
