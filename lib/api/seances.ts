import { ApiError } from "@/lib/api/errors"
import { prisma } from "@/lib/prisma"
import type { Prisma, SeanceStatut, SeanceType } from "@prisma/client"

export const SEANCE_MIN_GAP_MINUTES = 20
const GAP_MS = SEANCE_MIN_GAP_MINUTES * 60 * 1000
const DAY_START_HOUR = 7
const DAY_END_HOUR = 19

export async function assertSeanceHorizonLibre(
  autoEcoleId: string,
  dateHeure: Date,
  excludeId?: string,
) {
  const timeWindow = {
    gt: new Date(dateHeure.getTime() - GAP_MS),
    lt: new Date(dateHeure.getTime() + GAP_MS),
  }
  const baseWhere = {
    autoEcoleId,
    ...(excludeId ? { id: { not: excludeId } } : {}),
    dateHeure: timeWindow,
  }

  let conflict = await prisma.seanceExamen.findFirst({
    where: { ...baseWhere, statut: { notIn: ["annule", "absent"] } },
    include: { eleve: { select: { prenom: true, nom: true } } },
  }).catch(() => null)

  if (!conflict) {
    conflict = await prisma.seanceExamen.findFirst({
      where: baseWhere,
      include: { eleve: { select: { prenom: true, nom: true } } },
    })
  }

  if (conflict) {
    const label = `${conflict.eleve.prenom} ${conflict.eleve.nom}`
    throw new ApiError(
      409,
      `Créneau indisponible : une séance est déjà planifiée pour ${label}. Laissez au moins ${SEANCE_MIN_GAP_MINUTES} minutes entre deux examens.`,
    )
  }
}

export async function assertVehiculeLibre(
  autoEcoleId: string,
  vehiculeId: string,
  dateHeure: Date,
  excludeId?: string,
) {
  const timeWindow = {
    gt: new Date(dateHeure.getTime() - GAP_MS),
    lt: new Date(dateHeure.getTime() + GAP_MS),
  }
  const baseWhere = {
    autoEcoleId,
    vehiculeId,
    ...(excludeId ? { id: { not: excludeId } } : {}),
    dateHeure: timeWindow,
  }

  let conflict = await prisma.seanceExamen.findFirst({
    where: { ...baseWhere, statut: { notIn: ["annule", "absent"] } },
    include: { vehicule: { select: { marque: true, modele: true } } },
  }).catch(() => null)

  if (!conflict) {
    conflict = await prisma.seanceExamen.findFirst({
      where: baseWhere,
      include: { vehicule: { select: { marque: true, modele: true } } },
    })
  }

  if (conflict) {
    const v = conflict.vehicule
    const label = v ? `${v.marque} ${v.modele}` : "ce véhicule"
    throw new ApiError(
      409,
      `Le véhicule ${label} est déjà réservé sur ce créneau (écart minimum ${SEANCE_MIN_GAP_MINUTES} min).`,
    )
  }
}

function isSlotFree(
  candidate: Date,
  occupied: Date[],
): boolean {
  return !occupied.some(
    (d) => Math.abs(d.getTime() - candidate.getTime()) < GAP_MS,
  )
}

export async function findNextFreeSlots(
  autoEcoleId: string,
  around: Date,
  count = 3,
  excludeId?: string,
): Promise<string[]> {
  const dayStart = new Date(around)
  dayStart.setHours(DAY_START_HOUR, 0, 0, 0)
  const dayEnd = new Date(around)
  dayEnd.setHours(DAY_END_HOUR, 0, 0, 0)

  let searchFrom = new Date(Math.max(around.getTime(), Date.now()))
  searchFrom.setSeconds(0, 0)
  const minutes = searchFrom.getMinutes()
  const rounded = Math.ceil(minutes / SEANCE_MIN_GAP_MINUTES) * SEANCE_MIN_GAP_MINUTES
  searchFrom.setMinutes(rounded, 0, 0)

  const rangeEnd = new Date(searchFrom)
  rangeEnd.setDate(rangeEnd.getDate() + 14)

  const rangeWhere = {
    autoEcoleId,
    ...(excludeId ? { id: { not: excludeId } } : {}),
    dateHeure: { gte: dayStart, lte: rangeEnd },
  }
  let existing = await prisma.seanceExamen.findMany({
    where: { ...rangeWhere, statut: { not: "annule" } },
    select: { dateHeure: true },
  }).catch(() => [] as { dateHeure: Date }[])

  if (!existing.length) {
    existing = await prisma.seanceExamen.findMany({
      where: rangeWhere,
      select: { dateHeure: true },
    })
  }
  const occupied = existing.map((s) => s.dateHeure)

  const slots: string[] = []
  let cursor = new Date(searchFrom)

  while (slots.length < count && cursor <= rangeEnd) {
    const hour = cursor.getHours()
    if (hour >= DAY_START_HOUR && hour < DAY_END_HOUR && isSlotFree(cursor, occupied)) {
      slots.push(cursor.toISOString())
      occupied.push(new Date(cursor))
    }
    cursor = new Date(cursor.getTime() + GAP_MS)
  }

  return slots
}

