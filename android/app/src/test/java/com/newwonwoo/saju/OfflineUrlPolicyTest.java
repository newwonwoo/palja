package com.newwonwoo.saju;

import static org.junit.Assert.*;
import org.junit.Test;

public class OfflineUrlPolicyTest {
    @Test public void permitsOnlyBundledOrigin() {
        assertTrue(OfflineUrlPolicy.isLocalAsset("https://localhost/"));
        assertTrue(OfflineUrlPolicy.isLocalAsset("https://localhost/assets/index.js"));
        assertTrue(OfflineUrlPolicy.isLocalAsset("https://localhost/private/initial-vault.json"));
        assertTrue(OfflineUrlPolicy.isLocalAsset("https://localhost:443/?page=vault#saved"));
    }

    @Test public void rejectsExternalAndNativeFileProxyUrls() {
        for (String url : new String[] {
            "https://example.com/", "http://localhost/", "https://localhost.example.com/",
            "https://localhost@evil.example/", "https://user@localhost/", "https://localhost:8080/",
            "file:///data/data/com.newwonwoo.saju/no_backup/saju-vault.sqlite3",
            "content://documents/1", "javascript:alert(1)", "intent://example/", "tel:123",
            "https://localhost/_capacitor_file_/data/data/private",
            "https://localhost/%5Fcapacitor_content_/documents/1", null
        }) assertFalse(String.valueOf(url), OfflineUrlPolicy.isLocalAsset(url));
    }
}
