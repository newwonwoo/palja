# 사주 보관함 Android

Capacitor 8.5.3 native shell, app ID `com.newwonwoo.saju`. Bundled web assets use
`https://localhost` internally; they are served by Capacitor from the APK, without
an HTTP server or Internet permission.

## Build

Install JDK 21, Android SDK platform 36 and build-tools 36.0.0. Set `JAVA_HOME` and
`ANDROID_HOME` (or Android Studio's local `sdk.dir`), then run from the repository:

```sh
./scripts/android-build.sh
# After a separately completed web build and Capacitor sync:
./scripts/android-build.sh --skip-web-sync
```

On Windows, use `./scripts/android-build.ps1` with an optional `-SkipWebSync`.
The Gradle wrapper downloads the pinned official Gradle distribution.

Output: `android/app/build/outputs/apk/debug/app-debug.apk`. A debug APK is for
personal installation and testing. Existing app data survives a normal update
using the same application ID and signing key; uninstalling deletes app data.

## JavaScript contract

Register `SajuVault` with Capacitor's `registerPlugin`:

| Method | Arguments | Result |
| --- | --- | --- |
| `loadState` | none | `{ json: string \| null, revision: number }` |
| `saveState` | `{ json, expectedRevision }` | `{ revision: expectedRevision + 1 }` |
| `exportBackup` | `{ json, filename }` | `{ saved: true, filename }` |
| `importBackup` | none | `{ json }` |

New storage starts with `json = null` and revision `0`. `saveState` changes the
single SQLite row only if the persisted revision equals `expectedRevision`.
Failure returns `REVISION_CONFLICT` with `data.actualRevision`, without replacing
the current data. Other error codes include `INVALID_JSON`, `PAYLOAD_TOO_LARGE`,
`INVALID_REVISION`, `STORAGE_CORRUPT`, `STORAGE_ERROR`, `USER_CANCELLED`,
`DOCUMENT_BUSY`, `BACKUP_INTERRUPTED`, `INVALID_DOCUMENT`, and
`DOCUMENT_PICKER_UNAVAILABLE`.

JSON must be a UTF-8 object of at most 8 MiB. Duplicate fields and malformed UTF-8
are rejected. A UTF-8 BOM on an imported file is accepted. Structural application
schema validation and backup preview remain the responsibility of the web UI.

## Persistence and offline behavior

- SQLite is in the app's private `noBackupFilesDir`. Android automatic backup is
  disabled; backups are made explicitly through the system document picker.
- SQLite writes use a compare-and-swap transaction with `synchronous=FULL`.
  A custom corruption handler stops with an error while preserving the original
  database files; Android's destructive default recovery is disabled.
- Reads retrieve the revision and UTF-8 byte count, then 64 KiB BLOB slices in one
  transaction. An 8 MiB state never occupies one CursorWindow row, and Korean or
  emoji characters split between chunks are decoded only after reassembly.
- Export uses a private temporary file while the system picker is open. The
  activity-state Bundle contains only a short token, avoiding Android's Binder
  size limit. Success and cancellation remove that temporary file; interrupted
  exports older than a day are cleaned up at the next plugin load.
- Import only reads a user-selected file. It does not alter SQLite until the UI
  validates/previews the data and calls `saveState`.
- Both document intents request local files. No broad storage permission,
  network permission, external file provider, remote page navigation, or remote
  asset loading is enabled.
- Capacitor logging and WebView debugging are disabled, including in the
  personal debug APK, so plugin arguments are not written to Capacitor logs.
- Private seed data can be included in a personal APK through ignored local
  assets. Keep those files and resulting personal APKs out of the public source
  repository.

## Verification scope

`testDebugUnitTest` runs Robolectric's native SQLite backend to check reopen
persistence, competing revisions, simultaneous writers, multi-megabyte Korean/
emoji content, the exact 8 MiB boundary, and rejected malformed/oversized input.
The URL policy, strict JSON grammar, UTF-8 file handling, and preservation of a
physically corrupt database file have focused unit coverage.

These JVM tests and an APK build do not exercise a physical Android device.
Before relying on real records, verify on the target phone: create/edit a record,
close and reopen the app, export a backup, cancel a picker, import the exported
file, and confirm airplane-mode operation.

## Primary references

- [Capacitor Android plugins](https://capacitorjs.com/docs/plugins/android)
- [Capacitor 8 Android requirements](https://capacitorjs.com/docs/updating/8-0)
- [Android document picker](https://developer.android.com/training/data-storage/shared/documents-files)
- [Android SQLiteOpenHelper](https://developer.android.com/reference/android/database/sqlite/SQLiteOpenHelper)
- [Robolectric setup](https://robolectric.org/getting-started/)
