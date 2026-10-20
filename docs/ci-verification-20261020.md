# CI 검증 기록 — 기능 체크리스트 확장

## 첫 실행: 실제 통과

- 코드: `d1ca45dabe006cba23253c463f55c40dd5323caf`
- [초안 PR #6](https://github.com/newwonwoo/palja/pull/6)
- [Actions 실행 39515789494](https://github.com/newwonwoo/palja/actions/runs/39515789494)
- 종료: 2026-10-20 23:35 UTC. `web-mobile`, `browser-exit`, `android` 모두 성공.

| 검증 | 결과 | 근거 |
|---|---|---|
| JavaScript | 241 passed / 0 failed | web-mobile 로그 |
| 체크리스트 최신성·79행 명세 | 통과 | web-mobile 6단계 |
| 기존 계산·네이티브 7파일 보존 | 통과 | 고정 db273b0 해시와 비교 |
| 웹·모바일 프로덕션 빌드 | 통과 | web-mobile 7단계 |
| 실제 브라우저 조작 | 확장 21검사 및 종료 버튼 검사 통과 | browser-exit 6·7단계 |
| 콘솔·런타임 오류 | 0 | completion-results.json |
| 320/390/800 px | 설정·분석 외부 넘침 없음 | 결과 JSON 및 PNG |
| Android JVM 테스트 + assembleDebug | `BUILD SUCCESSFUL` | android 7단계 |

실제 확인한 흐름: 설정 토글/나이·디자인·탭 순서 저장 → 새로고침 → 명식표 표시 → 9열 분석 → 선택일·시각/운 트리/일별 달력/월별 도식 → 다른 명식을 열어도 각각 선택 유지 → 네트워크를 끊고 저장 → 궁합 비중 저장 → 출처가 있는 공개 인물 추가 → 전체 JSON 백업.

브라우저 출처: 로컬 Browser 제어 도구가 제공되지 않아 저장소 Playwright를 GitHub Ubuntu/Chromium에서 실행했다. 로컬 실행 환경에서 막힌 서버/브라우저/Gradle을 통과했다고 기록하지 않고 CI에서 별도 검증했다.

[브라우저 증거 artifact](https://github.com/newwonwoo/palja/actions/runs/39515789494/artifacts/12307882073): `completion-results.json`, 설정 390px와 분석 320/390/800px 화면. artifact는 7일 보관이다. 원본 결과와 스크린샷을 직접 확인했다.

## 두 번째 실행: 실제 통과

코드 `f3b9ec385338fd1d70d229022c8fe7eee71a5d18`, [Actions 39516714776](https://github.com/newwonwoo/palja/actions/runs/39516714776). 웹·브라우저·Android 세 작업 모두 성공했다. JavaScript **246/246**, 확장 브라우저 **26/26**, 콘솔 오류 **0**. 탭 순서·글꼴·실제 나이 표시·사용자 도식 색 대비와 대운 클릭을 추가 검증했다. [최신 화면 증거](https://github.com/newwonwoo/palja/actions/runs/39516714776/artifacts/12307694827)를 내려받아 직접 확인했다.

표시 설정·배열·운 선택은 외부 명리 판정이 아닌 저장/UI 기능이므로, 독립 검증은 직접 적은 날짜·나이·밝기 산술의 예상값, 명식별 상태/백업 분리, 실제 DOM/계산 스타일 결과와 비교한다. 고급 명리 판정의 근거 검증을 이 UI 검증으로 대체하지 않는다.

## 후속 보완

화면 검토에서 색 선택기 너비와 연한 오행 도식 글자 대비를 개선했다. 대운 클릭은 실제 시작 순간을 현지 시각으로 바꾸고 분 단위 올림으로 경계 앞을 선택하지 않게 했다. 달력 가산 대운의 다음 실제 시작 순간을 써서 평균년 근사 때문에 생기는 간격/중복도 막았다. 추가 단위 및 CI 검증 결과는 후속 커밋/Actions에서 별도 확인한다.

## 검증 범위 밖

- 원본 앱과 결과 직접 비교는 사용자 고정 지침에 따라 하지 않았다.
- 연구 규칙의 전체 학파 정확성, 모든 길신·흉살과 외잡격 전체, 행운/궁합 성패 점수는 검증 완료가 아니다.
- debug APK는 개인 출생자료가 없는 신규 설치 진단용이다. 기존 개인 앱과 같은 인증서 업데이트 또는 실기기 SQLite 보존을 검증한 파일이 아니다.
- 전체 79개 기능 완료를 뜻하지 않는다. 부분 구현 9개와 미통과 게이트는 체크리스트에 유지한다.
