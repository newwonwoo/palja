import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = filename => readFileSync(new URL('../'+filename, import.meta.url), 'utf8');

test('vault X is a real app exit action rather than scroll-to-top', () => {
  const vault = source('src/mobile/ReferenceVault.jsx');
  const mobile = source('src/mobile/MobileApp.jsx');
  assert.match(vault, /aria-label="앱 종료"[^>]*disabled=\{busy\} onClick=\{onExit\}/);
  assert.doesNotMatch(vault, /title="목록 맨 위로"/);
  assert.match(mobile, /<ReferenceVault[^>]*onExit=\{exitVault\}/);
});

test('native exit finishes Android Activity without deleting data', () => {
  const plugin = source('android/app/src/main/java/com/newwonwoo/saju/SajuVaultPlugin.java');
  const persistence = source('src/vault/persistence.js');
  assert.match(persistence, /NativeVault\.exitApp\(\)/);
  assert.match(plugin, /@PluginMethod public void exitApp\(PluginCall call\)/);
  assert.match(plugin, /activity\.runOnUiThread\(\(\) -> \{\s*call\.resolve\(\);\s*activity\.finish\(\);/);
  assert.match(plugin, /documentBusy\.get\(\)/);
  const exitSection = plugin.split('@PluginMethod public void exitApp(PluginCall call)')[1].split('@PluginMethod public void loadState')[0];
  assert.doesNotMatch(exitSection, /\bdelete\b|clear\(|DROP TABLE/);
});
