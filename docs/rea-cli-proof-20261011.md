# REA 실제 실행 검증 — 2026-10-11

## 검증 범위

- REA 패키지: `rea-agents@6.4.0` (Node 22.19, JDK 21, JADX 0.7.1)
- **Android 기능 검증:** 공개 Appium ApiDemos APK. 8자어때 APK가 아님.
- **8자어때 관련 분석:** [Google Play가 이용약관·개인정보처리방침 도메인으로 명시한](https://play.google.com/store/apps/details?id=com.mansecalendar8.mansecalendar8.lite&hl=ko) `8saju.com`의 구형 공개 웹 JavaScript. 현재 Android 앱 코드라고 단정하지 않음.

## 실행된 REA

1. [Android 공개 샘플 REA 실행](https://github.com/newwonwoo/saju/actions/runs/38138653176): `rea inspect-android-package`, `search-android-classes`, `inspect-android-class`, `inspect-android-method` 모두 성공. 공개 샘플 패키지 `io.appium.android.apis`, 클래스 2,876개, `ApiDemos.onCreate` 본문 반환.
2. [8saju.com 공개 웹 REA CLI 실행](https://github.com/newwonwoo/saju/actions/runs/38138882927): `rea analyze-javascript-application` 성공. 분석 입력 3개, 파서 오류 0개, 방문 AST 노드 548,136개, 정적 의미 그래프 노드 4,384개·관계 7,213개. 전체 자원 범위는 **부분 분석**.
3. 각 실행의 GitHub Actions Artifact에는 원본 REA JSON Evidence, CLI 로그 및 입력 SHA-256을 14일간 보관합니다.

공개 웹 REA 출력 SHA-256:
`83e5e657479cbecb4f5611771e90969e6b09099dad0755330c4303f59af2a856`

입력 SHA-256:
- `8saju.js`: `a4df8c9770dbed9d4815fabea05ccc509a94465d180200934207631e94bd9fc0`
- `data.js`: `dfdc32145ac075ff332d51650a59a1c437ef2a3d28ebc833aaabc7801da76587`
- `document.js`: `19f9dee3d829bf6bf6d1a8df5d05c92e451aab151f20648a576df79fcf8c234f`

## 소스에 근거한 사실

REA가 `8saju.js`의 저장 구조에서 다음을 확인했습니다.

- `friendItems`: `localStorage.getObject`, `setObject` (150, 189, 199, 217, 221행)
- `recentItems`: `localStorage.getObject`, `setObject` (170, 203, 213, 225, 229, 233행)
- `ananlysisMode`: `localStorage.getItem`, `setItem` (237, 243행 — 원문 오탈자 그대로)

REA가 네트워크 endpoint 후보로 표시한 6개는 실제로 `searchParams.get()` 호출입니다. 원격 서버 API 6개로 계산하지 않습니다. `data.js`의 의미 그래프는 REA 자원 예산 초과로 일부 생략되므로 전 범위 증명이 아닙니다.

## 원본 APK 단계 미실행

패키지 ID `com.mansecalendar8.mansecalendar8.lite`의 APK는 확보되지 않았습니다. APK를 확보하면 SHA-256 고정 → Manifest → 클래스 검색 → 메서드 → 참조 추적 순서로 조사하며, 현행 명식 저장·계산 차이와 미확인 사항을 구분해 기록합니다.

사용자 개인 명식, 서명키, APK는 공개 저장소에 추가하지 않았습니다. 이 브랜치는 도구 실행 검증만 담고 있으며 기존 사주 앱 명식 계산 코드는 변경하지 않았습니다.
