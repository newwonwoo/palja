# 2026-10-21 추가 검증 근거

코드 `fbe24e8458d14dfae4028b05a50d44a5f4747e87`의 [CI 실행](https://github.com/newwonwoo/palja/actions/runs/39520302564)에서 web-mobile와 browser-exit이 통과했다. 최종 변경의 CI 상태는 [PR #6](https://github.com/newwonwoo/palja/pull/6)의 검사 결과를 따른다.

- JavaScript 281 passed / 0 failed, 웹·모바일 프로덕션 빌드 통과.
- 확장 실제 브라우저 33개 검사 및 종료 버튼 검사 통과. 콘솔·런타임 오류 0.
- 신규 합성 명식을 폼에서 입력하고 독립 엔진·고정 UTC·23:30 시진·야자시 분리를 선택했다. 네트워크를 끈 뒤 저장하고 23:15 출생의 시지가 亥로 표시됨을 확인했다. 재열기에서도 같은 시지다.
- 전체 JSON 내보내기에 신규 계산 정책이 포함되고 기존 두 명식의 ID/생년이 유지되었다.
- 신살 제외 선택 시 실제 9열 표의 모든 신살 버튼이 제거되었다. 38종 지원 목록과 내격 우선/후보 병기 원칙을 실제 화면에서 확인했다.
- 기존 표시·개별 선택운·공개 인물·조후·궁합·백업·320/390/800px 검사를 포함한다.
- [합성 PNG와 결과 JSON](https://github.com/newwonwoo/palja/actions/runs/39520302564/artifacts/12311107454). 개인 데이터 없음.

## `engine.zi-hour`, `settings.calculation` 게이트

| 게이트 | 근거 |
|---|---|
| input | 실제 새 명식 폼과 시진/일주 경계 선택 |
| action | 오프라인 명식 저장 및 계산 |
| result | 23:15 시지 亥 표시 + JS의 23:29/30·자정·축시·오시·해시 경계 양성/음성 |
| persistenceWhenApplicable | 재열기와 전체 백업 JSON의 정책 유지 |
| offline | 브라우저 네트워크 차단 중 신규 명식 저장/계산 |
| regression | 전체 JS 281개·기존7파일 SHA·생산 빌드·기존 UI33개 검사 |
| independentEngineOrPublishedReferenceWhenApplicable | 독립 천문 엔진의 경계 테스트, 태양시·역사적 DST 조합, 명시한 시진/일주 계약. 원본 앱 결과 비교는 하지 않음 |

따라서 두 기능은 명시한 독립 구현 계약에 대해 검증 완료로 기록한다. 조사표 ‘자오해사’의 원본 의미나 미노출 원본 옵션의 동일성을 입증한 것은 아니다. 나머지 기능에 이 결과를 자동 전파해 전체 검증 완료로 올리지 않는다.

## 개인 업데이트

합성 SQLite 테스트와 unsigned release 생성은 실제 개인 서명·기기 설치와 구분한다. 해당 APK를 기존 개인 앱의 업데이트로 설치할 수 있다고 안내하지 않는다. 실기기 보존 게이트는 대기 상태를 유지한다.
