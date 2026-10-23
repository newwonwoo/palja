import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const historical=process.argv.includes('--historical');
const record=JSON.parse(readFileSync(new URL(historical?'docs/integrated-baseline-hashes.json':'docs/current-baseline-hashes.json',root)));
const baseline=record.files||record;
for(const [path,expected] of Object.entries(baseline)){
 const actual=createHash('sha256').update(readFileSync(new URL(path,root))).digest('hex');
 if(actual!==expected)throw new Error('Original calculation/native storage changed: '+path);
}
console.log('Unchanged original calculation/native files:',Object.keys(baseline).length,'baseline:',record.commit||'historical 1.1.0');
