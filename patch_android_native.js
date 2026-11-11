const fs = require('fs');
const path = require('path');

console.log('=== Running Native Android TTS & WebView Patch ===');

// 1. Patch AndroidManifest.xml to declare TTS_SERVICE <queries> for Android 11/12/13/14+ (Samsung Tab S8 / S23 Ultra)
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

// 2. Patch MainActivity.java to expose window.AndroidNativeTTS directly to the WebView
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
                        Locale viLocale = new Locale("vi", "VN");
                        int res = tts.setLanguage(viLocale);
                        if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                            tts.setLanguage(new Locale("vi"));
                        }
                        ttsReady = true;
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
                        tts.setLanguage(new Locale("vi", "VN"));
                        ttsReady = true;
                    }
                }
            });
        } catch (Exception ignored) {}
    }

    public class WebAppTTSInterface {
        @JavascriptInterface
        public boolean isReady() {
            return ttsReady;
        }

        @JavascriptInterface
        public void speak(String text, float rate) {
            if (tts != null && text != null) {
                Locale viLocale = new Locale("vi", "VN");
                tts.setLanguage(viLocale);
                tts.setSpeechRate(rate > 0 ? rate : 0.92f);
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "utt_" + System.currentTimeMillis());
            }
        }

        @JavascriptInterface
        public void stop() {
            if (tts != null) {
                tts.stop();
            }
        }
    }

    @Override
    public void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
        super.onDestroy();
    }
}
`;
  fs.writeFileSync(mainActivityPath, javaCode, 'utf8');
  console.log('Successfully injected Native Android TTS Bridge into MainActivity.java');
}
