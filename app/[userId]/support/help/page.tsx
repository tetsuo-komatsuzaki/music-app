import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { APP_CONFIG } from "@/app/_libs/appConfig"
import styles from "./Help.module.css"

export const metadata = { title: "ヘルプ・FAQ | Arcoda" }

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
            現在は、バイオリン用として開発しています。
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
            現在、約 3 分ほどの演奏は動作保証しております。
            それ以上の演奏時間となる場合、サービスが正常に動作しない可能性がある点をご了承ください。
          </p>
        ),
      },
      {
        q: "解析にはどれくらい時間がかかりますか?",
        a: (
          <p>
            演奏時間や楽曲の長さによりますが、通常は数十秒〜数分で完了します。
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
            アップロードされたファイルの内容によっては、一部の記号が表示されない場合があります。
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
          </p>
        ),
      },
      {
        q: "退会するとデータはどうなりますか?",
        a: (
          <p>
            アップロードした楽譜・録音・解析結果などのデータも削除されます。
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
            通信環境を確認のうえ、時間をおいて再試行してください。
            繰り返し発生する場合は、お問い合わせください。
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
