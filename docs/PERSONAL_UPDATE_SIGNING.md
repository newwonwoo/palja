# 개인 DB 보존형 Palja 업데이트 APK 서명 — 안전 절차

**현황:** 소스 1.1.4(versionCode 14)는 준비됐고 Android/브라우저 CI 검증도 통과. 기존 휴대폰에는 **1.1.2(versionCode 12)** 및 기기에 저장된 명식 163건 이상이 설치돼 있다. 업데이트 시 이 SQLite를 유지하는 것이 목적.

## 왜 그냥 설치할 수 없는가

같은 Android 앱 패키지 `com.newwonwoo.saju`를 덮어 설치하려면, **기존 앱과 같은 서명 개인키**가 필요하다. 패키지명과 versionCode가 같거나 높아도 서명 인증서가 다르면 Android에서 `INSTALL_FAILED_UPDATE_INCOMPATIBLE`가 발생한다. 서명된 이전 APK를 갖고 있어도 그 서명에서 개인키를 추출할 수 없다.

- 기존 1.1.2 앱의 signer SHA-256: `76b0434edf1bde06e8b82b41eb8b40d380f06cb6d989827a4ce5c6506cabcd02`.
- 일반 Debug APK는 서명이 달라 **기존 개인 앱 업데이트 불가**.
- 새로운 임의 keystore로 서명한 Release APK도 **기존 개인 앱 업데이트 불가**.
- **현재까지 원래 keystore를 확보하지 못함.** 이 문서/스크립트만으로 업데이트가 완료된 것이 아니다.
- 개인 명식은 공개 GitHub에 올리지 않으며, 기존 앱을 삭제하거나 앱 데이터 지우기를 수행하면 안 된다.

## 원래 서명키가 있을 때

1. 기존 개인 앱에서 **설정과 백업 → 백업 내보내기**로 JSON 백업을 별도 보관한다. 기존 앱 삭제 금지.
2. `palja/main`에서 GitHub Actions → **Build unsigned Palja release for ORIGINAL personal signer** → **Run workflow**. artifact `palja-1.1.4-release-UNSIGNED-NEEDS-ORIGINAL-KEY` 다운로드. **이 파일은 설치 파일이 아니다.**
3. **비공개 로컬 PC**에서 Android SDK Build Tools(`apksigner`, `aapt`, `zipalign`)와 JDK `keytool`을 설치한다. Github 저장소 안이 아닌 비공개 폴더에 실제 원본 `*.jks` 또는 `*.p12` 키스토어와 기존 1.1.2 APK를 둔다.
4. 환경변수 `PALJA_KEY_ALIAS`, `PALJA_KS_PASS`, `PALJA_KEY_PASS`를 설정하고 다음 명령을 실행한다(비밀번호를 명령에 직접 적지 않음).

   ```sh
   bash scripts/sign-personal-update.sh \
     /private/saju_vault_1.1.2_personal_update.apk \
     /private/app-release-unsigned.apk \
     /private/original-signing-key.jks \
     /private/Palja_1.1.4_Update_Existing.apk
   ```

5. 스크립트는 **기존 APK signer / keystore signer / 새 APK signer SHA-256 모두 일치**, 패키지 `com.newwonwoo.saju` 동일, versionCode **12→14** 증가, 서명 v1/v2/v3 및 정렬 검증에 **모두 통과한 경우에만 출력한다**. 키가 다르면 절대 출력하지 않는다.
6. 원본 설치 앱이 있는 실제 기기에서 APK를 덮어 설치하고, 기존 163건·즐겨찾기·메모·SQLite가 그대로 유지됐는지 확인한다. 그다음 새 `양력(기본)` 표기, 사주 엔진 연·월·일·시주, X 버튼 종료, 재실행 지속성을 확인한다.

### 키가 없는 경우

**기존 설치 앱 데이터를 유지하는 즉시 업데이트 APK는 제작할 수 없다.** Android 서명 규칙을 회피하지 않는다. 개인 키를 **GitHub 공개 repo/CI에 올리거나 사용자에게 키 비밀번호를 채팅으로 적도록 요구하지 않는다.** 사용자가 기존 키스토어를 제공하는 경우 별도 안전한 비공개 작업 환경에서만 서명한다.

키를 영구적으로 찾을 수 없다면, 사용자 동의 및 백업 확인 뒤에만 **별도 서명 새 앱 설치 + JSON 데이터 이식** 계획을 세운다. 이 방식은 기존 앱의 제자리 업데이트와 다르다.

## 개발자가 지켜야 할 것

- `docs/PALJA_HANDOFF.md`와 `docs/full-feature-scope.md` 참고.
- 기존 개인 DB의 변경/삭제를 수행하는 자동 업그레이드 코드를 만들지 않는다.
- `public/private/initial-vault.json` 등 개인 DB가 GitHub Actions에 포함되면 빌드를 중단한다.
- 공개 빌드 APK를 "업데이트용"이라고 잘못 라벨링하지 않는다.
- 향후 키를 찾으면 키스토어를 사용자가 보유한 안전한 장소에 백업하고, 서명 인증서 지문만 repo의 문서에 유지한다.
