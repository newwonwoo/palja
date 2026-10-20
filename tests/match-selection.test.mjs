import test from 'node:test';
import assert from 'node:assert/strict';
import {EMPTY_MATCH_SELECTION,toggleMatchSelection,matchSelectionEntries} from '../src/mobile/match-selection.js';

test('original basis slot remains stable when a third profile replaces the partner',()=>{
  let s=toggleMatchSelection(EMPTY_MATCH_SELECTION,'a');
  s=toggleMatchSelection(s,'b');
  assert.deepEqual(s,{basisId:'a',partnerId:'b'});
  assert.deepEqual(toggleMatchSelection(s,'c'),{basisId:'a',partnerId:'c'});
  assert.deepEqual(s,{basisId:'a',partnerId:'b'});
});
test('deselecting basis preserves the partner slot until a basis is chosen',()=>{
  const s={basisId:'a',partnerId:'b'};
  const removed=toggleMatchSelection(s,'a');
  assert.deepEqual(removed,{basisId:null,partnerId:'b'});
  assert.deepEqual(toggleMatchSelection(removed,'c'),{basisId:'c',partnerId:'b'});
  assert.deepEqual(toggleMatchSelection(removed,'b'),{basisId:'b',partnerId:null});
  assert.deepEqual(toggleMatchSelection(s,'b'),{basisId:'a',partnerId:null});
});
test('deleted, missing and duplicate profiles cannot form a valid comparison pair',()=>{
  const entries=[{id:'a',deletedAt:null},{id:'b',deletedAt:'2026-10-20T00:00:00.000Z'}],before=JSON.stringify(entries);
  assert.deepEqual(matchSelectionEntries({basisId:'a',partnerId:'b'},entries),{basis:entries[0],partner:null});
  assert.deepEqual(matchSelectionEntries({basisId:'missing',partnerId:'a'},entries),{basis:null,partner:entries[0]});
  assert.deepEqual(matchSelectionEntries({basisId:'a',partnerId:'a'},entries),{basis:entries[0],partner:null});
  assert.equal(JSON.stringify(entries),before);
});
