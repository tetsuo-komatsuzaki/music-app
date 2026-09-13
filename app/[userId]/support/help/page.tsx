import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { APP_CONFIG } from "@/app/_libs/appConfig"
import styles from "./Help.module.css"

export const metadata = { title: "ヘルプ・FAQ" }

const MAX_UPLOAD_MB = APP_CONFIG.upload.maxMusicXmlBytes / (1024 * 1024)
const ALLOWED_EXT = APP_CONFIG.upload.allowedExtensions.join(" / ")

type Faq = { q: string; a: React.ReactNode }
type Category = { title: string; items: Faq[] }

const CATEGORIES: Category[] = [
  {
    title: "はじめに",
    items: [
      {
        q: "アルコってなに?",
        a: (
          <p>
            楽譜と録音をアップロードすると、AIの先生アルコが演奏を聴いて、いいところ・伸ばすところを教えてくれます。
            毎日の練習を記録して、苦手なところが見つけやすくなります。
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
    title: "録音・採点",
    items: [
      {
        q: "1 回の録音時間に制限はありますか?",
        a: (
          <p>
            現在、約 3 分ほどの演奏は動作保証しております。
            それ以上の長さになると、うまく聴きとれないことがあります。
          </p>
        ),
      },
      {
        q: "採点にはどれくらい時間がかかりますか?",
        a: (
          <p>
            演奏時間や楽曲の長さによりますが、通常は数十秒〜数分で完了します。
          </p>
        ),
      },
      {
        q: "音程とリズムで、採点した音の数が違うのはなぜですか?",
        a: (
          <p>
            同じ高さの音が続く箇所は、バイオリンでは音が途切れずにつながるため、
            どこで次の音に移ったかを音から聞き分けられません。
            このためリズムの採点からは外しています。
            音の高さは測れるので、音程はすべての音を採点しています。
            <br />
            弓をいったん止めて、音を切って弾いた場合はリズムも採点されます。
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
            プロフィール画面から、表示名・メールアドレス・パスワードを変更できます。
          </p>
        ),
      },
      {
        q: "退会するとデータはどうなりますか?",
        a: (
          <p>
            アップロードした楽譜・録音・採点の記録もすべて削除されます。
            App Store で契約したアルコプラスは、退会しても自動では止まりません。iPhone の設定 › サブスクリプションから解約してください。
            Web で契約したアルコプラスは、退会と同時に解約されます。
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
            アルコプラスは月 1,280 円・年 12,800 円です。はじめての方は最初の 2 週間は無料で、その後は選んだプランの料金が Apple ID に請求されます。解約は iPhone の設定 › サブスクリプションから、いつでもできます。
            Web ブラウザで以前に契約した方は、設定の「契約を管理」から確認・解約できます。
            くわしい条件は「特定商取引法に基づく表記」と「利用規約」をご覧ください。
          </p>
        ),
      },
      {
        q: "無料期間のうちに解約したら、お金はかかりますか?",
        a: (
          <p>
            かかりません。無料期間の終了の 24 時間前までに解約すると、請求は発生しません。解約しても無料期間の終わりまでは使えます。
            無料期間は Apple ID ごとに 1 回です。
          </p>
        ),
      },
      {
        q: "返金はできますか?",
        a: (
          <p>
            App Store での支払いの返金は Apple が判断します。Apple の「問題を報告する」から申請してください。日割りの返金はありません。
          </p>
        ),
      },
      {
        q: "登録なしでためした録音はいつ消えますか?",
        a: (
          <p>
            ためした録音と採点の結果は、30 日たつと自動で消えます。アルコプラスをはじめて引き継ぐと、あなたの記録として残ります。
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
        q: "採点が途中で止まります",
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
