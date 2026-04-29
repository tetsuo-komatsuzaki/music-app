import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { APP_CONFIG } from "@/app/_libs/appConfig"
import styles from "./Help.module.css"

export const metadata = { title: "ヘルプ・FAQ | Arcoda" }

const MAX_RECORDING_MIN = Math.floor(APP_CONFIG.recording.maxDurationSec / 60)
const MAX_UPLOAD_MB = APP_CONFIG.upload.maxMusicXmlBytes / (1024 * 1024)
const ALLOWED_EXT = APP_CONFIG.upload.allowedExtensions.join(" / ")

type Faq = { q: string; a: React.ReactNode }
type Category = { title: string; items: Faq[] }

const CATEGORIES: Category[] = [
  {
    title: "はじめに",
    items: [
      {
        q: "Arcoda はどんなサービスですか?",
        a: (
          <p>
            楽譜と演奏録音をアップロードし、AI 解析による演奏のフィードバックを受け取れる練習支援サービスです。
            日々の練習を記録し、苦手箇所の把握にお役立ていただけます。
          </p>
        ),
      },
      {
        q: "対応している楽器はありますか?",
        a: (
          <p>
            ピアノを中心とした単旋律・和音の演奏に対応しています。
            その他の楽器についても順次対応予定です。
          </p>
        ),
      },
    ],
  },
  {
    title: "録音・解析",
    items: [
      {
        q: "1 回の録音時間に制限はありますか?",
        a: (
          <p>
            最長 {MAX_RECORDING_MIN} 分まで録音できます。これを超えると自動で停止します。
          </p>
        ),
      },
      {
        q: "解析にはどれくらい時間がかかりますか?",
        a: (
          <p>
            演奏時間や楽曲の長さによりますが、通常は数十秒〜数分で完了します。
            解析中は画面を閉じていただいて構いません。
          </p>
        ),
      },
      {
        q: "録音データは AI の学習に使われますか?",
        a: (
          <p>
            設定画面の「AI 学習への利用」がオンの場合に限り、
            <strong>オン以降の新規録音のみ</strong>
            を匿名化した上で演奏解析エンジンの精度向上に利用します。
            デフォルトはオフです。過去のデータは対象外で、いつでも変更できます。
          </p>
        ),
      },
    ],
  },
  {
    title: "楽譜・楽曲",
    items: [
      {
        q: "アップロードできる楽譜の形式は?",
        a: (
          <p>
            {ALLOWED_EXT} 形式の MusicXML ファイルに対応しています。1 ファイルあたり最大 {MAX_UPLOAD_MB}MB です。
          </p>
        ),
      },
      {
        q: "楽譜が正しく表示されません",
        a: (
          <p>
            MusicXML の書き出し方によっては一部の記号が表示されない場合があります。
            別のソフトウェアで書き出した MusicXML を試すか、お問い合わせフォームよりご連絡ください。
          </p>
        ),
      },
    ],
  },
  {
    title: "アカウント・データ",
    items: [
      {
        q: "表示名やメールアドレスを変更できますか?",
        a: (
          <p>
            設定画面から、表示名・メールアドレス・パスワードを変更できます。
            メールアドレス変更時は新旧両方のアドレスに確認メールが届きます。
          </p>
        ),
      },
      {
        q: "退会するとデータはどうなりますか?",
        a: (
          <p>
            退会処理時に楽譜・録音・解析結果などのデータは即時削除されます。
            ただし Supabase の自動バックアップには保持期間中残存する場合があります。詳しくはプライバシーポリシーをご確認ください。
          </p>
        ),
      },
      {
        q: "退会後、同じメールアドレスで再登録できますか?",
        a: <p>退会完了後、同じメールアドレスで再度サインアップ可能です。</p>,
      },
    ],
  },
  {
    title: "料金・プラン",
    items: [
      {
        q: "現在の料金プランは?",
        a: (
          <p>
            β 版期間中は無料でご利用いただけます。正式リリース時のプラン体系は別途ご案内します。
          </p>
        ),
      },
    ],
  },
  {
    title: "トラブル",
    items: [
      {
        q: "ログインできなくなりました",
        a: (
          <p>
            ログイン画面の「パスワードを忘れた方」よりリセットメールを送信できます。
            それでも解決しない場合はお問い合わせフォームよりご連絡ください。
          </p>
        ),
      },
      {
        q: "録音ボタンが反応しません",
        a: (
          <p>
            ブラウザのマイク権限が許可されているかご確認ください。
            アドレスバー左のアイコンから権限設定を開けます。
          </p>
        ),
      },
      {
        q: "解析が途中で止まります",
        a: (
          <p>
            通信環境が不安定な場合や、楽譜と演奏内容の差が極端に大きい場合に発生することがあります。
            時間をおいて再試行いただき、繰り返し発生する場合はお問い合わせください。
          </p>
        ),
      },
    ],
  },
]

export default async function HelpPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params
  await getUserIdsFromParams(p)

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>ヘルプ・FAQ</h1>
      <p className={styles.intro}>
        よくある質問をカテゴリ別にまとめています。各項目をタップすると回答が表示されます。
      </p>

      {CATEGORIES.map((category) => (
        <section key={category.title} className={styles.category}>
          <h2 className={styles.categoryTitle}>{category.title}</h2>
          {category.items.map((item, idx) => (
            <details key={idx} className={styles.faq}>
              <summary className={styles.faqSummary}>{item.q}</summary>
              <div className={styles.faqBody}>{item.a}</div>
            </details>
          ))}
        </section>
      ))}
    </div>
  )
}
