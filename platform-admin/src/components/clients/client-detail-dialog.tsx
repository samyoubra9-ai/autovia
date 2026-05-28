import { useState } from 'react'
import { toast } from 'sonner'
import { api, ApiClientError } from '@/lib/api'
import type { SiteAdminAutoEcoleRow } from '@/types/admin'
import { formatClientDate, formatRelativeDate, isNewClient } from '@/lib/clients'
import { AccessBadge } from '@/components/clients/access-badge'
import { ClientActions } from '@/components/clients/client-actions'
import { ClientStatsGrid } from '@/components/clients/client-stats-grid'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  row: SiteAdminAutoEcoleRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (row: SiteAdminAutoEcoleRow) => void
}

export function ClientDetailDialog({ row, open, onOpenChange, onUpdated }: Props) {
  const [notes, setNotes] = useState('')
  const [paidUntil, setPaidUntil] = useState('')
  const [saving, setSaving] = useState(false)

  if (!row) return null

  const syncFields = () => {
    setNotes(row.adminNotes ?? '')
    setPaidUntil(row.paidUntil?.slice(0, 10) ?? '')
  }

  async function saveMeta() {
    setSaving(true)
    try {
      const res = await api.updateAdminAutoEcoleAccess(row.id, {
        adminNotes: notes,
      })
      onUpdated(res.autoEcole)
      toast.success('Enregistré')
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (v) syncFields()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {row.nom}
            {isNewClient(row) && <Badge variant="secondary">Nouveau</Badge>}
          </DialogTitle>
          <DialogDescription>
            Slug : {row.slug} — Inscrit {formatRelativeDate(row.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Statut</p>
            <AccessBadge row={row} />
            <p className="mt-2 text-sm">{row.accessDetail}</p>
            {row.trialDaysLeft != null && row.trialDaysLeft > 0 && (
              <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                {row.hasAccess
                  ? `Essai : ${row.trialDaysLeft} jour(s) restant(s)`
                  : `Essai reprenable : ${row.trialDaysLeft} jour(s) (fin ${formatClientDate(row.trialEndsAt)})`}
              </p>
            )}
            {row.paidDaysLeft != null && row.paidDaysLeft > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Abonnement payé : {row.paidDaysLeft} jour(s) restant(s)
              </p>
            )}
          </div>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Ville :</span> {row.ville ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Tél. :</span> {row.telephone ?? '—'}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Activité
          </p>
          <ClientStatsGrid row={row} />
        </div>

        {row.owner && (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Owner</p>
            <p>
              {row.owner.prenom} {row.owner.nom}
            </p>
            <p className="text-muted-foreground">{row.owner.email}</p>
          </div>
        )}

        <Separator />

        <ClientActions row={row} onUpdated={onUpdated} compact />

        <Separator />

        <div className="space-y-3">
          {row.subscriptionStatus === 'ACTIVE' && (
            <div className="space-y-2">
              <Label htmlFor="paidUntil">Fin abonnement</Label>
              <Input
                id="paidUntil"
                type="date"
                value={paidUntil}
                onChange={(e) => setPaidUntil(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Note interne</Label>
            <Textarea
              id="adminNotes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button size="sm" disabled={saving} onClick={() => void saveMeta()}>
            {saving ? 'Enregistrement…' : 'Enregistrer notes / date'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Créé le {formatClientDate(row.createdAt)} — MAJ {formatClientDate(row.updatedAt)}
        </p>
      </DialogContent>
    </Dialog>
  )
}
