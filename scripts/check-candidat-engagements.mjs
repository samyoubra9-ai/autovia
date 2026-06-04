import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL manquant dans .env")
  process.exit(1)
}

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  try {
    await prisma.$queryRaw`SELECT 1 FROM candidat_engagements LIMIT 1`
    console.log("RAW_QUERY: OK")
  } catch (e) {
    console.log("RAW_QUERY_FAIL:", e.message)
  }

  try {
    const rows = await prisma.candidatEngagement.findMany({ take: 1 })
    console.log("PRISMA_FIND: OK", rows.length)
  } catch (e) {
    console.log("PRISMA_FIND_FAIL:", e.message)
  }

  const seance = await prisma.seanceExamen.findFirst({
    select: { id: true, eleveId: true, autoEcoleId: true, statut: true, dateHeure: true },
  })
  if (seance) {
    try {
      await prisma.candidatEngagement.upsert({
        where: {
          type_referenceId: { type: "seance", referenceId: seance.id },
        },
        create: {
          autoEcoleId: seance.autoEcoleId,
          eleveId: seance.eleveId,
          type: "seance",
          referenceId: seance.id,
          statut: "en_attente",
        },
        update: { statut: "en_attente" },
      })
      console.log("PRISMA_UPSERT: OK for seance", seance.id)
    } catch (e) {
      console.log("PRISMA_UPSERT_FAIL:", e.message)
    }
  } else {
    console.log("No seance in DB to test upsert")
  }

  const enums = await prisma.$queryRaw`
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname ILIKE '%engagement%'
    ORDER BY 1
  `
  console.log("PG_ENUMS:", enums)

  await prisma.$disconnect()
  await pool.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
