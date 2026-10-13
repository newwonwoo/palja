import { Capacitor, registerPlugin } from '@capacitor/core';
import { createEmptyVault, importScreenshotPackage, validateVault, createBackup } from './model.js';

const NativeVault = registerPlugin('SajuVault');
const LIMIT = 8 * 1024 * 1024;
let databasePromise;
let bootstrapPromise;

export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const storageLabel = () => isAndroid() ? '기기 내부 SQLite' : '이 브라우저의 저장 공간';

/** Close the native Android activity. Browser tabs cannot be programmatically closed. */
export async function exitApplication() {
  if (!isAndroid()) return false;
  await NativeVault.exitApp();
  return true;
}

function checkSize(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > LIMIT) {
    throw new Error('파일은 8MB 이하의 JSON이어야 합니다.');
  }
}

function decodeState(text, revision) {
  if (text == null) return createEmptyVault();
  checkSize(text);
  const state = JSON.parse(text);
  const result = validateVault(state);
  if (!result.valid || state.revision !== revision) {
    throw new Error('저장 데이터의 형식이 올바르지 않습니다. 백업 파일을 확인해 주세요.');
  }
  return state;
}

function openDatabase() {
  if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error('이 브라우저에서 기기 저장소를 사용할 수 없습니다.'));
    const request = indexedDB.open('saju-vault', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('state');
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('열려 있는 다른 보관함 화면을 닫고 다시 시도해 주세요.'));
    request.onsuccess = () => {
      request.result.onversionchange = () => { request.result.close(); databasePromise = null; };
      resolve(request.result);
    };
  });
  return databasePromise;
}

export async function loadState() {
  if (isAndroid()) {
    const result = await NativeVault.loadState();
    return decodeState(result.json, result.revision);
  }
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('state', 'readonly');
    const request = transaction.objectStore('state').get('vault');
    request.onsuccess = () => {
      try { resolve(decodeState(request.result?.json ?? null, request.result?.revision ?? 0)); }
      catch (error) { reject(error); }
    };
    request.onerror = () => reject(request.error);
    transaction.onabort = () => reject(transaction.error || new Error('저장소를 읽지 못했습니다.'));
  });
}

export async function saveState(state, expectedRevision) {
  const result = validateVault(state);
  if (!result.valid) throw new Error(result.errors.join('\n'));
  if (state.revision !== expectedRevision + 1) throw new Error('저장 순서가 맞지 않습니다. 다시 시도해 주세요.');
  const json = JSON.stringify(state);
  checkSize(json);
  // Every state accepted by the UI must also fit its round-trip backup envelope.
  serializeBackup(createBackup(state));
  if (isAndroid()) {
    const saved = await NativeVault.saveState({ json, expectedRevision });
    if (saved.revision !== state.revision) throw new Error('저장 버전을 확인하지 못했습니다.');
    return state;
  }
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction('state', 'readwrite');
    const store = transaction.objectStore('state');
    let failure;
    const request = store.get('vault');
    request.onsuccess = () => {
      if ((request.result?.revision ?? 0) !== expectedRevision) {
        failure = Object.assign(new Error('다른 화면에서 저장 내용이 바뀌었습니다. 다시 시도해 주세요.'), { code: 'REVISION_CONFLICT' });
        transaction.abort();
        return;
      }
      store.put({ json, revision: state.revision }, 'vault');
    };
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(failure || transaction.error || new Error('저장하지 못했습니다.'));
    transaction.onerror = () => { failure ||= transaction.error; };
  });
  return state;
}

export function initializeVault() {
  if (!bootstrapPromise) bootstrapPromise = (async () => {
    const state = await loadState();
    if (state.revision === 0 && typeof __HAS_BUNDLED_VAULT__ !== 'undefined' && __HAS_BUNDLED_VAULT__) {
      const response = await fetch('./private/initial-vault.json');
      if (!response.ok) throw new Error('앱에 포함된 초기 명식 자료를 열지 못했습니다.');
      const text = await response.text();
      checkSize(text);
      const imported = importScreenshotPackage(state, JSON.parse(text));
      await saveState(imported.state, state.revision);
      return imported.state;
    }
    return state;
  })().catch(error => { bootstrapPromise = null; throw error; });
  return bootstrapPromise;
}

export async function importNativeFile() {
  const result = await NativeVault.importBackup();
  checkSize(result.json);
  return result.json;
}

export function serializeBackup(backup) {
  const json = JSON.stringify(backup);
  checkSize(json);
  return json;
}

export async function exportBackupFile(backup) {
  const json = serializeBackup(backup);
  const filename = `사주보관함_백업_${new Date().toISOString().slice(0, 10)}.json`;
  if (isAndroid()) return NativeVault.exportBackup({ json, filename });
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { saved: true, filename };
}

export function parseImportText(text) {
  checkSize(text);
  try { return JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch { throw new Error('JSON 파일을 읽지 못했습니다. 압축 파일은 풀어서 JSON을 선택해 주세요.'); }
}

/** On Android the image goes through the system document picker; never a web upload. */
export async function exportPngFile(dataUrl,filename='saju-chart.png'){
 if(typeof dataUrl!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(dataUrl)||dataUrl.length>6*1024*1024)throw new Error('PNG 이미지 크기 또는 형식을 확인하세요.');
 if(isAndroid())return NativeVault.exportImage({base64:dataUrl.slice('data:image/png;base64,'.length),filename});
 const raw=atob(dataUrl.slice('data:image/png;base64,'.length));
 const bytes=Uint8Array.from(raw,character=>character.charCodeAt(0));
 const blob=new Blob([bytes],{type:'image/png'});
 const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=filename;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 return {saved:true,filename};
}
