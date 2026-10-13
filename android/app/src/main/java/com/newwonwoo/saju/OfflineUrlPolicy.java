package com.newwonwoo.saju;

import java.net.URI;
import java.net.URISyntaxException;

final class OfflineUrlPolicy {
    private OfflineUrlPolicy() {}

    static boolean isLocalAsset(String url) {
        if (url == null) return false;
        try {
            URI uri = new URI(url);
            String path = uri.getPath();
            return "https".equalsIgnoreCase(uri.getScheme())
                && "localhost".equalsIgnoreCase(uri.getHost())
                && uri.getRawUserInfo() == null
                && (uri.getPort() == -1 || uri.getPort() == 443)
                && path != null
                && !path.startsWith("/_capacitor_");
        } catch (URISyntaxException error) {
            return false;
        }
    }
}
