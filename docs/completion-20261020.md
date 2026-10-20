# 79개 기능 구현·검증 작업 기록

요청: 체크리스트를 유지하며 전체 기능을 구현한다. 현재 단일 현황은 [구현 체크리스트](IMPLEMENTATION_CHECKLIST.md)이며, 부분 구현을 완료로 계산하지 않는다. 이 작업은 **개발 중**이고 100% 완료 또는 새 개인 업데이트 APK 배포를 뜻하지 않는다.

## 이번 구현

- 표시 설정: 십성·지장간·운성·납음·신살 토글, 나이 3기준, 오행 색 5개 직접 지정, 명조/고딕/고정폭, 글자 크기, 카드/행 배열, 탭·배너 순서. 선택 설정은 검증되는 선택적 namespace로 저장하며 이전 백업을 읽는다.
- 명식별 운 선택: 이전 단일 선택 필드를 읽고, 명식마다 선택일·시각을 따로 보존한다. 전체/선택 백업과 로컬 우선 병합에 연결한다. 현재 운, 계층별 선택, 일별 달력, 월별 오행 비율을 연결한다.
- 입력·역법: 23개 도시, 17개 IANA 시간대(한국 포함), 고정 UTC/직접 경도. 한국 2025b 표는 보존하고 해외 2026b 전환표를 내장한다. 야자시 분리, 대운 순역 직접 지정, 평균년 비례/UTC 달력 가산을 제공하고 기산 단계를 표시한다.
- 분석: 9열 관계표, 5계층 오행·음양, 편집 가능한 합화 전환, 월지 본기/투간 격국 후보, 월령/사령/투간, 5용신 방법 후보·희기구한, 10천간 물상·일주별 자체 관찰 질문. 기존 엔진 판정은 보존하고 새 연구 규칙을 구분해 표시한다.
- 신살: 기존 십이신살/5종에 문창·금여·국인·태극·홍염·유하·천덕·월덕·천의·고신·과숙·홍란·천희·귀문 조견표를 연결한다. 일/년/양쪽 기준을 저장한다. **모든 학파의 신살 전체를 구현했다는 뜻은 아니다.**
- 궁합: 목록에서 2명 선택 후 직접 비교, 양방향 십성, 구조 유사도/관계 구성/비중 편집, 보관함 전체 조건 검색. 구조 점수는 실제 관계 성공률이나 좋고 나쁨의 점수가 아니다.
- 공개 자료: 공개 생년월일·출생지 3명, 분류·검색·근거 저장·중복 추가 방지. 출생 시각과 성별은 자동 추정하지 않는다.
- 체크리스트: 79행·7개 검증 게이트·근거 파일을 검사하고, 미완료가 남으면 `checklist:complete`가 실패한다. CI에서 체크리스트 최신성과 원래 계산/저장 코드 해시를 검사한다.

## 검증과 환경 제한

첫 CI에서 Node 241개, 브라우저 확장 21검사, 웹/모바일 빌드, 네이티브 테스트와 debug APK 빌드가 모두 통과했다. [실행 및 증거 기록](ci-verification-20261020.md)을 참고한다. 로컬 환경 제한과 CI의 실제 통과는 구분한다.

- Node 단위·회귀 및 React 서버 렌더링 테스트를 실행했다. 세부 수와 CI 결과는 PR/작업 결과를 참고한다. SSR은 클릭·레이아웃·실기기 검증을 대체하지 않는다.
- `npm run build`, `npm run build:mobile`, `npm run android:sync`를 실행한다. 동기화 성공은 APK 빌드 성공이 아니다.
- 로컬 HTTP 서버: `PermissionError: [Errno 1] Operation not permitted`. 로컬 Chromium도 실행되지 않았다. Browser의 제어 도구가 제공되지 않아 저장소 Playwright 검증을 준비했다. **로컬 화면 조작·스크린샷 통과를 주장하지 않는다.**
- 로컬 Gradle: `Could not determine a usable wildcard IP for this machine`로 시작 단계 실패. 로컬 네이티브 테스트·APK 생성은 통과로 기록하지 않는다. GitHub CI에서 재검증한다.
- 기존 `src/App.jsx`와 네이티브 6개 파일은 재개 시점 `db273b0`에서 byte-for-byte 보존한다. 과거 1.1.0 해시는 이미 병합된 PNG/종료 기능 때문에 현 기준과 다르므로 별도 보존하며, 이번 변경을 허용하기 위해 덮어쓰지 않았다.
- 개인 SQLite·개인 JSON·실제 출생자료·서명키·개인 APK는 이 변경에 포함하지 않는다. 실제 기기의 동일 인증서 업데이트/기존 명식 유지 확인은 별도 미완료다.

