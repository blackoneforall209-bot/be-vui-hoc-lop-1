const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

try {
  console.log('=== [1/4] Checking root index.html vs www/index.html ===');
  const rootIndex = path.join(__dirname, 'index.html');
  const wwwDir = path.join(__dirname, 'www');
  const wwwIndex = path.join(wwwDir, 'index.html');

  if (!fs.existsSync(wwwDir)) {
    fs.mkdirSync(wwwDir, { recursive: true });
  }

  // If user uploaded index.html to the repo root, copy it into www/index.html if it contains our latest meta tag
  if (fs.existsSync(rootIndex)) {
    const rootContent = fs.readFileSync(rootIndex, 'utf8');
    if (rootContent.includes('no-referrer') || !fs.existsSync(wwwIndex)) {
      fs.copyFileSync(rootIndex, wwwIndex);
      console.log('Copied root index.html into www/index.html');
    }
  }

  console.log('=== [2/4] Ensuring Android platform directory exists ===');
  const androidDir = path.join(__dirname, 'android');
  if (!fs.existsSync(androidDir)) {
    console.log('Running npx cap add android...');
    const capBin = path.join(__dirname, 'node_modules', '.bin', 'cap');
    child_process.execSync(`"${capBin}" add android`, { stdio: 'inherit', cwd: __dirname });
  }

  console.log('=== [3/4] Patching AndroidManifest.xml with TTS_SERVICE <queries> ===');
  const manifestPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  if (fs.existsSync(manifestPath)) {
    let manifest = fs.readFileSync(manifestPath, 'utf8');
    if (!manifest.includes('android.intent.action.TTS_SERVICE')) {
      const queriesBlock = `
    <queries>
        <intent>
            <action android:name="android.intent.action.TTS_SERVICE" />
        </intent>
        <package android:name="com.google.android.tts" />
        <package android:name="com.samsung.SMT" />
    </queries>
</manifest>`;
      manifest = manifest.replace('</manifest>', queriesBlock);
      fs.writeFileSync(manifestPath, manifest, 'utf8');
      console.log('Successfully injected TTS_SERVICE <queries> into AndroidManifest.xml');
    }
  }

  console.log('=== [4/4] Patching MainActivity.java with Native Android TTS Bridge ===');
  const mainActivityPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'java', 'com', 'behocvui', 'lop1', 'MainActivity.java');
  if (fs.existsSync(mainActivityPath)) {
    const javaCode = `package com.behocvui.lop1;

import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import java.util.Locale;

public class MainActivity extends BridgeActivity {
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private String pendingText = null;
    private float pendingRate = 0.92f;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        initGoogleTtsEngine();

        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setDomStorageEnabled(true);
            webView.addJavascriptInterface(new WebAppTTSInterface(), "AndroidNativeTTS");
        }
    }

    private void initGoogleTtsEngine() {
        try {
            tts = new TextToSpeech(getApplicationContext(), new TextToSpeech.OnInitListener() {
                @Override
                public void onInit(int status) {
                    if (status == TextToSpeech.SUCCESS) {
                        configureVietnameseLocale();
                    } else {
                        initDefaultTtsEngine();
                    }
                }
            }, "com.google.android.tts");
        } catch (Exception e) {
            initDefaultTtsEngine();
        }
    }

    private void initDefaultTtsEngine() {
        try {
            tts = new TextToSpeech(getApplicationContext(), new TextToSpeech.OnInitListener() {
                @Override
                public void onInit(int status) {
                    if (status == TextToSpeech.SUCCESS) {
                        configureVietnameseLocale();
                    }
                }
            });
        } catch (Exception ignored) {}
    }

    private void configureVietnameseLocale() {
        if (tts == null) return;
        try {
            Locale viLocale = new Locale("vi", "VN");
            int res = tts.setLanguage(viLocale);
            if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts.setLanguage(new Locale("vi"));
            }
            ttsReady = true;
            if (pendingText != null) {
                final String toRead = pendingText;
                final float r = pendingRate;
                pendingText = null;
                speakInternal(toRead, r);
            }
        } catch (Exception ignored) {}
    }

    private void speakInternal(String text, float rate) {
        if (tts == null || text == null) return;
        try {
            tts.setLanguage(new Locale("vi", "VN"));
            tts.setSpeechRate(rate > 0 ? rate : 0.92f);
            Bundle params = new Bundle();
            params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f);
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, "utt_" + System.currentTimeMillis());
        } catch (Exception ignored) {}
    }

    public class WebAppTTSInterface {
        @JavascriptInterface
        public boolean isReady() {
            return ttsReady;
        }

        @JavascriptInterface
        public void speak(final String text, final float rate) {
            if (text == null || text.trim().isEmpty()) return;
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (tts == null || !ttsReady) {
                        pendingText = text;
                        pendingRate = rate;
                        initGoogleTtsEngine();
                        return;
                    }
                    speakInternal(text, rate);
                }
            });
        }

        @JavascriptInterface
        public void stop() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (tts != null) {
                        try { tts.stop(); } catch (Exception ignored) {}
                    }
                }
            });
        }
    }

    @Override
    public void onDestroy() {
        if (tts != null) {
            try {
                tts.stop();
                tts.shutdown();
            } catch (Exception ignored) {}
        }
        super.onDestroy();
    }
}
`;
    fs.writeFileSync(mainActivityPath, javaCode, 'utf8');
    console.log('Successfully injected Native Android TTS Bridge into MainActivity.java');
  }
} catch (err) {
  console.warn('Warning in patch_android_native.js (continuing build):', err && err.message ? err.message : err);
}