export function resolveDisplayStatut(
  statut: SeanceStatut,
  dateHeure: Date,
): SeanceStatut {
  if (statut === "annule") return "annule"
  if (statut === "planifie" && dateHeure.getTime() < Date.now()) return "passe"
  return statut
}

export type SeanceWithRelations = Prisma.SeanceExamenGetPayload<{
  include: {
    eleve: {
      select: {
        id: true
        identifiant: true
        prenom: true
        nom: true
        categoriePermis: { select: { code: true, libelleFr: true } }
      }
    }
    moniteur: { select: { id: true; prenom: true; nom: true } }
    vehicule: { select: { id: true; marque: true; modele: true; matricule: true } }
  }
}>

export const seanceIncludeBasic = {
  eleve: {
    select: {
      id: true,
      identifiant: true,
      prenom: true,
      nom: true,
      categoriePermis: { select: { code: true, libelleFr: true } },
    },
  },
} as const

export const seanceInclude = {
  ...seanceIncludeBasic,
  moniteur: { select: { id: true, prenom: true, nom: true } },
  vehicule: { select: { id: true, marque: true, modele: true, matricule: true } },
} as const

/** Select sans `type` / relations — si la migration type n'est pas encore appliquée */
const seanceSelectCore = {
  id: true,
  autoEcoleId: true,
  eleveId: true,
  dateHeure: true,
  notes: true,
  messageCandidat: true,
  createdAt: true,
  updatedAt: true,
  eleve: seanceIncludeBasic.eleve,
} as const

function isPrismaIncludeOrColumnError(error: unknown): boolean {
  const msg = String((error as Error)?.message ?? "")
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: string }).code)
      : ""
  return (
    code === "P2022" ||
    msg.includes("Unknown field") ||
    msg.includes("does not exist") ||
    msg.includes("n'existe pas") ||
    msg.includes("SeanceStatut") ||
    msg.includes("moniteur_id") ||
    msg.includes("vehicule_id") ||
    msg.includes("statut") ||
    msg.includes("SeanceType") ||
    msg.includes("type")
  )
}

