// Prisma 7 + Supabase pooler:
// - Runtime (PrismaClient via PrismaPg adapter) → DATABASE_URL (transaction-mode pooler 6543)
// - Migrations / introspection (CLI commands) → DIRECT_URL (direct connection 5432)
// transaction-mode pooler は prepared statements を無効化するため migrate 時には使えない
import "dotenv/config";
import { defineConfig } from "prisma/config";

const directUrl = process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"]!;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
});
