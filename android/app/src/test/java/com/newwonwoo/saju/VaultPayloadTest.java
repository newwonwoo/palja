package com.newwonwoo.saju;

import static org.junit.Assert.*;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28, manifest = Config.NONE)
public class VaultPayloadTest {
    @Test public void importAcceptsUtf8BomAndPreservesText() throws Exception {
        String json = "{\"name\":\"명식 🌙\"}";
        byte[] bytes = ("\uFEFF" + json).getBytes(StandardCharsets.UTF_8);
        String decoded = VaultPayload.decodeUtf8(VaultPayload.readLimited(new ByteArrayInputStream(bytes)));
        assertEquals(json, decoded);
        VaultPayload.checkedBytes(decoded);
    }

    @Test public void malformedUtf8IsRejectedInsteadOfSilentlyReplaced() throws Exception {
        try {
            VaultPayload.decodeUtf8(new byte[] { (byte) 0xC3, (byte) 0x28 });
            fail("Malformed UTF-8 must be rejected");
        } catch (VaultException error) { assertEquals("INVALID_JSON", error.code); }
    }

    @Test public void inputLimitUsesActualBytesEvenWhenStreamHasNoLength() throws Exception {
        try {
            VaultPayload.readLimited(new ByteArrayInputStream(new byte[VaultPayload.MAX_BYTES + 1]));
            fail("Large stream must be rejected");
        } catch (VaultException error) { assertEquals("PAYLOAD_TOO_LARGE", error.code); }
        try {
            VaultPayload.checkedBytes("{\"n\":\"" + "가".repeat(3_000_000) + "\"}");
            fail("UTF-8 byte count must govern the limit");
        } catch (VaultException error) { assertEquals("PAYLOAD_TOO_LARGE", error.code); }
    }

    @Test public void exportNamesCannotEscapeTheSelectedDirectory() {
        assertEquals("saju-vault-backup.json", VaultPayload.safeFilename(null));
        String safe = VaultPayload.safeFilename("../../private\\secret");
        assertFalse(safe.contains("/"));
        assertFalse(safe.contains("\\"));
        assertTrue(safe.endsWith(".json"));
    }

    @Test public void nonstandardAndroidJsonReaderTokensAreRejected() throws Exception {
        for (String invalid : new String[] {
            "{\"x\":TRUE}", "{\"x\":False}", "{\"x\":NULL}", "{\"x\":\"\\q\"}",
            "{\"x\":\"raw\nnewline\"}", "{\"x\":\"\\u00G0\"}", "{\"x\":\"\\u123\"}",
            "{\"x\":01}", "{\"x\":+1}", "{\"x\":1.}", "{\"x\":1e}", "{\"x\":NaN}",
            "{\"x\":Infinity}", "{\"x\":truefalse}"
        }) {
            try {
                VaultPayload.checkedBytes(invalid);
                fail("Nonstandard JSON must be rejected: " + invalid);
            } catch (VaultException error) { assertEquals("INVALID_JSON", error.code); }
        }
    }

    @Test public void standardJsonLiteralsEscapesAndNumbersArePreserved() throws Exception {
        String valid = "{\"x\":[true,false,null,-0,0,123,-12.5,1e3,1E+3,1e-3],\"s\":\"\\\"\\\\\\/\\b\\f\\n\\r\\t\\uac00 명식 🌙\"}";
        assertEquals(valid, new String(VaultPayload.checkedBytes(valid), StandardCharsets.UTF_8));
    }
}
