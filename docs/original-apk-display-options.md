# 원본 APK 명식 표시 옵션 분석

2026-10-20, 해시 검증된 8자어때 18.2.8의 Dart 3.12.0 AOT 함수·객체 풀을 분석했다. 대상은 `features/setting/domain/models/manse_view_options/`의 모델과 `application/manse_view_settings_provider.dart`다. 원본 앱 실행에서 표시 위치를 확인한 결과와 구분한다.

## 설정 필드와 초기값

Provider의 `build`(`0x7a3cd0` 부근)는 저장값이 없을 때 아래 기본 객체를 선택한다. 필드 이름은 JSON 역직렬화·직렬화 함수로, 값은 객체 풀로 교차 확인했다.

| 분류 | 저장 필드 | 저장값이 없을 때 | 기본 객체 |
|---|---|---|---|
| 십성 | `isShowJooGan` | false | `_SipsinOption@c09671` |
| 십성 | `isShowDayGan` | true | 위 객체 |
| 12운성 | `isShowDayGan` | true | `_WoonsungOption@c09641` |
| 12운성 | `isShowJooGan` | false | 위 객체 |
| 지장간 십성 | `isShowBasic` | false | `_JijangganSipsinOption@c096e1` |
| 신살 | `isShowYearJoo` | false | `_SinsalOption@c096a1` |
| 신살 | `isShowDayJoo` | false | 위 객체 |
| 납음 | `isShowBasic` | false | `_NapeumOption@c096c1` |

원본은 단순한 표시 토글 3개가 아니라 기준별로 나뉜 8개 필드를 저장한다. 특히 `JijangganSipsinOption`의 이름과 필드는 지장간의 **십성** 표시를 가리키며 지장간 글자 자체를 숨기는 옵션과 같다고 가정할 수 없다.

## Palja와 남은 차이

현재 Palja의 `appearance.tenGods`, `hiddenStems`, `growth`는 명식표의 십성 행·지장간 글자 행·12운성 행을 제어한다. 원본의 기준별 필드와 일대일 대응하지 않는다. 기존 설정 값을 임의로 원본 모델에 매핑하거나 원국·선택운 계산 기준을 변경하지 않는다.

다음 구현은 각 원본 필드가 연결되는 위젯·기준 기둥을 확인한 뒤, 기존 표시 설정과 백업을 보존하는 선택적 새 필드로 설계해야 한다. 납음·신살의 화면별 노출 범위, 주간/일간·년주/일주 기준, 프리셋과 개별 설정의 상호작용을 확인해야 한다.

이 기록은 설정 모델의 정적 근거다. 원본 화면과 동작의 전체 대조 완료로 체크하지 않는다.
