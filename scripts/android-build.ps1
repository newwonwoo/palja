param([switch]$SkipWebSync)
$ErrorActionPreference = 'Stop'
$SajuProjectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $SajuProjectRoot
try {
    if (-not $SkipWebSync) {
        & npm.cmd run build:mobile
        if ($LASTEXITCODE -ne 0) { throw 'Mobile web build failed.' }
        & npx.cmd cap sync android
        if ($LASTEXITCODE -ne 0) { throw 'Capacitor sync failed.' }
    }
    Push-Location (Join-Path $SajuProjectRoot 'android')
    try {
        & .\gradlew.bat --no-daemon testDebugUnitTest assembleDebug
        if ($LASTEXITCODE -ne 0) { throw 'Android verification/build failed.' }
    } finally { Pop-Location }
    Write-Output "APK: $SajuProjectRoot\android\app\build\outputs\apk\debug\app-debug.apk"
} finally { Pop-Location }
