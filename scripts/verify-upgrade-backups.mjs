/** Read-only, local comparison. Never prints names, IDs, notes or attachments. */
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {validateVault} from '../src/vault/model.js';

function stateOf(payload){
 if(payload?.format!=='saju-vault-backup'||payload.version!==1)throw new Error('지원하는 전체 백업 파일이 아닙니다.');
 const state=payload.state;
 if(!validateVault(state).valid)throw new Error('백업 상태 검증에 실패했습니다.');
 return state;
}
export function compareUpgradeBackups(beforePayload,afterPayload){
 const before=stateOf(beforePayload),after=stateOf(afterPayload),differences=[];
 // Opening a record may legitimately update recent; revision counts writes.
 const ignored=new Set(['recent','revision']);
 function visit(a,b,path){
  if(a===null||typeof a!=='object'){if(!Object.is(a,b))differences.push(path);return;}
  if(Array.isArray(a)){
   if(!Array.isArray(b)){differences.push(path);return;}
   const keyed=a.length>0&&a.every(x=>x&&typeof x==='object'&&typeof x.id==='string');
   if(keyed){for(let i=0;i<a.length;i++)visit(a[i],b.find(x=>x?.id===a[i].id),path+'['+i+']');}
   else {if(a.length!==b.length)differences.push(path+'.length');for(let i=0;i<a.length;i++)visit(a[i],b[i],path+'['+i+']');}
   return;
  }
  if(!b||typeof b!=='object'||Array.isArray(b)){differences.push(path);return;}
  for(const key of Object.keys(a)){if(path==='$'&&ignored.has(key))continue;visit(a[key],b[key],path+'.'+key);}
 }
 visit(before,after,'$');
 return {preserved:differences.length===0,checkedEntries:before.entries.length,checkedSources:before.sources.length,differences:[...new Set(differences)],ignoredRootFields:[...ignored]};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try {
  if(process.argv.length!==4)throw new Error('사용법: node scripts/verify-upgrade-backups.mjs 설치전.json 설치후.json');
  const texts=await Promise.all(process.argv.slice(2).map(path=>readFile(path,'utf8')));
  const result=compareUpgradeBackups(...texts.map(JSON.parse));
  console.log(JSON.stringify({...result,backupSha256:texts.map(t=>createHash('sha256').update(t).digest('hex'))},null,2));
  if(!result.preserved)process.exitCode=1;
 }catch(error){console.error(error instanceof SyntaxError?'백업 JSON을 읽지 못했습니다.':error.message);process.exitCode=1;}
}
