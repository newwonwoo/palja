import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import {
  createEmptyVault, upsertEntry, createBackup, restoreBackup, validateVault,
} from '../src/vault/model.js';

// Generated records and memo text only. No screenshots, personal imports, DB,
// filesystem exports, browser, or network are needed for these transport checks.
const LIMIT = 8 * 1024 * 1024;
const TIMESTAMP = '2000-01-01T00:00:00.000Z';
const bytes = value => Buffer.byteLength(value, 'utf8');
const root = fileURLToPath(new URL('../', import.meta.url));

const bundled = await build({
  stdin: {
    contents: `
      export { serializeBackup, parseImportText, saveState } from './src/vault/persistence.js';
      export { storageProbe } from '@capacitor/core';
    `,
    resolveDir: root,
    sourcefile: 'persistence-limits-test-entry.mjs',
    loader: 'js',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  logLevel: 'silent',
  plugins: [{
    name: 'in-memory-native-vault-probe',
    setup(builder) {
      builder.onResolve({ filter: /^@capacitor\/core$/ }, () => ({ path: 'capacitor-test-probe', namespace: 'limits-test' }));
      builder.onLoad({ filter: /.*/, namespace: 'limits-test' }, () => ({
        loader: 'js',
        contents: `
          export const storageProbe = { platform: 'web', writes: [], forbidNative: true };
          export const Capacitor = { getPlatform: () => storageProbe.platform };
          export function registerPlugin() {
            return {
              async saveState({ json, expectedRevision }) {
                storageProbe.writes.push({ json, expectedRevision });
                if (storageProbe.forbidNative) throw new Error('Unexpected native storage access');
                return { revision: expectedRevision + 1 };
              },
            };
          }
        `,
      }));
    },
  }],
});
const { serializeBackup, parseImportText, saveState, storageProbe } = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`
);

function syntheticState(count, memo = '') {
  assert.ok(count > 0);
  const initial = upsertEntry(createEmptyVault(), { name: '합성 크기 테스트', memo: '' });
  const template = initial.entries[0];
  const state = {
    ...initial,
    entries: Array.from({ length: count }, (_, index) => ({
      ...template,
      id: `limits-entry-${index}`,
      name: `합성 크기 테스트 ${index}`,
      memo,
      favorite: index === 0,
      birth: { ...template.birth, birth_record_id: `limits-birth-${index}` },
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    })),
    selfId: 'limits-entry-0',
    recent: [{ entryId: 'limits-entry-0', openedAt: TIMESTAMP }],
  };
  assert.deepEqual(validateVault(state), { valid: true, errors: [] });
  return state;
}

function fillAsciiMemosToStateSize(state, targetBytes) {
  let remaining = targetBytes - bytes(JSON.stringify(state));
  assert.ok(remaining >= 0, 'Fixture metadata must fit the requested byte boundary.');
  for (const entry of state.entries) {
    assert.equal(entry.memo, '');
    const length = Math.min(20000, remaining);
    entry.memo = 'x'.repeat(length);
    remaining -= length;
  }
  assert.equal(remaining, 0, 'Use enough records to keep each memo within the UI limit.');
  assert.equal(bytes(JSON.stringify(state)), targetBytes);
  assert.deepEqual(validateVault(state), { valid: true, errors: [] });
  return state;
}

function exactLimitBackup() {
  const state = syntheticState(450);
  const backup = createBackup(state);
  const envelopeBytes = bytes(JSON.stringify(backup)) - bytes(JSON.stringify(backup.state));
  fillAsciiMemosToStateSize(backup.state, LIMIT - envelopeBytes);
  assert.equal(bytes(JSON.stringify(backup)), LIMIT);
  return backup;
}

function forbidStorage(t) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  let indexedDBReads = 0;
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    get() {
      indexedDBReads += 1;
      throw new Error('Unexpected IndexedDB access');
    },
  });
  storageProbe.writes.length = 0;
  storageProbe.forbidNative = true;
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'indexedDB', previous);
    else delete globalThis.indexedDB;
    storageProbe.writes.length = 0;
    storageProbe.platform = 'web';
    storageProbe.forbidNative = true;
  });
  return () => {
    assert.equal(indexedDBReads, 0, 'Oversized input must fail before looking up IndexedDB.');
    assert.equal(storageProbe.writes.length, 0, 'Oversized input must fail before calling the native plugin.');
  };
}

test('a real large memo vault round trips when pretty JSON exceeds 8 MiB but compact JSON fits', () => {
  const state = syntheticState(4096, '합성 메모 '.repeat(75));
  const backup = createBackup(state);
  const prettyBytes = bytes(JSON.stringify(backup, null, 2));
  const compact = serializeBackup(backup);
  assert.ok(prettyBytes > LIMIT, `Pretty fixture must exceed the limit; got ${prettyBytes} bytes.`);
  assert.ok(bytes(compact) <= LIMIT, `Compact fixture must fit; got ${bytes(compact)} bytes.`);

  const parsed = parseImportText(compact);
  assert.deepEqual(parsed, backup, 'Every memo and metadata field must survive serialization.');
  const restored = restoreBackup(createEmptyVault(), parsed);
  assert.equal(restored.stats.added, state.entries.length);
  assert.deepEqual(restored.state, state);
  assert.deepEqual(validateVault(restored.state), { valid: true, errors: [] });
});

test('the complete backup envelope accepts exactly 8 MiB and rejects one additional byte', () => {
  const backup = exactLimitBackup();
  const serialized = serializeBackup(backup);
  assert.equal(bytes(serialized), LIMIT);
  assert.deepEqual(parseImportText(serialized), backup);

  backup.state.entries.at(-1).memo += 'x';
  assert.equal(bytes(JSON.stringify(backup)), LIMIT + 1);
  assert.throws(() => serializeBackup(backup), /8MB/);
  assert.throws(() => parseImportText(JSON.stringify(backup)), /8MB/);
});

test('the file limit counts Korean UTF-8 bytes rather than JavaScript string length', () => {
  // Each memo remains shorter than the UI's 20,000-character field limit.
  const state = syntheticState(160, '가'.repeat(18000));
  const backup = createBackup(state);
  const serialized = JSON.stringify(backup);
  assert.ok(serialized.length < LIMIT);
  assert.ok(bytes(serialized) > LIMIT);
  assert.throws(() => serializeBackup(backup), /8MB/);
  assert.throws(() => parseImportText(serialized), /8MB/);
});

test('saveState rejects an oversized UTF-8 state before either browser or Android storage access', async t => {
  const assertNoStorage = forbidStorage(t);
  const state = syntheticState(160, '가'.repeat(18000));
  const serialized = JSON.stringify(state);
  assert.ok(serialized.length < LIMIT);
  assert.ok(bytes(serialized) > LIMIT);
  for (const platform of ['web', 'android']) {
    storageProbe.platform = platform;
    await assert.rejects(saveState(state, state.revision - 1), /8MB/, platform);
    assertNoStorage();
  }
});

test('saveState also rejects a fitting state whose backup envelope would overflow, before storage access', async t => {
  const assertNoStorage = forbidStorage(t);
  const state = fillAsciiMemosToStateSize(syntheticState(450), LIMIT);
  assert.equal(bytes(JSON.stringify(state)), LIMIT);
  assert.ok(bytes(JSON.stringify(createBackup(state))) > LIMIT);
  for (const platform of ['web', 'android']) {
    storageProbe.platform = platform;
    await assert.rejects(saveState(state, state.revision - 1), /8MB/, platform);
    assertNoStorage();
  }
});

test('saveState allows a state with an exactly fitting backup using only an in-memory native stub', async t => {
  const backup = exactLimitBackup();
  storageProbe.platform = 'android';
  storageProbe.forbidNative = false;
  storageProbe.writes.length = 0;
  t.after(() => {
    storageProbe.platform = 'web';
    storageProbe.forbidNative = true;
    storageProbe.writes.length = 0;
  });
  const saved = await saveState(backup.state, backup.state.revision - 1);
  assert.equal(saved, backup.state);
  assert.equal(storageProbe.writes.length, 1);
  assert.equal(storageProbe.writes[0].expectedRevision, backup.state.revision - 1);
  assert.deepEqual(JSON.parse(storageProbe.writes[0].json), backup.state);
  assert.equal(bytes(serializeBackup(createBackup(saved))), LIMIT);
});
