package com.newwonwoo.saju;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteDatabaseCorruptException;
import android.database.sqlite.SQLiteException;
import android.database.sqlite.SQLiteOpenHelper;
import android.database.sqlite.SQLiteStatement;
import java.io.ByteArrayOutputStream;
import java.io.File;

/** One private state row. All revision changes are compare-and-swap transactions. */
final class VaultStateStore implements AutoCloseable {
    static final int READ_CHUNK_BYTES = 64 * 1024;
    private final Helper helper;

    static final class State {
        final String json;
        final int revision;
        State(String json, int revision) { this.json = json; this.revision = revision; }
    }

    VaultStateStore(Context context) {
        this(context, new File(context.getNoBackupFilesDir(), "saju-vault.sqlite3"));
    }

    VaultStateStore(Context context, File databaseFile) {
        helper = new Helper(context.getApplicationContext(), databaseFile.getAbsolutePath());
    }

    synchronized State load() throws VaultException {
        SQLiteDatabase db = helper.getWritableDatabase();
        db.beginTransaction();
        try {
            int revision;
            int byteLength;
            boolean isNull;
            // Never SELECT the entire JSON TEXT: Android CursorWindow has a small row limit.
            try (Cursor cursor = db.rawQuery("SELECT revision,json IS NULL,length(CAST(json AS BLOB)) FROM vault_state WHERE id=1", null)) {
                if (!cursor.moveToFirst()) throw corrupt();
                revision = cursor.getInt(0);
                isNull = cursor.getInt(1) == 1;
                byteLength = isNull ? 0 : cursor.getInt(2);
            }
            if (revision < 0 || byteLength < 0 || byteLength > VaultPayload.MAX_BYTES) throw corrupt();
            String json = null;
            if (!isNull) {
                ByteArrayOutputStream bytes = new ByteArrayOutputStream(byteLength);
                for (int offset = 1; offset <= byteLength; offset += READ_CHUNK_BYTES) {
                    int expectedLength = Math.min(READ_CHUNK_BYTES, byteLength - offset + 1);
                    try (Cursor cursor = db.rawQuery(
                        "SELECT substr(CAST(json AS BLOB),?,?) FROM vault_state WHERE id=1",
                        new String[] { Integer.toString(offset), Integer.toString(expectedLength) }
                    )) {
                        if (!cursor.moveToFirst()) throw corrupt();
                        byte[] chunk = cursor.getBlob(0);
                        if (chunk == null || chunk.length != expectedLength) throw corrupt();
                        bytes.write(chunk, 0, chunk.length);
                    }
                }
                // Decode only after assembling all bytes; UTF-8 characters may cross chunk edges.
                try {
                    json = VaultPayload.decodeUtf8(bytes.toByteArray());
                    VaultPayload.validateObject(json);
                } catch (VaultException error) {
                    throw corrupt();
                }
            } else if (revision != 0) {
                throw corrupt();
            }
            db.setTransactionSuccessful();
            return new State(json, revision);
        } finally {
            db.endTransaction();
        }
    }

    synchronized int save(String json, int expectedRevision) throws VaultException {
        if (expectedRevision < 0 || expectedRevision == Integer.MAX_VALUE) {
            throw new VaultException("INVALID_REVISION", "저장 버전이 올바르지 않습니다.");
        }
        VaultPayload.checkedBytes(json);
        int nextRevision = expectedRevision + 1;
        SQLiteDatabase db = helper.getWritableDatabase();
        db.beginTransaction();
        try (SQLiteStatement statement = db.compileStatement(
            "UPDATE vault_state SET json=?,revision=? WHERE id=1 AND revision=?"
        )) {
            statement.bindString(1, json);
            statement.bindLong(2, nextRevision);
            statement.bindLong(3, expectedRevision);
            if (statement.executeUpdateDelete() != 1) {
                int current;
                try (Cursor cursor = db.rawQuery("SELECT revision FROM vault_state WHERE id=1", null)) {
                    if (!cursor.moveToFirst()) throw corrupt();
                    current = cursor.getInt(0);
                }
                throw new VaultException("REVISION_CONFLICT", "다른 변경 내용이 먼저 저장되었습니다. 최신 내용을 불러와 주세요.", current);
            }
            db.setTransactionSuccessful();
            return nextRevision;
        } finally {
            db.endTransaction();
        }
    }

    private static VaultException corrupt() {
        return new VaultException("STORAGE_CORRUPT", "저장 데이터를 읽을 수 없습니다. 기존 데이터를 유지한 상태에서 백업 파일을 확인해 주세요.");
    }

    @Override public synchronized void close() { helper.close(); }

    private static final class Helper extends SQLiteOpenHelper {
        Helper(Context context, String path) {
            super(context, path, null, 1, database -> {
                // Android's default handler deletes corrupt databases and silently recreates
                // them. Personal records must remain available for recovery instead.
                throw new SQLiteDatabaseCorruptException("Vault database is corrupt; original files were preserved");
            });
        }

        @Override public void onConfigure(SQLiteDatabase db) {
            db.execSQL("PRAGMA synchronous=FULL");
        }

        @Override public void onCreate(SQLiteDatabase db) {
            db.execSQL("CREATE TABLE vault_state (id INTEGER PRIMARY KEY CHECK(id=1),json TEXT,revision INTEGER NOT NULL CHECK(revision>=0))");
            db.execSQL("INSERT INTO vault_state(id,json,revision) VALUES(1,NULL,0)");
        }

        @Override public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
            throw new SQLiteException("Unsupported vault database version; no data was deleted");
        }

        @Override public void onDowngrade(SQLiteDatabase db, int oldVersion, int newVersion) {
            throw new SQLiteException("Vault database downgrade is not supported; no data was deleted");
        }
    }
}
