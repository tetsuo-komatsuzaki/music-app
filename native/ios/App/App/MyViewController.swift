import Capacitor
import UIKit

/// WebView のスクロール挙動を Safari に合わせるためのカスタム VC。
///
/// 既定のままだと惰性スクロールがすぐ止まり、同じサイトを Safari で見たときより
/// 明らかに減速が速い。譜面や長い一覧を指で送る操作が主なので、
/// ここだけ Safari と同じ手触りに寄せる。
///
/// Capacitor 公式のカスタム VC パターン。Main.storyboard の customClass と
/// SceneDelegate の rootViewController の両方をこのクラスに向けている
/// (Capacitor 8 の殻は SceneDelegate がコードで root を作るので、
///  storyboard 側だけ変えても効かない)。
class MyViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()

        // .fast (0.99) だと指を離した直後に失速する。
        // .normal (0.998) が Safari と同じ減速。
        webView?.scrollView.decelerationRate = UIScrollView.DecelerationRate.normal
        // 端まで来たときの引っ張り返し。無いとスクロール終端が硬く感じる。
        webView?.scrollView.bounces = true
    }
}
