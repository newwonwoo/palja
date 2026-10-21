# 작업 완료 시 공정률 보고

사용자의 고정 요청: 작업을 마칠 때마다 공정률을 반드시 보고한다.

- `npm run progress`의 출력에 근거해 코드 구현 완료 수/전체와 백분율을 보고한다.
- 7개 검증 항목을 모두 통과한 기능 수/전체와 백분율을 별도로 보고한다.
- 직전 보고와 비교한 증감, 이번에 완료한 작업, 남은 작업을 함께 설명한다.
- 코드 구현률을 전체 검증률이나 배포 완료율로 표현하지 않는다. 실기기 검증 대기는 자동 테스트 통과와 구분한다.
- 상태의 근거는 `docs/full-feature-scope.json`, `docs/implementation-progress.json`, `docs/IMPLEMENTATION_CHECKLIST.md`로 관리한다.
