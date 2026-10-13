import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, cpSync, existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const script = resolve('scripts/sign-personal-update.sh');
const signer = '76b0434edf1bde06e8b82b41eb8b40d380f06cb6d989827a4ce5c6506cabcd02';

test('local-signing helper is valid Bash and has no embedded private signing key', () => {
  execFileSync('bash', ['-n', script]);
  const source=readFileSync(script,'utf8');
  assert.match(source, /apksigner.*verify/);
  assert.match(source, /activity|versionCode|installed_version/);
  assert.match(source, /fingerprint_from_keystore/);
  assert.match(source, /\bexpected='/);
  assert.doesNotMatch(source, /BEGIN PRIVATE KEY/);
});

test('update signing requires ORIGINAL signer and refuses unrelated signing keys', () => {
  const dir=mkdtempSync(join(tmpdir(),'palja-update-test-'));
  try {
    const bin=join(dir,'bin');
    mkdirSync(bin);
    const mock=`#!/usr/bin/env bash
set -euo pipefail
case "$(basename "$0")" in
  keytool)
    echo "  SHA256: $KEY_CERT"
    ;;
  aapt)
    case "${@: -1}" in
      *original.apk) echo "package: name='com.newwonwoo.saju' versionCode='12' versionName='1.1.2'" ;;
      *) echo "package: name='com.newwonwoo.saju' versionCode='14' versionName='1.1.4'" ;;
    esac
    ;;
  apksigner)
    if [[ "$1" == 'verify' ]]; then
      case "${@: -1}" in
        *unsigned*) exit 1 ;;
        *) echo "Signer #1 certificate SHA-256 digest: $SIGNING_CERT" ;;
      esac
    elif [[ "$1" == 'sign' ]]; then
      args=("$@")
      for ((i=0;i<${#args[@]};i++)); do
        if [[ "${args[i]}" == '--out' ]]; then
          cp "${args[-1]}" "${args[i+1]}"
          exit 0
        fi
      done
      exit 4
    fi
    ;;
  zipalign)
    if [[ "$1" == '-c' ]]; then exit 0; fi
    cp "$3" "$4"
    ;;
esac
`;
    for(const name of ['keytool','aapt','apksigner','zipalign']){
      const location=join(bin,name);
      writeFileSync(location,mock);
      chmodSync(location,0o755);
    }
    const original=join(dir,'original.apk'),unsigned=join(dir,'app-release-unsigned.apk'),key=join(dir,'private.jks'),out=join(dir,'Palja-UPDATE.apk');
    for(const f of [original,unsigned,key])writeFileSync(f,'synthetic-non-apk-fixture');
    const env={...process.env, PATH:bin+':'+process.env.PATH,
      PALJA_KEY_ALIAS:'personal', PALJA_KS_PASS:'synthetic', PALJA_KEY_PASS:'synthetic',
      SIGNING_CERT:signer,KEY_CERT:'0000000000000000000000000000000000000000000000000000000000000000'};
    assert.throws(()=>execFileSync('bash',[script,original,unsigned,key,out],{env,stdio:'pipe'}),/Command failed/);
    assert.equal(existsSync(out),false,'must never create output for a mismatched keystore');
    const approved={...env,KEY_CERT:signer};
    const status=execFileSync('bash',[script,original,unsigned,key,out],{env:approved,encoding:'utf8'});
    assert.match(status,/VERIFIED update APK/);
    assert.equal(existsSync(out),true);
    assert.equal(readFileSync(out,'utf8'),'synthetic-non-apk-fixture');
  } finally {rmSync(dir,{recursive:true,force:true});}
});
