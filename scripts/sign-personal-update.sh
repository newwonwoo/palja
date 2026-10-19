#!/usr/bin/env bash
# Build the ONLY valid in-place Palja update: original signer, same package ID,
# strictly newer Android versionCode. No private key or user database in GitHub.
set -euo pipefail
umask 077
export LC_ALL=C

usage() {
  cat >&2 <<'HELP'
Usage:
  PALJA_KEY_ALIAS=... PALJA_KS_PASS=... PALJA_KEY_PASS=... \
    bash scripts/sign-personal-update.sh ORIGINAL_INSTALLED.apk app-release-unsigned.apk /private/key.jks Palja-UPDATE.apk

Required:
  ORIGINAL_INSTALLED.apk   Previously installed personal 1.1.2 APK (signer reference)
  app-release-unsigned.apk Unsigned release APK from current palja Android Gradle build
  /private/key.jks         Original signing key store; never put it in GitHub
  Palja-UPDATE.apk         Verified output destination

Password values are passed only by environment, not command-line arguments.
The script deliberately refuses any keystore that does not match the existing APK.
Do not delete the installed app or its database.
HELP
}

fail(){ echo "REJECTED: $*" >&2; exit 1; }
[[ $# == 4 ]] || { usage; exit 2; }
original=$1
unsigned=$2
keystore=$3
output=$4
[[ -f "$original" && -f "$unsigned" && -f "$keystore" ]] || fail "original APK, unsigned release APK and original keystore must all exist"
[[ "$original" != "$unsigned" && "$original" != "$output" && "$unsigned" != "$output" ]] || fail "input and output files must differ"
[[ -n "${PALJA_KEY_ALIAS:-}" && -n "${PALJA_KS_PASS:-}" && -n "${PALJA_KEY_PASS:-}" ]] || fail "PALJA_KEY_ALIAS, PALJA_KS_PASS and PALJA_KEY_PASS are required"
[[ ! -e "$output" ]] || fail "output already exists; will not overwrite"

# Accept either SDK executables on PATH or installed in ANDROID_HOME/build-tools.
find_sdk_tool() {
  local tool=$1
  if command -v "$tool" >/dev/null 2>&1; then command -v "$tool"; return; fi
  local sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
  if [[ -n "$sdk" && -d "$sdk/build-tools" ]]; then
    local candidate
    candidate=$(find "$sdk/build-tools" -mindepth 2 -maxdepth 2 -type f -name "$tool" | sort -V | tail -n 1)
    if [[ -n "$candidate" ]]; then echo "$candidate"; return; fi
  fi
  fail "Android SDK tool '$tool' not found (set ANDROID_HOME)"
}
apksigner=$(find_sdk_tool apksigner)
aapt=$(find_sdk_tool aapt)
zipalign=$(find_sdk_tool zipalign)
command -v keytool >/dev/null 2>&1 || fail "Java keytool is required"

# Installed build reference MUST have exactly our original release certificate.
expected='76b0434edf1bde06e8b82b41eb8b40d380f06cb6d989827a4ce5c6506cabcd02'
fingerprint_from_apk(){
  "$apksigner" verify --print-certs "$1" |
    sed -nE 's/.*Signer #1 certificate SHA-256 digest: ([0-9a-fA-F:]+).*/\1/p' |
    head -n1 | tr -d ':' | tr '[:upper:]' '[:lower:]'
}
fingerprint_from_keystore(){
  keytool -list -v -keystore "$keystore" -alias "$PALJA_KEY_ALIAS" -storepass:env PALJA_KS_PASS |
    sed -nE 's/^[[:space:]]*SHA256:[[:space:]]*([0-9a-fA-F:]+).*$/\1/p' |
    head -n1 | tr -d ':' | tr '[:upper:]' '[:lower:]'
}
installed_fingerprint=$(fingerprint_from_apk "$original")
[[ "$installed_fingerprint" == "$expected" ]] || fail "original APK is not the recognized personal release: $installed_fingerprint"
key_fingerprint=$(fingerprint_from_keystore)
[[ "$key_fingerprint" == "$expected" ]] || fail "keystore signer does NOT match installed personal APK; no update possible with this key"

get_badging(){ "$aapt" dump badging "$1" | sed -n '1p'; }
installed_info=$(get_badging "$original")
unsigned_info=$(get_badging "$unsigned")
extract(){
  sed -nE "s/.*[[:space:]]$2='([^']+)'.*/\\1/p" <<< "$1"
}
installed_package=$(extract "$installed_info" name)
unsigned_package=$(extract "$unsigned_info" name)
installed_version=$(extract "$installed_info" versionCode)
unsigned_version=$(extract "$unsigned_info" versionCode)
[[ "$installed_package" == 'com.newwonwoo.saju' && "$unsigned_package" == 'com.newwonwoo.saju' ]] || fail "package ID mismatch"
[[ "$installed_version" =~ ^[0-9]+$ && "$unsigned_version" =~ ^[0-9]+$ ]] || fail "bad Android version codes"
(( 10#$unsigned_version > 10#$installed_version )) || fail "new APK versionCode must be strictly larger (old $installed_version, new $unsigned_version)"
# A debug APK is already signed and would accidentally preserve the wrong signer.
if "$apksigner" verify "$unsigned" >/dev/null 2>&1; then fail "input must be UNSIGNED release APK, not a signed debug or personal APK"; fi
case "$(basename "$unsigned")" in
  *unsigned*.apk) ;;
  *) fail "input filename must contain 'unsigned' (Gradle release build)" ;;
esac

tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT
"$zipalign" -f 4 "$unsigned" "$tmpdir/aligned.apk" >/dev/null
"$apksigner" sign --ks "$keystore" --ks-key-alias "$PALJA_KEY_ALIAS" \
  --ks-pass env:PALJA_KS_PASS --key-pass env:PALJA_KEY_PASS \
  --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true \
  --out "$tmpdir/signed.apk" "$tmpdir/aligned.apk"
"$apksigner" verify --verbose --print-certs "$tmpdir/signed.apk" >/dev/null || fail "signed APK verification failed"
[[ "$(fingerprint_from_apk "$tmpdir/signed.apk")" == "$expected" ]] || fail "output signer mismatch"
signed_info=$(get_badging "$tmpdir/signed.apk")
[[ "$(extract "$signed_info" name)" == "$installed_package" ]] || fail "output package mismatch"
[[ "$(extract "$signed_info" versionCode)" == "$unsigned_version" ]] || fail "output version changed"
"$zipalign" -c 4 "$tmpdir/signed.apk" >/dev/null || fail "output zip alignment failed"
mkdir -p "$(dirname "$output")"
cp "$tmpdir/signed.apk" "$output"
chmod 600 "$output"
echo "VERIFIED update APK: $output"
echo "Same package, SAME original signer, versionCode $installed_version -> $unsigned_version."
echo "Existing app & private SQLite preserved by Android's in-place update semantics."
sha256sum "$output"
