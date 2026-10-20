import {readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scope = JSON.parse(readFileSync(join(root, 'docs/full-feature-scope.json'), 'utf8'));
const features = scope.features;
const implementationLabels = {
  implemented: '구현', partial: '부분 구현', not_implemented: '미구현',
  verified: '구현·검증 완료',
};
const verificationLabels = {
  passed: '통과', partial: '부분 검증', pending: '대기',
  not_applicable_presentation: '표시 기능',
};
const areaLabels = {
  input: '입력', library: '보관함', reader: '명식 보기', engine: '계산',
  analysis: '분석', fortune: '운세', match: '궁합', memo: '메모',
  tools: '도구', settings: '설정', data: '데이터',
};
const uniqueIds = new Set(features.map(feature => feature.id));
if (uniqueIds.size !== features.length || features.some(feature => !implementationLabels[feature.implementation])) {
  throw new Error('기능 ID 또는 구현 상태를 확인하세요.');
}

const count = status => features.filter(feature => feature.implementation === status).length;
const parityComplete = feature => feature.implementation === 'verified'
  && feature.referenceBehavior === 'verified'
  && feature.independentVerification === 'passed'
  && typeof feature.originalComparisonEvidence === 'string'
  && feature.originalComparisonEvidence.trim().length > 0;
const verified = features.filter(parityComplete).length;
const sections = [...new Set(features.map(feature => feature.area))];
const artifacts = scope.target.artifactVerification;
const baseVerified = artifacts?.baseApk?.verified === true;
const archiveVerified = artifacts?.splitArchive?.verified === true;
const libappVerified = artifacts?.arm64Libapp?.verified === true;
const checked = value => value ? 'x' : ' ';
const lines = [
  '# 원본 APK 대조 체크리스트',
  '',
  '이 목록은 `full-feature-scope.json`의 79개 작업 단위를 추적한다. 원본 앱 전체 기능 수를 확정한 목록은 아니다. 새 기능이 확인되면 JSON에 행을 추가하고 이 문서를 다시 생성한다.',
  '',
  `현재 자체 구현 분류: **구현 ${count('implemented') + count('verified')} / 부분 구현 ${count('partial')} / 미구현 ${count('not_implemented')}**. 원본 대조와 독립 검증을 모두 통과한 항목: **${verified} / ${features.length}**. 자체 구현 숫자를 원본 일치율로 해석하지 않는다.`,
  '',
  '## 원본 확보 및 판정 기준',
  '',
  `- [${checked(archiveVerified)}] 원본 \`8자어때-18.2.8-split-apks.zip\` 전체 무결성 확인. 기존 분석 기록의 예상 SHA-256: \`8b2977069ae037dfb960f13d67cc423dab484f767d1938a1071e0a63148f1b1c\`.`,
  `- [${checked(baseVerified)}] \`base.apk\` SHA-256 \`39df6df7b492c272a82dd8b59388369c4b1b7a1840da8dbd9c6a64588a6fda09\`, ZIP CRC, APK v2/v3 서명 검증. 패키지 \`com.mansecalendar8.mansecalendar8.lite\`, 버전 18.2.8 확인.`,
  `- [${checked(libappVerified)}] ARM64 \`libapp.so\` 전체 확보 및 SHA-256 \`a5e4c25d119466c2c46b870509c5b1f59395b59b034b73ffa3e6658a6e4b1d9d\` 확인.`,
  '- [ ] 원본 앱을 실행해 각 기능의 화면, 입력, 조작, 결과, 재열기, 저장, 오프라인 동작을 기록. 모듈 이름만으로 실제 동작을 확정하지 않는다.',
  '- [ ] 같은 합성 입력으로 Palja 결과를 대조하고, 차이와 계산 기준을 기록. 개인정보·원본 APK·서명키는 공개 저장소에 넣지 않는다.',
  '- [ ] Android 실기기에서 업데이트 서명, 기존 SQLite 유지, 백업·복원, 종료·재실행을 확인.',
  '',
  '각 항목의 체크는 **자체 구현 완료 + 원본 동작 검증 + 독립 검증 + 비교 근거 기록**을 모두 충족할 때만 표시한다. 완료 항목은 JSON에 `implementation: "verified"`, `referenceBehavior: "verified"`, `independentVerification: "passed"`, `originalComparisonEvidence`를 기록한다. APK 확보·정적 분석은 기능 동작 검증과 별개다. 기존 APK 분석 요약은 [기록](rea-apk-real-18.2.8.md)을 참고한다.',
  ...(artifacts ? ['', `현재 파일 검증: **${artifacts.checkedOn}**. base APK ${baseVerified ? '검증 완료' : '미검증'} / 전체 ZIP ${archiveVerified ? '검증 완료' : '미검증'} / ARM64 실행 파일 ${libappVerified ? '검증 완료' : '불완전'}. [새 분석 기록](${artifacts.report}).`] : []),
  '',
  '갱신 방법: `docs/full-feature-scope.json`의 상태·남은 작업·근거를 수정한 뒤 `node scripts/update-original-parity-checklist.mjs`를 실행한다. 체크박스는 그 상태에서 자동 생성한다.',
  '',
];
for (const area of sections) {
  lines.push(`## ${areaLabels[area] || area}`, '');
  for (const feature of features.filter(item => item.area === area)) {
    const mark = parityComplete(feature) ? 'x' : ' ';
    const reference = feature.referenceBehavior === 'verified' ? '원본 검증' : '원본 미검증';
    const independent = verificationLabels[feature.independentVerification] || feature.independentVerification;
    const gap = (feature.gap || '원본 화면·동작·결과 대조 필요').replaceAll('\n', ' ').trim();
    lines.push(`- [${mark}] \`${feature.id}\` ${feature.title} — 자체 ${implementationLabels[feature.implementation]} · ${reference} · 독립 검증 ${independent}. 범위·남은 작업: ${gap}`);
  }
  lines.push('');
}
writeFileSync(join(root, 'docs/original-apk-parity-checklist.md'), lines.join('\n'));
