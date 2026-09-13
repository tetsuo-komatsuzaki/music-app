import { redirect } from "next/navigation"
import { GUEST_ID } from "@/app/_libs/viewer"

// App Store Connect の「サポート URL」= https://arcodaviolin.com/support/help (2026-09-13 法務対応 CR-L2-01)。
// ヘルプは /[userId]/support/help にしか無いので、ログインなしで開けるゲスト閲覧へ送る
export default function SupportHelpRedirect() {
  redirect(`/${GUEST_ID}/support/help`)
}
