import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, type Prisma } from "@prisma/client"
import { Pool } from "pg"

/** Client racine ou client de transaction (`$transaction`). */
export type PrismaDb = PrismaClient | Prisma.TransactionClient

function sanitizeConnectionString(raw: string): string {
  let s = raw.trim().replace(/[\r\n]/g, "")
  s = s.replace(/^DATABASE_URL\s*=\s*/i, "")
  s = s.replace(/^['"]+|['"]+$/g, "").trim()
  // sslmode=require → Node 18+ vérifie la CA → P1011 self-signed sur le pooler Supabase.
  s = s.replace(/[?&]sslmode=[^&]*/gi, "")
  s = s.replace(/\?&/g, "?").replace(/&&/g, "&").replace(/[?&]$/, "")
  return s
}

function createPrismaClient(): PrismaClient {
  const raw = process.env.DATABASE_URL
  if (!raw?.trim()) {
    throw new Error("DATABASE_URL doit être défini (Vercel → Environment Variables).")
  }

  const connectionString = sanitizeConnectionString(raw)

  try {
    const host = new URL(connectionString).hostname
    console.info("[prisma] host=", host)
  } catch {
    console.info("[prisma] DATABASE_URL fournie (format non URI standard, pg l’accepte tel quel)")
  }

  const pool = new Pool({
    connectionString,
    max: process.env.VERCEL ? 1 : 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
    ssl: { rejectUnauthorized: false },
  })
  return new PrismaClient({ adapter: new PrismaPg(pool) })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

/**
 * Proxy : n’ouvre pas Postgres au `import` (le build Vercel « « Collecting page data »).
 * La connexion se fait au premier appel API.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma()
    const value = Reflect.get(client, prop, receiver)
    return typeof value === "function" ? value.bind(client) : value
  },
})

/** Transactions interactives — défaut Prisma 5 s, trop court avec Supabase + listes nombreuses. */
export const PRISMA_TRANSACTION_OPTS = {
  maxWait: 15_000,
  timeout: 30_000,
} as const
