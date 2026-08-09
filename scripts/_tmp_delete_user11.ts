import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const SUPA_ID = "39087edc-c314-48a9-bc7e-34bfc1376e68" // #11
const EMAIL = "unitunit9293@yahoo.co.jp"

async function cleanupStorage(bucket: string, prefix: string) {
  try {
    const { data } = await sb.storage.from(bucket).list(prefix, { limit: 1000 })
    if (!data || data.length === 0) return 0
    // 再帰は浅い前提 (ユーザーフォルダ直下)。ファイルとサブフォルダ両対応
    let removed = 0
    for (const f of data) {
      if (f.id) { await sb.storage.from(bucket).remove([`${prefix}/${f.name}`]); removed++ }
      else {
        const { data: sub } = await sb.storage.from(bucket).list(`${prefix}/${f.name}`, { limit: 1000 })
        const paths = (sub ?? []).map(x => `${prefix}/${f.name}/${x.name}`)
        if (paths.length) { await sb.storage.from(bucket).remove(paths); removed += paths.length }
      }
    }
    return removed
  } catch { return 0 }
}

async function main() {
  console.log(`削除対象: #11 ${EMAIL}  (${SUPA_ID})\n`)

  // 1. Auth 削除 (Auth-first: アプリの退会処理と同じ順)
  const { error: authErr } = await sb.auth.admin.deleteUser(SUPA_ID)
  console.log(`1) Auth 削除: ${authErr ? "失敗 " + authErr.message : "OK"}`)
  if (authErr) throw new Error("Auth 削除失敗のため中断")

  // 2. Storage 掃除 (0曲/0演奏なので基本空。念のため両バケット)
  const r1 = await cleanupStorage("musicxml", SUPA_ID)
  const r2 = await cleanupStorage("performances", SUPA_ID)
  console.log(`2) Storage 掃除: musicxml ${r1}件 / performances ${r2}件`)

  // 3. DB User 削除 (Cascade で songRequests / tagAcquisitions 等も消える)
  const dbUser = await prisma.user.findUnique({ where: { supabaseUserId: SUPA_ID }, select: { id: true } })
  if (dbUser) {
    await prisma.user.delete({ where: { id: dbUser.id } })
    console.log(`3) DB User 削除: OK (${dbUser.id})`)
  } else {
    console.log(`3) DB User 削除: 対象なし (既に無し)`)
  }

  // 4. 検証: Auth / DB / メール解放
  console.log("\n=== 検証 ===")
  const { data: chk } = await sb.auth.admin.getUserById(SUPA_ID)
  console.log(`  Auth に残っているか: ${chk?.user ? "残存(NG)" : "消えた(OK)"}`)
  const stillDb = await prisma.user.findUnique({ where: { supabaseUserId: SUPA_ID }, select: { id: true } })
  console.log(`  DB に残っているか  : ${stillDb ? "残存(NG)" : "消えた(OK)"}`)
  const emailRow = await prisma.$queryRawUnsafe<any[]>(
    `SELECT count(*)::int AS n FROM auth.users WHERE lower(email)=lower($1)`, EMAIL)
  console.log(`  ${EMAIL} の登録: ${emailRow[0].n === 0 ? "解放された(OK) → 再登録できます" : "まだ残存(NG)"}`)
}
main().catch((e)=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect())
