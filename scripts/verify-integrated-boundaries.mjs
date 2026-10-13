import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const baseline=JSON.parse(readFileSync(new URL('docs/integrated-baseline-hashes.json',root)));
for(const [path,expected] of Object.entries(baseline)){
 const actual=createHash('sha256').update(readFileSync(new URL(path,root))).digest('hex');
 if(actual!==expected)throw new Error('Original calculation/native storage changed: '+path);
}
console.log('Unchanged original calculation/native files:',Object.keys(baseline).length);
