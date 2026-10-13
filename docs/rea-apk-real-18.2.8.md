# 8자어때 18.2.8 원본 APK — REA 실제 분석 확인

분석일: 2026-10-12 KST. 이 문서는 공개 저장소에 개인 자료를 남기지 않기 위한 **요약**이다. 자세한 증거 JSON/원본 APK는 사용자에게만 전달하며 GitHub에는 업로드하지 않았다.

## 입력 무결성

- Google Drive로 사용자가 제공한 분할 설치 파일: `8자어때-18.2.8-split-apks.zip`, 100,896,783바이트. SHA-256 `8b2977069ae037dfb960f13d67cc423dab484f767d1938a1071e0a63148f1b1c`.
- 내부 `base.apk`, `split_config.arm64_v8a.apk`, `split_config.ko.apk`, `split_config.xxhdpi.apk`, `manifest.json`. ZIP CRC 오류 없음.
- base.apk SHA-256 `39df6df7b492c272a82dd8b59388369c4b1b7a1840da8dbd9c6a64588a6fda09`.
- Flutter `libapp.so` SHA-256 `a5e4c25d119466c2c46b870509c5b1f59395b59b034b73ffa3e6658a6e4b1d9d`.

## 실제 실행 검증

REA `rea-agents@6.4.0`, Node 22.19.0, OpenJDK 21, JADX MCP 0.7.1을 설치하여 **해당 base.apk를 로컬에서 직접 분석**했다. 도구만 [GitHub Actions](https://github.com/newwonwoo/saju/actions/runs/38149930188)로 준비했고, APK는 GitHub로 전송하지 않았다.

| 명령 | 실제 결과 |
| --- | --- |
| `rea inspect-android-package base.apk --json` | 성공. package `com.mansecalendar8.mansecalendar8.lite`, version 18.2.8/code 2026062801, minSdk 24, targetSdk 36, class 16,732개, APK 내부 엔트리 1,962개, Manifest 복호화 |
| `rea search-android-classes base.apk MainActivity --json` | 성공, `com.mansecalendar8.mansecalendar8.lite.MainActivity` 1개 |
| `rea inspect-android-class base.apk ...MainActivity --json` | 성공, 메서드 목록에는 생성자만 표시됨 |
| `rea inspect-android-method base.apk ...MainActivity onCreate --json` | **해당 메서드 없음**으로 오류. 실패를 성공으로 표기하지 않음 |
| `rea trace-android-references base.apk ...MainActivity --json` | 성공, 정적 유입 참조 보고 0개 |
| `rea inspect-artifact libapp.so --format json` | 성공, ELF 및 SHA 증거 |
| `rea inspect-artifact split-apks.zip --format json` | 성공, 설치 아카이브와 APK 4개 경계·해시 증거 |

## 발견한 구조

- 현재 Android 앱은 **Flutter**, 핵심 Dart AOT 코드는 `libapp.so`(ARM64)에 존재한다. REA의 JADX 분석은 Android DEX/Manifest만 디컴파일하며 Dart AOT 본문을 자동으로 재구성하지 않는다.
- 네이티브 바이너리 문자열 검사 결과, `package:how8ja/`가 붙은 Dart 모듈 경로 **1,015개**를 확인했으며 이 목록은 소스 본문 복원이 아님.
- 친구·검색: `features/profile/friend/data/friends_repository.dart`, `features/profile_list/application/friends/services/friend_filtering_service.dart`, `friends_sorting_service.dart`.
- 분류·최근: `features/profile/friend_group/data/friend_group_repository.dart`, `features/profile/recent/data/recents_repository.dart`.
- 사주: `core/domains/manse/calculator/saju_calculator.dart`, `dea_joo_calculator.dart`, `luck_joo_calculator.dart`, `solar_term_converter/kasi_base/solar_term_time_data.dart`.
- 보정: `rules/get_equation_of_time_minute.dart`, `rules/get_real_birth_datetime.dart`, `rules/check_yaja_joja_case.dart`, `calculator/summer_time_calculator.dart`, `rules/check_origin_korea_timezone.dart`.
- `sqflite`, SharedPreferences, Cloud Firestore 관련 코드가 공존한다. **친구 명식의 실제 저장 장소를 이 정적 증거로 확정할 수는 없다**.
- 설치 패키지는 기존 사용자 친구 명식 DB의 백업이 아니다. 데이터 이전에는 앱 내보내기나 별도의 백업이 필요하다.

## 기존 개인용 오프라인 앱에서 우선 개선할 사항

1. 보관함: 현재 이름·생년월일·메모 검색 / 가나다·최근추가 정렬에 **일주·나이 검색, 명식 그룹, 추가 정렬**을 먼저 구현. 이미지로 제공된 8자어때 화면과 대조한다.
2. 계산: 현재 앱이 보정하지 않은 **역사적 한국 표준시, 서머타임, 경도, 균시차, 절입 시각, 야자시/조자시, 연주·대운 계산 옵션**을 별도 모델과 명시적 설정으로 확장한다.
3. 산식 동일성은 네이티브 Dart 모듈 이름만으로 보증하지 않으며, 실제 앱 결과와 독립적인 양력·음력/윤달·절기 경계 기준값을 비교한다.
4. 기존 개인 기록·서명·오프라인 보존을 우선하고, 기존 기능 성공 입력은 회귀하지 않게 테스트한다.

이 보고서는 **정적 증거**이며 실기기 동작·서버 동기화·정확한 산식 복구까지 완료되었다는 뜻은 아니다.
