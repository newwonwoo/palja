#!/usr/bin/env bash
set -euo pipefail

SAJU_PROJECT_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SAJU_PROJECT_ROOT"

if [[ "${1:-}" != "--skip-web-sync" ]]; then
    npm run build:mobile
    npx cap sync android
fi

if [[ -n "${JAVA_HOME:-}" && ! -x "$JAVA_HOME/bin/javac" ]]; then
    echo "JAVA_HOME must point to JDK 21 or later." >&2
    exit 1
fi

cd android
./gradlew --no-daemon testDebugUnitTest assembleDebug
echo "APK: $SAJU_PROJECT_ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
