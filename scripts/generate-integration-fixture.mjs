/** Synthetic data only. Do not load a user's private seed in public CI. */
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createEmptyVault,upsertEntry} from '../src/vault/model.js';
const dir=resolve(process.argv[2]||'/tmp/saju-ui-check');mkdirSync(dir,{recursive:true});
let state=createEmptyVault();
state=upsertEntry(state,{name:'합성 명식 가',memo:'기존 메모 유지',birth:{input_year:2000,input_month:2,input_day:29,input_hour:13,input_minute:45,time_status:'known',calendar_type:'solar',lunar_leap_month:false,sex:'male'}});
state=upsertEntry(state,{name:'합성 명식 나',memo:'비교용 합성 기록',birth:{input_year:1996,input_month:9,input_day:4,input_hour:11,input_minute:0,time_status:'known',calendar_type:'solar',lunar_leap_month:false,sex:'female'}});
writeFileSync(join(dir,'seed.json'),JSON.stringify(state));
// 1 x 1 PNG fixture, no font or source-app asset.
writeFileSync(join(dir,'tiny.png'),Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64'));