## 규칙 범위와 근거

독립 계산을 명시적으로 선택해야 기존 명식 계산 기준이 바뀐다. 새 분석은 `palja-research-v1`이라는 제품 규칙이며 전통의 모든 학파가 합의한 판정이나 원본 앱 산식으로 표현하지 않는다.

- 신강약: 비겁+인성 상대 비중 60% 이상/40% 이하의 경향 분류. 병약: 한 오행 40% 이상 집중 시 이를 극하는 오행을 후보로 표시. 외격 75% 후보 탐색은 정식 종격 판정의 완성으로 세지 않는다.
- 사령: 기존 EBH의 30일 지장간 배당을 절입 후 실제 경과일에 대입한다. 진신/가신은 이 표에서 사령과 투간이 일치/불일치하는 단순 분류이다. 다른 월령·조후 학파의 전체 판정은 미완료다.
- 합화: 인접·월령의 생조·중복 쟁합 제외 조건에서 천간 기여분만 선택 비율로 옮긴다. 합화 전체 성립론 또는 인생 사건 예측이 아니다.
- 대운: 평균년 비례는 365.2425일/년. 달력 가산은 경과 3일=1년, 1일=4개월, 월 미만은 30일/월로 비례하고 UTC 달력에서 가산한다. 학파별 전 방법을 같다고 보지 않는다.
- 해외 표: [IANA tzdb](https://www.iana.org/time-zones) 2026b, `/usr/share/zoneinfo/tzdata.zi`에서 확인. 재생성 스크립트는 버전을 기록한다. 런던의 1941~1947 이중 서머타임은 IANA의 base 0 / G SAVE 2 규칙을 적용하며 1968~1971 고정 BST(표준시 변경)는 DST로 제거하지 않는다.
- 문창 10간 대응: [점친당의 공개 판정표](https://jumchindang.com/wiki/문창귀인). 금여·태극·월덕·고신/과숙과 홍염의 선택한 고전 변형은 [삼명통회 권3](https://zh.wikisource.org/wiki/三命通會/卷三)을 참고한다. 홍염은 戊→子, 壬→巳 변형을 별도 명칭으로 표시한다. 모든 추가 표의 독립 전수 검증이 끝났다고 기록하지 않는다.
- 공개 인물: [튜링 — King’s College](https://www.kings.cam.ac.uk/alan-mathison-turing-1912-54), [호퍼 — 미 해군](https://www.history.navy.mil/content/history/nhhc/browse-by-topic/people/namesakes/grace-hopper.html), [존슨 — NASA](https://science.nasa.gov/people/katherine-johnson/). 생년월일과 출생지만 요약하고 시간·비공개 자료를 만들지 않는다.

## 남은 작업

고급 격국·체용·병약의 전체 규칙과 충돌 우선순위, 신살 전체 목록의 독립 검증, 자오해사 세부 정책, 행운 선택/궁합 점수의 검증 가능한 범위, 5계층 조후 기준, 실기기 DB 보존 확인은 체크리스트에 남긴다. 명칭이나 안내 버튼이 있다는 이유로 완료 체크를 하지 않는다.

다음 검증 명령:

```sh
npm test
node --test --test-isolation=none tests/*.test.mjs
npm run checklist:check
node scripts/verify-integrated-boundaries.mjs
npm run build
npm run android:sync
# CI or a local environment that permits local networking:
node scripts/generate-integration-fixture.mjs /tmp/palja-completion-qa
QA_DIR=/tmp/palja-completion-qa node tests/browser/completion-extension.cjs
(cd android && ./gradlew --no-daemon testDebugUnitTest assembleDebug)
```
