# 전체 기능 범위와 구현 현황

79개 작업 단위를 [전체 구현 체크리스트](IMPLEMENTATION_CHECKLIST.md)에서 관리한다. **코드 구현 78/79 (98.7%)**, **7개 게이트 전체 검증 78/79 (98.7%)**다. 개별 게이트는 547/553 (98.9%). 원래 개인키로 서명한 APK의 실제 업데이트·DB 보존 확인 `data.upgrade` 1개가 남아 **100% 완료가 아니다.**

- [기계 판독 가능한 기능 명세](full-feature-scope.json)
- [항목별 7개 검증 게이트와 근거](implementation-progress.json)
- [최신 계산·분석·UI 검증과 한계](verification-calculation-flows-20261021.md)
- [개발 인수인계](PALJA_HANDOFF.md)

`npm run checklist`로 문서를 다시 만들고, `npm run checklist:check`로 최신성과 근거 파일을 검사한다. `npm run checklist:complete`는 미완료 검증이나 부분 구현이 있으면 실패한다.

범위는 개인용 오프라인 앱의 사용자 기능이다. 원본 APK의 모듈명은 기능 조사 단서이며 소스 복원이나 산식 동일성의 증거가 아니다. 사용자 고정 지침에 따라 원본 앱과 직접 결과를 대조하지 않고 독립 엔진·공개 조견표·경계값으로 검증한다. 안내만 있는 버튼과 근거 없는 점수는 완료로 세지 않는다.
