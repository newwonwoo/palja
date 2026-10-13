package com.newwonwoo.saju;

import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        // Register before BridgeActivity creates the bridge; later registration misses that load.
        registerPlugin(SajuVaultPlugin.class);
        super.onCreate(savedInstanceState);
        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        webView.setBackgroundColor(getColor(R.color.saju_background));
        WebSettings settings = webView.getSettings();
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setBlockNetworkLoads(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        WebView.setWebContentsDebuggingEnabled(false);
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, length) -> {});
        getBridge().setWebViewClient(new BridgeWebViewClient(getBridge()) {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !OfflineUrlPolicy.isLocalAsset(request.getUrl().toString());
            }

            @SuppressWarnings("deprecation")
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !OfflineUrlPolicy.isLocalAsset(url);
            }

            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (OfflineUrlPolicy.isLocalAsset(request.getUrl().toString())) {
                    return super.shouldInterceptRequest(view, request);
                }
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Offline only", Collections.emptyMap(),
                    new ByteArrayInputStream("External resources are disabled.".getBytes(StandardCharsets.UTF_8)));
            }
        });
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                    setEnabled(true);
                }
            }
        });
    }
}
