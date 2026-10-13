package com.newwonwoo.saju;

import android.app.Activity;
import android.content.Intent;
import android.database.sqlite.SQLiteDatabaseCorruptException;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONObject;

@CapacitorPlugin(name = "SajuVault")
public final class SajuVaultPlugin extends Plugin {
    private VaultStateStore store;
    private ExecutorService io;
    private File exportDirectory;
    private final AtomicBoolean documentBusy = new AtomicBoolean(false);

    @Override public void load() {
        store = new VaultStateStore(getContext().getApplicationContext());
        exportDirectory = new File(getContext().getNoBackupFilesDir(), "pending-backups");
        io = Executors.newSingleThreadExecutor(runnable -> new Thread(runnable, "SajuVaultIO"));
        // An interrupted file-picker operation cannot affect the saved SQLite state.
        io.execute(() -> {
            File[] files = exportDirectory.listFiles();
            if (files == null) return;
            long staleBefore = System.currentTimeMillis() - 24L * 60 * 60 * 1000;
            for (File file : files) {
                if ((file.getName().startsWith("pending-export-") || file.getName().startsWith("pending-image-")) && file.lastModified() < staleBefore) file.delete();
            }
        });
    }

    @PluginMethod public void loadState(PluginCall call) {
        runIo(call, () -> {
            VaultStateStore.State state = store.load();
            JSObject result = new JSObject();
            result.put("json", state.json == null ? JSONObject.NULL : state.json);
            result.put("revision", state.revision);
            call.resolve(result);
        });
    }

    @PluginMethod public void saveState(PluginCall call) {
        Integer expected = call.getInt("expectedRevision");
        if (expected == null) {
            call.reject("정수 expectedRevision이 필요합니다.", "INVALID_REVISION");
            return;
        }
        String json = call.getString("json");
        runIo(call, () -> {
            JSObject result = new JSObject();
            result.put("revision", store.save(json, expected));
            call.resolve(result);
        });
    }

