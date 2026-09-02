import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, type Prisma } from "@prisma/client"
import { Pool } from "pg"

/** Client racine ou client de transaction (`$transaction`). */
export type PrismaDb = PrismaClient | Prisma.TransactionClient

function resolveConnectionString(): string {
  const raw = process.env.DATABASE_URL?.trim()
  if (!raw) {
    throw new Error("DATABASE_URL doit être défini (Vercel → Environment Variables).")
  }

  const unquoted = raw.replace(/^['"]+|['"]+$/g, "").trim()

  let parsed: URL
  try {
    parsed = new URL(unquoted)
  } catch {
    throw new Error(
      "DATABASE_URL invalide. Collez l’URI Transaction pooler Supabase (port 6543), sans guillemets.",
    )
  }

  const host = parsed.hostname
  const onVercel = Boolean(process.env.VERCEL)
  const badHost =
    !host ||
    host === "base" ||
    (onVercel && (host === "localhost" || host === "127.0.0.1" || host === "db"))
  if (badHost) {
    throw new Error(
      `DATABASE_URL a pour hôte « ${host || "(vide)"} ». Sur Vercel, collez l’URI Transaction pooler Supabase (port 6543), sans guillemets : postgresql://postgres.<PROJECT>:…@aws-0-….pooler.supabase.com:6543/postgres?pgbouncer=true`,
    )
  }

  if (!parsed.searchParams.has("sslmode")) {
    parsed.searchParams.set("sslmode", "require")
  }

  return parsed.toString()
}

const connectionString = resolveConnectionString()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

function createPrismaClient() {
  if (!globalForPrisma.pool) {
    try {
      const host = new URL(connectionString).hostname
      console.info("[prisma] host=", host)
    } catch {
      /* ignore */
    }
    globalForPrisma.pool = new Pool({
      connectionString,
      max: process.env.VERCEL ? 1 : 10,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 15_000,
      ssl: { rejectUnauthorized: false },
    })
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