async function createSeanceRow(
  data: {
    autoEcoleId: string
    eleveId: string
    dateHeure: Date
    notes: string | null
    messageCandidat?: string | null
    moniteurId?: string | null
    vehiculeId?: string | null
    statut?: SeanceStatut
    type?: SeanceType
  },
  include: typeof seanceInclude | typeof seanceIncludeBasic,
) {
  return prisma.seanceExamen.create({
    data: {
      autoEcoleId: data.autoEcoleId,
      eleveId: data.eleveId,
      dateHeure: data.dateHeure,
      notes: data.notes,
      ...(data.messageCandidat !== undefined
        ? { messageCandidat: data.messageCandidat }
        : {}),
      ...(data.moniteurId !== undefined ? { moniteurId: data.moniteurId } : {}),
      ...(data.vehiculeId !== undefined ? { vehiculeId: data.vehiculeId } : {}),
      ...(data.statut !== undefined ? { statut: data.statut } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
    },
    include,
  })
}

export async function listSeancesForTenant(
  autoEcoleId: string,
  dateFilter?: { gte?: Date; lte?: Date },
) {
  const where = {
    autoEcoleId,
    ...(dateFilter ? { dateHeure: dateFilter } : {}),
  }
  const orderBy = { dateHeure: "asc" as const }

  const strategies = [
    () =>
      prisma.seanceExamen.findMany({
        where,
        include: seanceInclude,
        orderBy,
      }),
    () =>
      prisma.seanceExamen.findMany({
        where,
        include: seanceIncludeBasic,
        orderBy,
      }),
    () =>
      prisma.seanceExamen.findMany({
        where,
        select: {
          ...seanceSelectCore,
          statut: true,
          moniteurId: true,
          vehiculeId: true,
          type: true,
          moniteur: seanceInclude.moniteur,
          vehicule: seanceInclude.vehicule,
        },
        orderBy,
      }),
    () =>
      prisma.seanceExamen.findMany({
        where,
        select: {
          ...seanceSelectCore,
          statut: true,
          moniteurId: true,
          vehiculeId: true,
          moniteur: seanceInclude.moniteur,
          vehicule: seanceInclude.vehicule,
        },
        orderBy,
      }),
    () =>
      prisma.seanceExamen.findMany({
        where,
        select: {
          ...seanceSelectCore,
          statut: true,
        },
        orderBy,
      }),
    () =>
      prisma.seanceExamen.findMany({
        where,
        select: seanceSelectCore,
        orderBy,
      }),
  ]

  let lastError: unknown
  for (const run of strategies) {
    try {
      return (await run()) as SeanceWithRelations[]
    } catch (error) {
      if (!isPrismaIncludeOrColumnError(error)) throw error
      lastError = error
    }
  }

  throw lastError
}

export async function createSeanceForTenant(
  data: {
    autoEcoleId: string
    eleveId: string
    type: SeanceType
    dateHeure: Date
    notes: string | null
    messageCandidat?: string | null
    moniteurId?: string | null
    vehiculeId?: string | null
    statut?: SeanceStatut
  },
) {
  const base = {
    autoEcoleId: data.autoEcoleId,
    eleveId: data.eleveId,
    dateHeure: data.dateHeure,
    notes: data.notes,
    messageCandidat: data.messageCandidat ?? null,
  }
  const attempts: Array<{
    moniteurId?: string | null
    vehiculeId?: string | null
    statut?: SeanceStatut
    type?: SeanceType
  }> = [
    {
      type: data.type,
      moniteurId: data.moniteurId ?? null,
      vehiculeId: data.vehiculeId ?? null,
      statut: data.statut ?? "planifie",
    },
    { type: data.type, statut: data.statut ?? "planifie" },
    { type: data.type },
    {},
  ]

  for (const extra of attempts) {
    try {
      return await createSeanceRow({ ...base, ...extra }, seanceInclude)
    } catch (error) {
      if (!isPrismaIncludeOrColumnError(error)) throw error
    }
  }

  return createSeanceRow(base, seanceIncludeBasic)
}

export async function updateSeanceForTenant(
  id: string,
  data: {
    eleveId: string
    type: SeanceType
    dateHeure: Date
    notes: string | null
    messageCandidat?: string | null
    moniteurId?: string | null
    vehiculeId?: string | null
    statut?: SeanceStatut
  },
) {
  const full = {
    eleveId: data.eleveId,
    type: data.type,
    dateHeure: data.dateHeure,
    notes: data.notes,
    ...(data.messageCandidat !== undefined
      ? { messageCandidat: data.messageCandidat }
      : {}),
    moniteurId: data.moniteurId ?? null,
    vehiculeId: data.vehiculeId ?? null,
    statut: data.statut,
  }
  try {
    return await prisma.seanceExamen.update({
      where: { id },
      data: full,
      include: seanceInclude,
    })
  } catch (error) {
    if (!isPrismaIncludeOrColumnError(error)) throw error
    return await prisma.seanceExamen.update({
      where: { id },
      data: {
        eleveId: data.eleveId,
        dateHeure: data.dateHeure,
        notes: data.notes,
        ...(data.messageCandidat !== undefined
          ? { messageCandidat: data.messageCandidat }
          : {}),
      },
      include: seanceIncludeBasic,
    })
  }
}
