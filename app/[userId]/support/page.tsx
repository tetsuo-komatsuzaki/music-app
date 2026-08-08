import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import Link from "next/link"
import { HelpCircle, ScrollText, Lock, MessageCircle, Mail, type LucideIcon } from "lucide-react"
import styles from "./Support.module.css"

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0"

export const metadata = { title: "サポート" }

export default async function SupportPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params
  const { authUserId } = await getUserIdsFromParams(p)

  const items: { href: string; Icon: LucideIcon; title: string; desc: string }[] = [
    {
      href: `/${authUserId}/support/help`,
      Icon: HelpCircle,
      title: "ヘルプ・FAQ",
      desc: "よくある質問と使い方",
    },
    {
      href: `/${authUserId}/support/terms`,
      Icon: ScrollText,
      title: "利用規約",
      desc: "アプリを使うときのきまり",
    },
    {
      href: `/${authUserId}/support/privacy`,
      Icon: Lock,
      title: "プライバシーポリシー",
      desc: "個人情報の取り扱い",
    },
    {
      href: `/${authUserId}/support/feedback`,
      Icon: MessageCircle,
      title: "アルコに意見を送る",
      desc: "気になったこと、教えてね",
    },
    {
      href: `/${authUserId}/support/contact`,
      Icon: Mail,
      title: "お問い合わせ",
      desc: "困ったときは、ここから",
    },
  ]

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>サポート</h1>

      <nav className={styles.menu}>
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={styles.menuCard}>
            <span className={styles.icon}><item.Icon size={22} strokeWidth={2} /></span>
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
