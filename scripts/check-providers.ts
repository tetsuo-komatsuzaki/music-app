import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const c = await prisma.$queryRawUnsafe<{ c: number }[]>(
    `select count(*)::int as c from auth.users`
  )
  console.log("auth.users 実カウント:", c[0].c)

  const rows = await prisma.$queryRawUnsafe<any[]>(`
    select
      a.email,
      a.created_at,
      (select string_agg(i.provider, ',') from auth.identities i where i.user_id = a.id) as providers,
      (select count(*)::int from "User" u where u."supabaseUserId" = a.id::text) as prisma_rows
    from auth.users a
    order by a.created_at asc
  `)
  console.log("-- email | providers | Prisma対応 --")
  for (const r of rows) {
    console.log(
      `${r.email}  |  ${r.providers ?? "(identitiesなし)"}  |  ${r.prisma_rows > 0 ? "Prismaあり" : "❌Prismaなし"}`
    )
  }
}

main()
  .catch((e) => console.error("ERR", e?.message ?? e))
  .finally(() => prisma.$disconnect())
