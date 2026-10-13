package com.newwonwoo.saju;

import android.util.Base64;

/** Local chart image only. Never accepts paths, URIs, SVG or remote URLs. */
final class PngPayload {
    static final int MAX_BYTES = 4 * 1024 * 1024;
    private static final byte[] SIGNATURE = {(byte)137,80,78,71,13,10,26,10};
    private PngPayload() {}

    static byte[] checkedBytes(String encoded) throws VaultException {
        if (encoded == null || encoded.length() > (MAX_BYTES * 4L / 3L + 8))
            throw new VaultException("PAYLOAD_TOO_LARGE", "이미지는 최대 4MiB까지 저장할 수 있습니다.");
        if (!encoded.matches("[A-Za-z0-9+/]+={0,2}"))
            throw new VaultException("INVALID_IMAGE", "올바른 PNG 인코딩이 아닙니다.");
        final byte[] result;
        try { result = Base64.decode(encoded, Base64.NO_WRAP); }
        catch (IllegalArgumentException error) { throw new VaultException("INVALID_IMAGE", "PNG 데이터를 읽지 못했습니다."); }
        if (result.length > MAX_BYTES) throw new VaultException("PAYLOAD_TOO_LARGE", "이미지는 최대 4MiB까지 저장할 수 있습니다.");
        if (result.length < 24) throw new VaultException("INVALID_IMAGE", "PNG 이미지가 너무 짧습니다.");
        for (int i=0;i<SIGNATURE.length;i++)if(result[i]!=SIGNATURE[i])throw new VaultException("INVALID_IMAGE", "PNG 파일이 아닙니다.");
        if (result[12]!='I'||result[13]!='H'||result[14]!='D'||result[15]!='R')
            throw new VaultException("INVALID_IMAGE", "PNG 헤더가 없습니다.");
        return result;
    }

    static String safeFilename(String supplied) {
        String value = supplied == null ? "saju-chart" : supplied.replaceAll("[\\\\/\\p{Cntrl}:*?\"<>|]", "_")
            .replaceAll("^[. ]+", "").replaceAll("[. ]+$", "");
        if(value.isBlank())value="saju-chart";
        if(value.length()>100)value=value.substring(0,100);
        if(!value.toLowerCase(java.util.Locale.ROOT).endsWith(".png"))value+=".png";
        return value;
    }
}
