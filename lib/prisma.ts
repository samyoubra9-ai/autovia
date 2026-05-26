import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, type Prisma } from "@prisma/client"

/** Client racine ou client de transaction (`$transaction`). */
export type PrismaDb = PrismaClient | Prisma.TransactionClient
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL doit être défini dans l'environnement (.env).")
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPrismaClient() {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({ connectionString })
  }
  const adapter = new PrismaPg(globalForPrisma.pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

/** Transactions interactives — défaut Prisma 5 s, trop court avec Supabase + listes nombreuses. */
export const PRISMA_TRANSACTION_OPTS = {
  maxWait: 15_000,
  timeout: 30_000,
} as const

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
