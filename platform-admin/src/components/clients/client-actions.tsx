import { useState } from 'react'
import {
  Ban,
  Calendar,
  CalendarPlus,
  MoreHorizontal,
  RotateCcw,
  Sparkles,
  Unlock,
} from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiClientError } from '@/lib/api'
import type { SiteAdminAccessAction, SiteAdminAutoEcoleRow } from '@/types/admin'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Props = {
  row: SiteAdminAutoEcoleRow
  onUpdated: (row: SiteAdminAutoEcoleRow) => void
  compact?: boolean
}

export function ClientActions({ row, onUpdated, compact }: Props) {
  const [pending, setPending] = useState(false)

  async function run(
    action: SiteAdminAccessAction,
    extra?: { paidUntil?: string | null; extendTrialDays?: number; adminNotes?: string },
  ) {
    setPending(true)
    try {
      const res = await api.updateAdminAutoEcoleAccess(row.id, { action, ...extra })
      onUpdated(res.autoEcole)
      toast.success(res.message)
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Erreur')
    } finally {
      setPending(false)
    }
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {row.canResumeTrial && (
          <Button
            size="sm"
            variant="default"
            disabled={pending}
            onClick={() => void run('resume_trial')}
          >
            <RotateCcw className="size-3.5" />
            Reprendre l&apos;essai ({row.trialDaysLeft} j)
          </Button>
        )}
        {row.canResumePaid && !row.hasAccess && (
          <Button size="sm" disabled={pending} onClick={() => void run('resume_paid')}>
            <Unlock className="size-3.5" />
            Reprendre payé ({row.paidDaysLeft} j)
          </Button>
        )}
        <Button size="sm" variant="outline" disabled={pending} onClick={() => void run('unlock_paid')}>
          <Unlock className="size-3.5" />
          Débloquer (payé)
        </Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => void run('trial_new')}>
          <Sparkles className="size-3.5" />
          Nouvel essai 15 j
        </Button>
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => void run('block')}>
          <Ban className="size-3.5" />
          Bloquer
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={pending}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Accès backdash</DropdownMenuLabel>
        {row.canResumeTrial && (
          <DropdownMenuItem onClick={() => void run('resume_trial')}>
            <RotateCcw className="size-4" />
            Reprendre l&apos;essai ({row.trialDaysLeft} j restants)
          </DropdownMenuItem>
        )}
        {row.canResumePaid && !row.hasAccess && (
          <DropdownMenuItem onClick={() => void run('resume_paid')}>
            <Unlock className="size-4" />
            Reprendre abonnement payé
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => void run('unlock_paid')}>
          <Unlock className="size-4" />
          Débloquer (payé / sans date)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void run('trial_new')}>
          <Sparkles className="size-4" />
          Nouvel essai 15 jours
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            const n = window.prompt('Prolonger l\'essai de combien de jours ?', '7')
            if (n) void run('extend_trial', { extendTrialDays: Number(n) || 7 })
          }}
        >
          <CalendarPlus className="size-4" />
          Prolonger l&apos;essai…
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void run('block')}>
          <Ban className="size-4" />
          Bloquer (conserve les jours restants)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void run('cancel')}>
          Annuler le compte
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            const v = window.prompt('Date fin abonnement (AAAA-MM-JJ)', row.paidUntil?.slice(0, 10) ?? '')
            if (v !== null) void run('unlock_paid', { paidUntil: v || null })
          }}
        >
          <Calendar className="size-4" />
          Débloquer avec date de fin…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
