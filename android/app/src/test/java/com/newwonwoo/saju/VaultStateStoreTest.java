package com.newwonwoo.saju;

import static org.junit.Assert.*;

import android.content.Context;
import android.database.sqlite.SQLiteDatabaseCorruptException;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.SQLiteMode;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28, manifest = Config.NONE)
@SQLiteMode(SQLiteMode.Mode.NATIVE)
public class VaultStateStoreTest {
    @Rule public TemporaryFolder folder = new TemporaryFolder();
    private Context context;
    private File path;
    private VaultStateStore store;

    @Before public void createStore() {
        context = RuntimeEnvironment.getApplication();
        path = new File(folder.getRoot(), "test-vault.sqlite3");
        store = new VaultStateStore(context, path);
    }

    @After public void closeStore() { store.close(); }

    @Test public void initialStateAndReopenPreserveJsonAndRevision() throws Exception {
        assertNull(store.load().json);
        assertEquals(0, store.load().revision);
        String json = "{\"revision\":1,\"people\":[{\"name\":\"테스트 명식\"}]}";
        assertEquals(1, store.save(json, 0));
        store.close();
        store = new VaultStateStore(context, path);
        assertEquals(json, store.load().json);
        assertEquals(1, store.load().revision);
    }

    @Test public void staleWriterCannotOverwriteLatestState() throws Exception {
        String latest = "{\"revision\":1,\"note\":\"latest\"}";
        store.save(latest, 0);
        try {
            store.save("{\"revision\":1,\"note\":\"stale\"}", 0);
            fail("Stale writer must be rejected");
        } catch (VaultException error) {
            assertEquals("REVISION_CONFLICT", error.code);
            assertEquals(Integer.valueOf(1), error.actualRevision);
        }
        assertEquals(latest, store.load().json);
        assertEquals(1, store.load().revision);
    }

    @Test public void concurrentSameRevisionWritesHaveOneWinner() throws Exception {
        ExecutorService threads = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            Future<Boolean> first = threads.submit(() -> writeAfter(start, "first"));
            Future<Boolean> second = threads.submit(() -> writeAfter(start, "second"));
            start.countDown();
            assertNotEquals(first.get(), second.get());
            assertEquals(1, store.load().revision);
        } finally {
            threads.shutdownNow();
        }
    }

    private boolean writeAfter(CountDownLatch start, String label) throws Exception {
        start.await();
        try {
            store.save("{\"revision\":1,\"writer\":\"" + label + "\"}", 0);
            return true;
        } catch (VaultException error) {
            assertEquals("REVISION_CONFLICT", error.code);
            return false;
        }
    }

    @Test public void jsonLargerThanCursorWindowRoundTripsKoreanAndEmoji() throws Exception {
        String note = "한글🌙".repeat(300_000);
        String json = "{\"revision\":1,\"note\":\"" + note + "\"}";
        assertTrue(json.getBytes(StandardCharsets.UTF_8).length > 2 * 1024 * 1024);
        store.save(json, 0);
        store.close();
        store = new VaultStateStore(context, path);
        assertEquals(json, store.load().json);
    }

    @Test public void exactEightMiBIsReadableAndLargerWriteLeavesItUnchanged() throws Exception {
        String prefix = "{\"note\":\"";
        String suffix = "\"}";
        String json = prefix + "a".repeat(VaultPayload.MAX_BYTES - prefix.length() - suffix.length()) + suffix;
        assertEquals(VaultPayload.MAX_BYTES, json.getBytes(StandardCharsets.UTF_8).length);
        store.save(json, 0);
        assertEquals(json, store.load().json);
        try {
            store.save(json + " ", 1);
            fail("Oversized write must be rejected");
        } catch (VaultException error) {
            assertEquals("PAYLOAD_TOO_LARGE", error.code);
        }
        assertEquals(1, store.load().revision);
        assertEquals(json, store.load().json);
    }

    @Test public void malformedJsonDoesNotCreateOrChangeSavedState() throws Exception {
        for (String invalid : new String[] { "[]", "{broken}", "{} trailing", "{\"same\":1,\"same\":2}" }) {
            try {
                store.save(invalid, 0);
                fail("Invalid JSON must be rejected");
            } catch (VaultException error) {
                assertEquals("INVALID_JSON", error.code);
            }
        }
        assertNull(store.load().json);
        assertEquals(0, store.load().revision);
    }

    @Test public void physicalDatabaseCorruptionNeverDeletesOrRecreatesTheFile() throws Exception {
        byte[] damaged = "Corrupt original personal database".repeat(200).getBytes(StandardCharsets.UTF_8);
        Files.write(path.toPath(), damaged);
        for (int attempt = 0; attempt < 2; attempt++) {
            try {
                store.load();
                fail("Corrupt database must not be recreated as an empty vault");
            } catch (SQLiteDatabaseCorruptException expected) {
                assertArrayEquals(damaged, Files.readAllBytes(path.toPath()));
            }
        }
    }
}
