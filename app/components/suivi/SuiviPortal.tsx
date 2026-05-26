import type { SuiviPublicDto } from "@/lib/api/suivi-public"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-DZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleString("fr-DZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const STATUT_LABELS: Record<string, string> = {
  planifie: "Planifié",
  passe: "Passé",
  annule: "Annulé",
}

function formatDzd(n: number) {
  return `${n.toLocaleString("fr-DZ")} DZD`
}

export function SuiviPortal({ data }: { data: SuiviPublicDto }) {
  if (data.parcours.formationTerminee) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {data.autoEcole.nom}
        </p>
        <h1 className="mt-6 text-2xl font-bold text-emerald-800">Félicitations !</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          {data.candidat.prenom} {data.candidat.nom}, vous avez validé votre formation.
          Votre permis est prêt.
        </p>
        <p className="mt-6 max-w-md rounded-xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm leading-relaxed">
          Récupérez votre permis auprès du <strong>moniteur qui vous suit</strong>, ou
          contactez <strong>{data.autoEcole.nom}</strong>.
        </p>
        <p className="mt-8 text-xs text-muted-foreground">
          Utilisez « Autre code » en haut de la page pour changer de dossier.
        </p>
      </div>
    )
  }

  const now = Date.now()
  const upcoming = data.seances.filter(
    (s) => s.statut !== "annule" && new Date(s.dateHeure).getTime() >= now - 30 * 60 * 1000,
  )
  const past = data.seances.filter(
    (s) => s.statut === "passe" || s.statut === "annule" || new Date(s.dateHeure).getTime() < now,
  )

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 pb-10">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {data.autoEcole.nom}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {data.candidat.prenom} {data.candidat.nom}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Permis {data.candidat.categoriePermis} · {data.candidat.identifiant}
        </p>
        <Badge variant="secondary" className="mt-3 font-mono text-sm tracking-wider">
          {data.codeSuiviDisplay}
        </Badge>
      </header>

      <Card
        className={cn(
          data.parcours.formationTerminee &&
            "border-emerald-200 bg-gradient-to-b from-emerald-50/80 to-background",
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Parcours formation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.parcours.formationTerminee ? (
            <div className="space-y-3 text-center">
              <p className="text-lg font-bold text-emerald-800">Félicitations !</p>
              <p className="text-sm text-muted-foreground">
                Vous avez validé votre formation. Vous pouvez récupérer votre permis auprès du{" "}
                <strong>moniteur qui vous suit</strong>, ou contacter{" "}
                <strong>{data.autoEcole.nom}</strong>.
              </p>
            </div>
          ) : (
            <>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Progression</span>
                  <span>{data.parcours.progressionPercent} %</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${data.parcours.progressionPercent}%` }}
                  />
                </div>
              </div>
              <ul className="space-y-3">
                {data.parcours.etapes.map((e) => (
                  <li key={e.code} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        e.validee
                          ? "bg-emerald-500/15 text-emerald-700"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {e.validee ? "✓" : "·"}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        e.validee ? "font-medium text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {e.label}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Paiement permis</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Forfait</dt>
              <dd className="mt-0.5 font-semibold">{formatDzd(data.finance.prixPermis)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payé</dt>
              <dd className="mt-0.5 font-semibold text-emerald-700">
                {formatDzd(data.finance.totalPaye)}
              </dd>
            </div>
            <div className="col-span-2 rounded-lg bg-muted/50 px-3 py-2">
              <dt className="text-muted-foreground">Reste à payer</dt>
              <dd
                className={cn(
                  "mt-0.5 text-lg font-bold",
                  data.finance.resteAPayer > 0 ? "text-amber-700" : "text-emerald-700",
                )}
              >
                {formatDzd(data.finance.resteAPayer)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Séances à venir</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune séance planifiée pour le moment.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3"
                >
                  <p className="font-medium text-foreground">{s.typeLabel}</p>
                  <p className="text-sm capitalize text-muted-foreground">
                    {formatDateTime(s.dateHeure)}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {STATUT_LABELS[s.statutAffichage] ?? s.statutAffichage}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {data.examensOfficiels && data.examensOfficiels.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Examens officiels</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.examensOfficiels.map((ex) => (
                <li key={ex.id} className="rounded-lg border px-4 py-3 text-sm">
                  <p className="font-medium">{ex.natureLabel}</p>
                  <p className="text-muted-foreground">
                    {ex.dateExamen} · {ex.centreExamen} ({ex.wilaya})
                  </p>
                  {ex.resultatLabel ? (
                    <Badge variant="secondary" className="mt-2">
                      {ex.resultatLabel}
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {past.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Historique</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {past.map((s) => (
                <li
                  key={s.id}
                  className="flex justify-between gap-2 py-2.5 text-sm first:pt-0 last:pb-0"
                >
                  <span className="text-muted-foreground">
                    {s.typeLabel} · {formatDateShort(s.dateHeure)}
                  </span>
                  <span className="shrink-0 font-medium text-foreground/70">
                    {STATUT_LABELS[s.statutAffichage] ?? s.statutAffichage}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <p className="text-center text-xs text-muted-foreground">
        Données mises à jour par votre auto-école. Conservez votre code confidentiel.
      </p>
    </div>
  )
}
