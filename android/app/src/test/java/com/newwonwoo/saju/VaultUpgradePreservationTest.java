package com.newwonwoo.saju;

import static org.junit.Assert.*;
import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteException;
import java.io.File;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.SQLiteMode;

/** Synthetic previous-install database, created without the current helper. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28, manifest = Config.NONE)
@SQLiteMode(SQLiteMode.Mode.NATIVE)
public class VaultUpgradePreservationTest {
 @Rule public TemporaryFolder folder = new TemporaryFolder();
 private File originalDatabase(int version, String json) {
  File path = new File(folder.getRoot(), "original-install.sqlite3");
  try (SQLiteDatabase db = SQLiteDatabase.openOrCreateDatabase(path, null)) {
   db.execSQL("CREATE TABLE vault_state (id INTEGER PRIMARY KEY CHECK(id=1),json TEXT,revision INTEGER NOT NULL CHECK(revision>=0))");
   db.execSQL("INSERT INTO vault_state(id,json,revision) VALUES(1,?,41)", new Object[]{json});
   db.setVersion(version);
  }
  return path;
 }
 @Test public void previousInstallRowRemainsExactAndCanBeEditedWithoutLosingFields() throws Exception {
  Context context = RuntimeEnvironment.getApplication();
  // The native store treats the JSON as opaque; JS separately validates the full schema.
  String original = "{\"entries\":[{\"id\":\"synthetic\",\"memo\":\"한글🌙\",\"favorite\":true,\"deletedAt\":null}],\"groups\":[\"synthetic-group\"],\"photos\":[\"data:image/png;base64,AA==\"],\"drawings\":[\"synthetic-drawing\"],\"trash\":[\"synthetic-tombstone\"]}";
  File path = originalDatabase(1, original);
  try (VaultStateStore current = new VaultStateStore(context, path)) {
   assertEquals(original, current.load().json);
   assertEquals(41, current.load().revision);
   String edited = original.substring(0, original.length()-1) + ",\"newOption\":true}";
   assertEquals(42, current.save(edited, 41));
   assertEquals(edited, current.load().json);
  }
  try (VaultStateStore reopened = new VaultStateStore(context, path)) {
   assertTrue(reopened.load().json.contains("synthetic-tombstone"));
   assertEquals(42, reopened.load().revision);
  }
 }
 @Test public void unsupportedFutureSchemaFailsWithoutDeletingOriginalRow() throws Exception {
  String original = "{\"synthetic\":\"do not delete\"}";
  File path = originalDatabase(2, original);
  try (VaultStateStore current = new VaultStateStore(RuntimeEnvironment.getApplication(), path)) {
   try { current.load(); fail("Future schema must not reset data"); } catch (SQLiteException expected) { }
  }
  try (SQLiteDatabase db = SQLiteDatabase.openDatabase(path.getPath(), null, SQLiteDatabase.OPEN_READONLY);
       android.database.Cursor cursor = db.rawQuery("SELECT json,revision FROM vault_state WHERE id=1", null)) {
   assertEquals(2, db.getVersion());
   assertTrue(cursor.moveToFirst());
   assertEquals(original, cursor.getString(0));
   assertEquals(41, cursor.getInt(1));
  }
 }
}
