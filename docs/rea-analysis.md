# REA 정적 분석 기록

분석일은 **2026-10-11 UTC**입니다. 대상은 [8자어때 공식 공개 모바일 웹](https://8saju.com/mobile/)이며, 취득한 HTML에 표시된 버전은 **v1.02**입니다. 현재 Android 앱의 APK 분석 결과가 아닙니다.

## 도구와 입력

| 항목 | 실제 사용한 값 |
| --- | --- |
| 공식 저장소 | [morluto/rea](https://github.com/morluto/rea) |
| 체크아웃한 커밋 | `21650455a9c90a26e725c3505a3c17054cc4516c` |
| 실행 패키지 | 공개 npm 패키지 `rea-agents@6.4.0` |
| Node.js | `v24.19.0` |
| 취득 범위 | HTML 1개, HTML에 선언된 외부 JS 9개, 추출한 인라인 JS 1개 |

공개 GET으로 자료를 확보하고, 변경하지 않은 공식 REA 함수를 호출했습니다. 대상 JavaScript 실행, 로그인, 명식 API 제출, 외부 LLM 요청은 하지 않았습니다. 개인 명식·스크린샷은 분석 입력에 포함하지 않았습니다. 동적으로 불러오는 추가 자산과 API 응답은 분석 범위 밖입니다.

정적 분석 입력 10개는 다음과 같습니다. `complete`와 `partial`은 REA가 반환한 파싱 상태입니다.

| 입력 소스 | 파싱 |
| --- | --- |
| [8saju.com/mobile/data/document.js](https://8saju.com/mobile/data/document.js) | complete |
| [8saju.com/mobile/files/index/data.js](https://8saju.com/mobile/files/index/data.js) | complete |
| `8saju.com/mobile/inline/inline-001.js` — 취득 HTML에서 추출 | complete |
| [jquery-1.7.1.min.js](https://8saju.com/mobile/resources/scripts/jquery-1.7.1.min.js) | complete |
| [jquery-ui-1.8.10.custom.min.js](https://8saju.com/mobile/resources/scripts/jquery-ui-1.8.10.custom.min.js) | complete |
| [prototypePost.js](https://8saju.com/mobile/resources/scripts/prototypePost.js) | partial · 회복한 파서 오류 2개 |
| [prototypePre.js](https://8saju.com/mobile/resources/scripts/prototypePre.js) | complete |
| [assets.8saju.com/8saju.js](https://assets.8saju.com/8saju.js) | complete |
| [assets.8saju.com/AxureEx.js](https://assets.8saju.com/AxureEx.js) | complete |
| [assets.8saju.com/web2app.js](https://assets.8saju.com/web2app.js) | complete |

## 실행 결과: CLI 중단과 함수 호출 성공

별도 분석 작업 폴더에서 다음 CLI를 실행했습니다. 아래 입력 경로는 실제 절대 경로 대신 같은 폴더를 가리키는 상대 경로로 표기했습니다.

```sh
node runtime/node_modules/rea-agents/scripts/rea.mjs analyze-javascript-application public-web/files --format json --full-output
```

CLI는 **exit 1**로 끝났습니다. 격리 자식 프로세스의 소유권 확인에 사용하는 Linux `ps`가 `fatal library error, lookup self`로 실패하여, 대상 코드 파싱 전에 중단되었습니다. 검사를 수정하거나 결과를 위조하지 않았습니다. 저장된 부분 Evidence는 완료된 앱 분석 결과로 취급하지 않습니다. CLI 동작의 공식 근거는 [해당 커밋의 CLI 문서](https://github.com/morluto/rea/blob/21650455a9c90a26e725c3505a3c17054cc4516c/docs/cli.md)입니다.

이후 다음 두 스크립트에서 공식 패키지의 함수를 직접 import했고, **두 명령 모두 exit 0**으로 완료했습니다.

```sh
node --max-old-space-size=2048 commands/run_rea_static.mjs
node commands/extract_contract_literals.mjs
```

| 공식 API | 수행 범위 |
| --- | --- |
| [analyzeJavaScriptStaticSource](https://github.com/morluto/rea/blob/21650455a9c90a26e725c3505a3c17054cc4516c/src/domain/javascript/javascriptStaticAnalysis.ts) | `dist/domain/javascript/javascriptStaticAnalysis.js`에서 import, JS 10개 정적 분석 |
| [analyzeJavaScriptSemantics](https://github.com/morluto/rea/blob/21650455a9c90a26e725c3505a3c17054cc4516c/src/domain/javascript/javascriptSemanticAnalysis.ts) | `dist/domain/javascript/javascriptSemanticAnalysis.js`에서 import, 핵심 `8saju.js` 의미 분석 |
| [parseJavaScriptSource](https://github.com/morluto/rea/blob/21650455a9c90a26e725c3505a3c17054cc4516c/src/domain/javascript/javascriptSourceParser.ts) | `dist/domain/javascript/javascriptSourceParser.js`에서 import, 반환 AST에서 UI·저장 계약 문자열 추출 |

합계 **AST 노드 705,090개**, 파싱 complete 9개·partial 1개입니다. 핵심 `8saju.js`는 파싱 오류 0개이며 semantic coverage가 complete로 반환되었습니다. 다만 동적 속성·함수 간 변경의 한계가 있으며 런타임 동작을 증명하지 않습니다. 이 결과는 공식 함수의 반환값으로, CLI의 전체 애플리케이션 그래프나 정식 Evidence envelope까지 생성한 것은 아닙니다. Axure 객체 생성 함수와 문자열 내부 계산식도 실행하지 않았습니다.

## 소스에서 확인한 계약과 앱에 반영한 원칙

아래 관찰은 취득한 공개 웹에 한정합니다. 주요 근거는 [8saju.js](https://assets.8saju.com/8saju.js), [공개 HTML](https://8saju.com/mobile/), [Axure UI 자료](https://8saju.com/mobile/files/index/data.js)입니다.

| 확인된 공개 웹 동작 | 보관함에 적용하는 원칙 |
| --- | --- |
| `+ → solar/양력`, `- → lunar/음력`, `= → leapLunar/윤달` 매핑이 명시됨 | 원문 기호를 보존하고 실제 가져온 기록의 역법은 사용자 확인 후 채움 |
| 성별 값은 `male`, `female`; 배지 색과 성별의 대응은 확인하지 못함 | 이름·색으로 성별을 자동 확정하지 않음 |
| `YYYYMMDD` 뒤에 선택적으로 `HHMM`을 붙이고, 시간이 없으면 비워 둠 | 미상 시각과 잘려 보이지 않는 시각을 구분하고 임의 시각을 만들지 않음 |
| 원래 음력 입력과 변환한 양력 날짜를 따로 유지함 | 원본 출생 정보와 계산 결과를 분리함 |
| `friendItems`·`recentItems` JSON 배열을 localStorage에 저장하고 ID로 삭제함 | 이름이 같은 기록을 합치지 않고, 저장 명식과 최근 열람을 별도 관리함 |
| 음력→양력 변환에 원격 `$.get()` 호출이 존재함 | 기존 사주 프로젝트의 로컬 변환기를 사용하며 지원 범위·윤달을 검증함 |

원격 음력 변환 API는 이번 분석에서 호출하지 않았습니다. 공개 웹 저장 도우미가 있다고 해서 현행 Android 앱의 SQLite 스키마나 UI 연결까지 확인된 것은 아닙니다. 새 앱의 내 명식·즐겨찾기·수정 이력·삭제 복원·백업 모델은 요구사항에 따라 구현한 것으로, 원본 Android 내부 구조의 복제라고 주장하지 않습니다.

자동 분석 수치도 소스와 대조했습니다. `8saju.js`의 `endpoints` 6개는 모두 `searchParams.get(...)` 쿼리 읽기여서 원격 API 6개로 셀 수 없습니다. 실제 음력 변환 `$.get(serviceURL, ...)`은 그 목록에 잡히지 않았습니다. 저장 관찰 13개는 원문 localStorage 호출과 대응했습니다.

시간 관련 원문에는 23:30 등의 구간, 조자시·야자시 UI, 과거 서머타임 조건 문자열이 있지만, 이벤트 실행 순서와 경계 우선순위는 확인하지 않았습니다. 이 자료만으로 현행 Android의 경도·균시차·표준시·서머타임 보정이나 화면의 보정 분 수 산출법을 확정하지 않습니다. 현재 프로젝트에서 보존한 23:30 기준 및 계산 한계는 [README](../README.md)에 별도로 명시했습니다.

## Android 분석의 미실행 범위

[공식 Google Play](https://play.google.com/store/apps/details?id=com.mansecalendar8.mansecalendar8.lite&hl=ko)의 패키지 ID는 `com.mansecalendar8.mansecalendar8.lite`입니다. 공식 APK 직접 다운로드를 확보하지 못했으며, 제3자 미러를 사용하지 않았습니다. **APK·ADB 취득, Android 클래스·리소스 분석, 원본 앱 실행 및 결과 대조는 수행하지 않았습니다.**

추가 분석에는 사용자 제공 APK 또는 승인된 본인 기기에서 취득한 설치 패키지가 필요합니다. 버전과 SHA-256을 고정한 뒤 [REA Android 문서](https://github.com/morluto/rea/blob/21650455a9c90a26e725c3505a3c17054cc4516c/docs/android-analysis.md)와 [ADB 취득 문서](https://github.com/morluto/rea/blob/21650455a9c90a26e725c3505a3c17054cc4516c/docs/adb-device-analysis.md)의 환경을 준비해야 합니다. 공개 웹 분석만으로 8자어때와 새 앱의 계산 결과가 같다고 보증하지 않습니다.

## 실행 근거의 위치

아래 파일들은 이 저장소와 별개인 **`rea-analysis` 분석 작업 폴더**에 있습니다. 상대 경로는 그 폴더 기준입니다.

- `FINDINGS.md`: 소스 위치를 포함한 전체 관찰 기록.
- `public-web/manifest.json`: 원본 URL·취득 시각·HTTP 상태·바이트 수·SHA-256.
- `evidence/rea-library/summary.json`: 10개 입력, 패키지·모듈 해시, 반환 상태와 실행 시각.
- `evidence/rea-library/*.json`, `evidence/axure-contract-literals.json`: 함수 반환값과 추출 문자열의 원문 위치.
- `logs/analyze-public-web.*`, `evidence/rea-cli-partial.json`: CLI 실패와 부분 결과.
- `logs/rea-library-static.*`, `logs/rea-contract-literals.*`: 성공한 함수 호출 로그.

분석용 원본 웹 자산과 전체 반환 JSON은 앱 코드에 복사하지 않았습니다. 이 문서에는 개인 명식이나 스크린샷을 포함하지 않습니다.
