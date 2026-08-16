import Capacitor
import UIKit
import WebKit

/// WebView のスクロール挙動と起動スプラッシュを担当するカスタム VC。
///
/// Capacitor 公式のカスタム VC パターン。Main.storyboard の customClass と
/// SceneDelegate の rootViewController の両方をこのクラスに向けている
/// (Capacitor 8 の殻は SceneDelegate がコードで root を作るので、
///  storyboard 側だけ変えても効かない)。
class MyViewController: CAPBridgeViewController {

    /// 起動直後 (リモートHTMLが届くまで) を覆うスプラッシュ。
    /// 中身は同梱の splash.html で、Web側 ArcoBootSplash と同一デザイン。
    private var splashOverlay: WKWebView?
    private var progressObservation: NSKeyValueObservation?
    private var splashTimeoutTimer: Timer?

    private static let navy = UIColor(red: 22/255, green: 41/255, blue: 79/255, alpha: 1)

    override func viewDidLoad() {
        super.viewDidLoad()

        // .fast (0.99) だと指を離した直後に失速する。
        // .normal (0.998) が Safari と同じ減速。
        webView?.scrollView.decelerationRate = UIScrollView.DecelerationRate.normal
        // 端まで来たときの引っ張り返し。無いとスクロール終端が硬く感じる。
        webView?.scrollView.bounces = true

        // ページ末尾やバウンスで WebView 自体の白背景が覗くのを防ぐ。
        // Web 本文と同じ #F8FAFC を敷いて、境目を見えなくする。
        let pageBackground = UIColor(red: 0.973, green: 0.980, blue: 0.988, alpha: 1)
        webView?.isOpaque = false
        webView?.backgroundColor = pageBackground
        webView?.scrollView.backgroundColor = pageBackground
    }

    // MARK: - 起動スプラッシュ

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        installSplashOverlay()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        installSplashOverlay()   // viewWillAppear 時点で window が無い場合の保険
    }

    /// ウィンドウ直下・最前面にローカルHTMLのWebViewを重ねる。
    ///
    /// 載せ先が view ではなくウィンドウなのは、Capacitor の `self.view` が
    /// WebView 本体だから。そこに addSubview すると WKWebView の入れ子になり、
    /// 内側の Web コンテンツが合成されず背景色だけが出る (2026-08-16 実測)。
    ///
    /// また、サイズが 0x0 のまま loadFileURL しても描画されないため、
    /// ウィンドウに載せて実サイズを与えてから読み込む。
    private func installSplashOverlay() {
        guard splashOverlay == nil, let window = view.window else { return }
        guard let url = Bundle.main.url(forResource: "splash", withExtension: "html") else { return }

        let overlay = WKWebView(frame: window.bounds, configuration: WKWebViewConfiguration())
        overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        overlay.isUserInteractionEnabled = false
        overlay.isOpaque = true
        overlay.backgroundColor = MyViewController.navy
        overlay.scrollView.backgroundColor = MyViewController.navy
        overlay.scrollView.isScrollEnabled = false

        window.addSubview(overlay)
        window.bringSubviewToFront(overlay)
        splashOverlay = overlay

        // 実サイズが入った状態で読み込む
        overlay.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())

        // 本体の読み込み完了で消す。
        // WKNavigationDelegate は Capacitor 本体が握っているので触らず、KVO だけで観測する。
        if let mainWebView = self.webView {
            progressObservation = mainWebView.observe(\.estimatedProgress, options: [.new]) { [weak self] wv, _ in
                if wv.estimatedProgress >= 1.0 {
                    self?.dismissSplashOverlay()
                }
            }
        }

        // 保険: オフライン等で読み込みが完了しなくても、下のエラー表示を隠し続けない。
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
}
