"use server"

import { prisma } from "@/app/_libs/prisma"

export async function getUserRole(supabaseUserId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { supabaseUserId },
    select: { role: true },
  })
  return user?.role ?? null
}
