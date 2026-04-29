import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import Link from "next/link"
import styles from "./Support.module.css"

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0"

export default async function SupportPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params
  const { authUserId } = await getUserIdsFromParams(p)

  const items = [
    {
      href: `/${authUserId}/support/help`,
      icon: "❓",
      title: "ヘルプ・FAQ",
      desc: "よくある質問と使い方",
    },
    {
      href: `/${authUserId}/support/terms`,
      icon: "📜",
      title: "利用規約",
      desc: "サービス利用にあたっての規約",
    },
    {
      href: `/${authUserId}/support/privacy`,
      icon: "🔒",
      title: "プライバシーポリシー",
      desc: "個人情報の取り扱い",
    },
    {
      href: `/${authUserId}/support/feedback`,
      icon: "💬",
      title: "フィードバックを送る",
      desc: "サービス改善へのご意見",
    },
    {
      href: `/${authUserId}/support/contact`,
      icon: "📧",
      title: "お問い合わせ",
      desc: "サポートチームへのご連絡",
    },
  ]

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>サポート</h1>

      <nav className={styles.menu}>
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={styles.menuCard}>
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>
              <span className={styles.menuTitle}>{item.title}</span>
              <span className={styles.menuDesc}>{item.desc}</span>
            </span>
            <span className={styles.chevron}>›</span>
          </Link>
        ))}
      </nav>

      <section className={styles.versionSection}>
        <h2 className={styles.versionTitle}>バージョン情報</h2>
        <p className={styles.versionLine}>Arcoda v{APP_VERSION}</p>
        <p className={styles.versionLine}>© 2026 Arcoda</p>
      </section>
    </div>
  )
}
