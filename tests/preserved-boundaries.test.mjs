import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
test('resumed baseline keeps original calculation and all six native storage/activity files byte-for-byte',()=>{
 const root=new URL('../',import.meta.url),baseline=JSON.parse(readFileSync(new URL('docs/current-baseline-hashes.json',root)));
 assert.equal(baseline.commit,'db273b0cbc15175faffbc6cfd09562f12f450e4e');
 assert.equal(Object.keys(baseline.files).length,7);
 for(const [path,expected] of Object.entries(baseline.files))assert.equal(createHash('sha256').update(readFileSync(new URL(path,root))).digest('hex'),expected,path);
});
