import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { Eye, Search } from 'lucide-react'
import type { ClientFilter, SiteAdminAutoEcoleRow } from '@/types/admin'
import { filterClients, formatClientDate, formatRelativeDate, isNewClient } from '@/lib/clients'
import { AccessBadge } from '@/components/clients/access-badge'
import { ClientActions } from '@/components/clients/client-actions'
import { ClientDetailDialog } from '@/components/clients/client-detail-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const FILTERS: { value: ClientFilter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'new7', label: 'Nouveaux 7 j' },
  { value: 'active', label: 'Actives' },
  { value: 'trial', label: 'Essai' },
  { value: 'blocked', label: 'Bloquées' },
  { value: 'expired', label: 'Expirées' },
]

type Props = {
  rows: SiteAdminAutoEcoleRow[]
  onRowUpdated: (row: SiteAdminAutoEcoleRow) => void
  highlightId?: string
}

export function ClientsTable({ rows, onRowUpdated, highlightId }: Props) {
  const [filter, setFilter] = useState<ClientFilter>('all')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<SiteAdminAutoEcoleRow | null>(null)

  const filtered = useMemo(
    () => filterClients(rows, filter, search),
    [rows, filter, search],
  )

  useEffect(() => {
    if (!highlightId) return
    const row = rows.find((r) => r.id === highlightId)
    if (row) setDetail(row)
  }, [highlightId, rows])

  function handleUpdated(updated: SiteAdminAutoEcoleRow) {
    onRowUpdated(updated)
    if (detail?.id === updated.id) setDetail(updated)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Auto-écoles</CardTitle>
          <CardDescription>
            {filtered.length} sur {rows.length} — cliquez sur une ligne pour le détail et les actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={filter}
              onValueChange={(v) => setFilter(v as ClientFilter)}
              className="w-full sm:w-auto"
            >
              <TabsList className="flex h-auto flex-wrap">
                {FILTERS.map((f) => (
                  <TabsTrigger key={f.value} value={f.value} className="text-xs sm:text-sm">
                    {f.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher nom, ville, e-mail…"
                className="ps-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Établissement</TableHead>
                <TableHead className="text-center">Élèves</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Aucun résultat pour ce filtre.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      'cursor-pointer',
                      highlightId === row.id && 'bg-primary/10 ring-1 ring-primary/30',
                    )}
                    onClick={() => setDetail(row)}
                  >
                    <TableCell>
                      <div className="font-medium">{row.nom}</div>
                      <div className="text-xs text-muted-foreground">{row.ville ?? '—'}</div>
                      {isNewClient(row) && (
                        <Badge variant="secondary" className="mt-1">
                          Nouveau
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex min-w-8 justify-center rounded-md bg-muted px-2 py-0.5 text-sm font-semibold tabular-nums">
                        {row.counts.eleves}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.owner ? (
                        <>
                          <div>
                            {row.owner.prenom} {row.owner.nom}
                          </div>
                          <div className="text-xs text-muted-foreground">{row.owner.email}</div>
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <AccessBadge row={row} />
                      {row.canResumeTrial && !row.hasAccess && (
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                          {row.trialDaysLeft} j d&apos;essai à reprendre
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatClientDate(row.createdAt)}
                      <div className="text-xs">{formatRelativeDate(row.createdAt)}</div>
                    </TableCell>
                    <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetail(row)}
                          title="Détail"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <ClientActions row={row} onUpdated={handleUpdated} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ClientDetailDialog
        row={detail}
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
        onUpdated={handleUpdated}
      />
    </>
  )
}
