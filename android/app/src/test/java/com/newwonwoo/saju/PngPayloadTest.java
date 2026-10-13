package com.newwonwoo.saju;
import static org.junit.Assert.*;
import android.util.Base64;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28,manifest = Config.NONE)
public class PngPayloadTest {
  private static final byte[] PNG = new byte[] {(byte)137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1};
  @Test public void allowsPngHeader() throws Exception {assertArrayEquals(PNG,PngPayload.checkedBytes(Base64.encodeToString(PNG,Base64.NO_WRAP)));}
  @Test public void rejectsOtherImageFormats() throws Exception {
    try{PngPayload.checkedBytes(Base64.encodeToString("not png".getBytes(),Base64.NO_WRAP));fail();}catch(VaultException e){assertEquals("INVALID_IMAGE",e.code);}
  }
  @Test public void rejectsOversizedEncodedInput() throws Exception {
    try{PngPayload.checkedBytes("A".repeat(PngPayload.MAX_BYTES*2));fail();}catch(VaultException e){assertEquals("PAYLOAD_TOO_LARGE",e.code);}
  }
  @Test public void filenamesCannotTraverseOrUseHtmlSuffix(){assertEquals("_private_secret.png",PngPayload.safeFilename("../private/secret"));assertEquals("saju-chart.png",PngPayload.safeFilename(""));}
}
