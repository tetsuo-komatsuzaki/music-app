import { redirect } from "next/navigation"
import { GUEST_ID } from "@/app/_libs/viewer"

// App Store のサポート URL 用 (2026-09-13 法務対応 CR-L2-01)。ログインなしで開けるゲスト閲覧のサポートへ送る
export default function SupportRedirect() {
  redirect(`/${GUEST_ID}/support`)
}