    @PluginMethod public void exportBackup(PluginCall call) {
        if (!documentBusy.compareAndSet(false, true)) {
            call.reject("열려 있는 파일 선택을 먼저 마쳐 주세요.", "DOCUMENT_BUSY");
            return;
        }
        runIo(call, () -> {
            File pending = null;
            try {
                byte[] bytes = VaultPayload.checkedBytes(call.getString("json"));
                String filename = VaultPayload.safeFilename(call.getString("filename"));
                if (!exportDirectory.isDirectory() && !exportDirectory.mkdirs()) throw new IOException("Private directory unavailable");
                pending = File.createTempFile("pending-export-", ".json", exportDirectory);
                try (FileOutputStream output = new FileOutputStream(pending)) {
                    output.write(bytes);
                    output.getFD().sync();
                }
                // Capacitor saves activity-call arguments in a Bundle. Keep the 8MiB payload out
                // of that Bundle to avoid TransactionTooLargeException during the system picker.
                call.getData().remove("json");
                call.getData().put("_exportToken", pending.getName());
                call.getData().put("filename", filename);
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE, filename);
                intent.putExtra(Intent.EXTRA_LOCAL_ONLY, true);
                launchDocumentPicker(call, intent, "backupCreated", pending);
            } catch (Exception error) {
                if (pending != null) pending.delete();
                documentBusy.set(false);
                throw error;
            }
        });
    }

    @PluginMethod public void exportImage(PluginCall call) {
        if (!documentBusy.compareAndSet(false, true)) {
            call.reject("열려 있는 파일 선택을 먼저 마쳐 주세요.", "DOCUMENT_BUSY");
            return;
        }
        runIo(call, () -> {
            File pending = null;
            try {
                byte[] png = PngPayload.checkedBytes(call.getString("base64"));
                String filename = PngPayload.safeFilename(call.getString("filename"));
                if (!exportDirectory.isDirectory() && !exportDirectory.mkdirs()) throw new IOException("Private directory unavailable");
                pending = File.createTempFile("pending-image-", ".png", exportDirectory);
                try (FileOutputStream output = new FileOutputStream(pending)) {
                    output.write(png);
                    output.getFD().sync();
                }
                // Never place multi-megabyte base64 in the Activity saved-state Bundle.
                call.getData().remove("base64");
                call.getData().put("_imageToken", pending.getName());
                call.getData().put("filename", filename);
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("image/png");
                intent.putExtra(Intent.EXTRA_TITLE, filename);
                intent.putExtra(Intent.EXTRA_LOCAL_ONLY, true);
                launchDocumentPicker(call, intent, "imageCreated", pending);
            } catch (Exception error) {
                if (pending != null) pending.delete();
                documentBusy.set(false);
                throw error;
            }
        });
    }

    @ActivityCallback private void imageCreated(PluginCall call, ActivityResult activityResult) {
        if (call == null) { documentBusy.set(false); return; }
        runIo(call, () -> {
            File pending = null;
            try {
                String token = call.getString("_imageToken");
                if (token == null || !token.matches("pending-image-[a-zA-Z0-9_-]+\\.png"))
                    throw new VaultException("BACKUP_INTERRUPTED", "이미지 내보내기가 중단되었습니다.");
                pending = new File(exportDirectory, token);
                if (!pending.isFile() || pending.length() > PngPayload.MAX_BYTES)
                    throw new VaultException("INVALID_IMAGE", "내보낼 이미지 파일이 없거나 크기가 너무 큽니다.");
                Uri uri = selectedUri(activityResult);
                try (InputStream input = new FileInputStream(pending);
                     OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                    if (output == null) throw new IOException("Document output unavailable");
                    byte[] bytes = new byte[64 * 1024]; int n;
                    while ((n = input.read(bytes)) != -1) output.write(bytes, 0, n);
                    output.flush();
                }
                JSObject result = new JSObject(); result.put("saved", true);
                result.put("filename", call.getString("filename", "saju-chart.png"));
                call.resolve(result);
            } finally {
                if (pending != null) pending.delete();
                documentBusy.set(false);
            }
        });
    }

    @PluginMethod public void importBackup(PluginCall call) {
        if (!documentBusy.compareAndSet(false, true)) {
            call.reject("열려 있는 파일 선택을 먼저 마쳐 주세요.", "DOCUMENT_BUSY");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] { "application/json", "text/plain", "application/octet-stream" });
        intent.putExtra(Intent.EXTRA_LOCAL_ONLY, true);
        launchDocumentPicker(call, intent, "backupOpened", null);
    }

    private void launchDocumentPicker(PluginCall call, Intent intent, String callback, File pending) {
        getActivity().runOnUiThread(() -> {
            try {
                startActivityForResult(call, intent, callback);
            } catch (RuntimeException error) {
                if (pending != null) pending.delete();
                documentBusy.set(false);
                call.reject("이 기기에서 파일 선택 화면을 열 수 없습니다.", "DOCUMENT_PICKER_UNAVAILABLE");
            }
        });
    }

    @ActivityCallback private void backupCreated(PluginCall call, ActivityResult activityResult) {
        if (call == null) { documentBusy.set(false); return; }
        runIo(call, () -> {
            File pending = null;
            try {
                pending = pendingFile(call);
                Uri uri = selectedUri(activityResult);
                try (InputStream input = new FileInputStream(pending)) {
                    byte[] bytes = VaultPayload.readLimited(input);
                    try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                        if (output == null) throw new IOException("Document output unavailable");
                        output.write(bytes);
                        output.flush();
                    }
                }
                JSObject result = new JSObject();
                result.put("saved", true);
                result.put("filename", call.getString("filename", "saju-vault-backup.json"));
                call.resolve(result);
            } finally {
                if (pending != null) pending.delete();
                documentBusy.set(false);
            }
        });
    }

    @ActivityCallback private void backupOpened(PluginCall call, ActivityResult activityResult) {
        if (call == null) { documentBusy.set(false); return; }
        runIo(call, () -> {
            try {
                Uri uri = selectedUri(activityResult);
                String json;
                try (InputStream input = getContext().getContentResolver().openInputStream(uri)) {
                    json = VaultPayload.decodeUtf8(VaultPayload.readLimited(input));
                }
                VaultPayload.checkedBytes(json);
                JSObject result = new JSObject();
                result.put("json", json);
                // Parsing a file never mutates SQLite. The UI previews it, then calls saveState.
                call.resolve(result);
            } finally {
                documentBusy.set(false);
            }
        });
    }

    private File pendingFile(PluginCall call) throws VaultException {
        String token = call.getString("_exportToken");
        if (token == null || !token.matches("pending-export-[a-zA-Z0-9_-]+\\.json")) {
            throw new VaultException("BACKUP_INTERRUPTED", "내보내기가 중단되었습니다. 다시 시도해 주세요.");
        }
        File file = new File(exportDirectory, token);
        if (!file.isFile()) throw new VaultException("BACKUP_INTERRUPTED", "내보내기 대기 파일이 없습니다. 다시 시도해 주세요.");
        return file;
    }

    private static Uri selectedUri(ActivityResult result) throws VaultException {
        if (result.getResultCode() != Activity.RESULT_OK) throw new VaultException("USER_CANCELLED", "파일 선택을 취소했습니다.");
        Intent data = result.getData();
        Uri uri = data == null ? null : data.getData();
        if (uri == null || !"content".equalsIgnoreCase(uri.getScheme())) {
            throw new VaultException("INVALID_DOCUMENT", "선택한 파일을 열 수 없습니다.");
        }
        return uri;
    }

    private interface IoTask { void run() throws Exception; }

    private void runIo(PluginCall call, IoTask task) {
        try {
            io.execute(() -> {
                try {
                    task.run();
                } catch (VaultException error) {
                    if (error.actualRevision != null) {
                        JSObject data = new JSObject();
                        data.put("actualRevision", error.actualRevision);
                        call.reject(error.getMessage(), error.code, data);
                    } else {
                        call.reject(error.getMessage(), error.code);
                    }
                } catch (SQLiteDatabaseCorruptException error) {
                    call.reject("저장소 손상이 감지되었습니다. 원본 파일은 유지했습니다. 백업 파일을 확인해 주세요.", "STORAGE_CORRUPT");
                } catch (Exception error) {
                    // Do not put personal JSON, SQL bindings, or document paths in logs/errors.
                    call.reject("기기 저장소 작업을 마치지 못했습니다. 기존 저장 내용은 유지됩니다.", "STORAGE_ERROR");
                }
            });
        } catch (RejectedExecutionException error) {
            documentBusy.set(false);
            call.reject("앱을 다시 열고 시도해 주세요.", "STORAGE_CLOSED");
        }
    }

    @Override protected void handleOnDestroy() {
        if (io != null && !io.isShutdown()) {
            io.execute(() -> store.close());
            io.shutdown();
        }
    }
}
