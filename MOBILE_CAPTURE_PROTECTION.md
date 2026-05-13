# WebView 캡쳐 방지 가이드

이 저장소에는 현재 iOS/Android 앱 소스가 없어서 바로 코드에 주입할 수는 없다.
대신 WebView 앱에 바로 옮겨 쓸 수 있는 캡쳐 방지 패턴을 정리한다.

## 핵심 정리

- Android는 `FLAG_SECURE`로 스크린샷과 화면 녹화를 비교적 강하게 막을 수 있다.
- iOS는 스크린샷을 완전히 차단하는 공개 API가 없다.
- iOS는 `UIScreen.isCaptured` 감지, 스크린샷 감지, 민감 화면 블러/마스킹으로 대응한다.

## Android Kotlin

WebView를 띄우는 `Activity`에 아래처럼 적용한다.

```kotlin
import android.os.Bundle
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity

class WebViewActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )

        setContentView(R.layout.activity_webview)
    }
}
```

프래그먼트에서만 제어하고 싶으면 액티비티에 붙이는 편이 가장 단순하다.

필요하면 `onResume()`에서도 한 번 더 걸 수 있다.

```kotlin
override fun onResume() {
    super.onResume()
    window.setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
    )
}
```

## iOS Swift

iOS는 완전 차단이 아니라 감지 후 숨김 처리가 현실적이다.

아래 예시는 `WKWebView`가 있는 화면에서 캡쳐/녹화가 감지되면 오버레이를 덮는 방식이다.

```swift
import UIKit
import WebKit

final class WebViewController: UIViewController {
    private let webView = WKWebView(frame: .zero)
    private let privacyOverlay = UIVisualEffectView(effect: UIBlurEffect(style: .systemUltraThinMaterialDark))

    override func viewDidLoad() {
        super.viewDidLoad()

        view.addSubview(webView)
        webView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        privacyOverlay.frame = view.bounds
        privacyOverlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        privacyOverlay.isHidden = true
        view.addSubview(privacyOverlay)

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(screenCaptureChanged),
            name: UIScreen.capturedDidChangeNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(userDidTakeScreenshot),
            name: UIApplication.userDidTakeScreenshotNotification,
            object: nil
        )

        updatePrivacyState()
    }

    @objc private func screenCaptureChanged() {
        updatePrivacyState()
    }

    @objc private func userDidTakeScreenshot() {
        showPrivacyOverlayTemporarily()
    }

    private func updatePrivacyState() {
        privacyOverlay.isHidden = !UIScreen.main.isCaptured
    }

    private func showPrivacyOverlayTemporarily() {
        privacyOverlay.isHidden = false

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.updatePrivacyState()
        }
    }
}
```

## iOS에서 추가로 권장하는 방식

- 민감 화면일 때만 오버레이를 띄우는 것이 UX가 좋다.
- 앱이 백그라운드로 갈 때도 블러를 올리면 화면 전환 순간 노출을 줄일 수 있다.
- `UIScreen.main.isCaptured`는 화면 녹화나 미러링 감지에 유용하다.
- 스크린샷은 찍힌 뒤 감지되는 구조라서, 사전 차단은 불가능하다.

```swift
override func viewWillDisappear(_ animated: Bool) {
    super.viewWillDisappear(animated)
    privacyOverlay.isHidden = true
}
```

## WebView 앱에서 현실적인 운영 방식

1. Android는 `FLAG_SECURE`로 강하게 막는다.
2. iOS는 캡쳐 감지 시 블러/차단 화면을 띄운다.
3. 서버는 캐시 금지와 전용 이미지 URL만 제공한다.
4. 민감 사진에는 워터마크를 넣는다.

## 다음 단계

실제 iOS/Android 프로젝트 소스가 생기면 아래 중 하나로 바로 옮길 수 있다.

- Android: `Activity` 생성 시 `FLAG_SECURE` 적용
- iOS: `WKWebView` 화면에 캡쳐 감지 오버레이 적용
- 공통: 민감 화면용 공용 래퍼 컴포넌트로 분리