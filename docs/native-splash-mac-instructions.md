# ネイティブ起動スプラッシュ実装指示書 (Mac側作業・ARC-SPEC-NATIVE-1.0 追補 2026-08-16)

## 目的

アプリ起動の一番最初の一瞬 (WKWebView が arcodaviolin.com の HTML を受け取るまでの数百ms〜数秒) にも、
Web側と**同一のモーションスプラッシュ** (弓を振るアルコ+立ちのぼる音符+Arcodaロゴ+「よみこみ中」ドット) を表示する。

Web側 (`ArcoBootSplash`・デプロイ済み) は HTML が届いた瞬間から同じ見た目を表示するため、
ネイティブ側→Web側の引き継ぎは**見た目が全く同じで繋ぎ目が見えない**。

## 使う素材 (リポジトリに生成済み・コミット済み)

- `native/ios-splash/splash.html` — 自己完結の1ファイル (SVGアルコ+CSSアニメ内蔵、外部通信なし)。
  Web側スプラッシュと同一デザイン。**編集禁止** (元は `scripts/gen-native-splash.tsx` で自動生成。
  デザイン変更時は Windows 側で `npx tsx scripts/gen-native-splash.tsx` を再実行して再同梱する)。

## 実装手順

### 1. splash.html をバンドルに追加
- `git pull` 後、`native/ios-splash/splash.html` を Xcode の App ターゲットに追加
  (Copy Bundle Resources に入っていることを確認)。

### 2. LaunchScreen を紺にする
- `LaunchScreen.storyboard` の背景色を **#16294F (RGB 22, 41, 79)** に変更。
- Apple の制約で LaunchScreen 自体はアニメ不可・静止のみ。ここは無地の紺でよい
  (直後に同色のスプラッシュが重なるため、白フラッシュが消えることが目的)。

### 3. MyViewController にオーバーレイを追加
方針: メインWebViewの上に**ローカルHTMLを表示する小さなWKWebViewを重ね**、本体の読み込み完了でフェードアウト。

```swift
// MyViewController (CAPBridgeViewController のサブクラス) に追加

private var splashOverlay: WKWebView?
private var progressObservation: NSKeyValueObservation?
private var splashTimeoutTimer: Timer?

override func viewDidLoad() {
    super.viewDidLoad()
    // …既存の設定 (decelerationRate / bounces / 背景色など) はそのまま…
    installSplashOverlay()
}

private func installSplashOverlay() {
    guard let url = Bundle.main.url(forResource: "splash", withExtension: "html") else { return }
    let config = WKWebViewConfiguration()
    let overlay = WKWebView(frame: view.bounds, configuration: config)
    overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    overlay.isUserInteractionEnabled = false
    overlay.isOpaque = false
    overlay.backgroundColor = UIColor(red: 22/255, green: 41/255, blue: 79/255, alpha: 1)
    overlay.scrollView.isScrollEnabled = false
    overlay.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
    view.addSubview(overlay)   // 最前面 (メインWebViewの上)
    splashOverlay = overlay

    // 本体WebViewの読み込み進捗を監視し、完了でフェードアウト
    // (WKNavigationDelegate は Capacitor 本体が握っているため上書きしない。KVOで安全に観測する)
    if let mainWebView = self.webView {
        progressObservation = mainWebView.observe(\.estimatedProgress, options: [.new]) { [weak self] wv, _ in
            if wv.estimatedProgress >= 1.0 {
                self?.dismissSplashOverlay()
            }
        }
    }
    // 保険: 12秒で必ず消す (オフライン等でもエラー表示を隠し続けない)
    splashTimeoutTimer = Timer.scheduledTimer(withTimeInterval: 12, repeats: false) { [weak self] _ in
        self?.dismissSplashOverlay()
    }
}

private func dismissSplashOverlay() {
    guard let overlay = splashOverlay else { return }
    splashOverlay = nil
    progressObservation = nil
    splashTimeoutTimer?.invalidate()
    splashTimeoutTimer = nil
    DispatchQueue.main.async {
        UIView.animate(withDuration: 0.3, animations: { overlay.alpha = 0 }) { _ in
            overlay.removeFromSuperview()
        }
    }
}
```

実装上の注意:
- **WKNavigationDelegate を差し替えないこと** (Capacitor 内部が使用中。壊すとブリッジ全機能が死ぬ)。
  上のとおり `estimatedProgress` の KVO のみで判定する。
- overlay はセーフエリアを無視して全画面 (`view.bounds` + autoresizing) に敷く。
  splash.html 側が `viewport-fit=cover` なので端まで紺で塗られる。
- `estimatedProgress >= 1.0` の時点では、下にはWeb側の同一スプラッシュ (または本体画面) が
  描画済みのため、フェードしても白は見えない。

## 受け入れ基準 (実機で確認)

1. コールドスタート: 起動画面(紺) → モーションスプラッシュ → アプリ本体まで、**白い画面が一瞬も見えない**
2. スプラッシュのアルコが弓を振り、音符が立ちのぼり、「よみこみ中」のドットが跳ねている
3. 機内モードで起動: 12秒後にスプラッシュが消え、下のエラー表示が見える (無限スプラッシュにならない)
4. 通常のWebブラウザ表示 (Web版) には一切影響なし (この作業はネイティブ殻のみ)
