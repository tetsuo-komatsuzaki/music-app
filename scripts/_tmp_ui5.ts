// 学びレッスン検証用テストユーザー (使い捨て)
import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SR_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const EMAIL = "ui5@example.com"
const PASS = "Ui5Check!2026#Tmp"

async function admin(path: string, init: RequestInit) {
  return fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    ...init,
    headers: { apikey: SR_KEY, Authorization: `Bearer ${SR_KEY}`, "Content-Type": "application/json" },
  })
}

async function main() {
  const mode = process.argv[2] ?? "setup"
  if (mode === "setup") {
    const r = await admin("/admin/users", {
      method: "POST",
      body: JSON.stringify({ email: EMAIL, password: PASS, email_confirm: true }),
    })
    const j = await r.json()
    let authId = j.id
    if (!authId) {
      const lr = await admin(`/admin/users?filter=${encodeURIComponent(EMAIL)}`, { method: "GET" })
      const lj = await lr.json()
      authId = lj.users?.[0]?.id
    }
    if (!authId) { console.error(j); throw new Error("auth create failed") }
    const u = await prisma.user.upsert({
      where: { supabaseUserId: authId },
      update: {},
      create: { supabaseUserId: authId, name: "_tmp_ui5", role: "student" },
    })
    await prisma.onboardingProfile.upsert({
      where: { userId: u.id },
      update: { completedAt: new Date() },
      create: { userId: u.id, completedAt: new Date(), star: 3 },
    })
    console.log("authId:", authId, "email:", EMAIL, "pass:", PASS)
  } else {
    const r = await admin(`/admin/users?filter=${encodeURIComponent(EMAIL)}`, { method: "GET" })
    const j = await r.json()
    for (const u of j.users ?? []) {
      await prisma.user.deleteMany({ where: { supabaseUserId: u.id } })
      await admin(`/admin/users/${u.id}`, { method: "DELETE" })
      console.log("deleted:", u.id)
    }
  }
}

main().finally(() => prisma.$disconnect())
