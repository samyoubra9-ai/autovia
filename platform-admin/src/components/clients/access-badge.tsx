import type { SiteAdminAutoEcoleRow } from '@/types/admin'
import { STATUS_LABELS } from '@/lib/clients'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function AccessBadge({ row }: { row: SiteAdminAutoEcoleRow }) {
  const variant = row.hasAccess
    ? row.subscriptionStatus === 'TRIAL'
      ? 'secondary'
      : 'default'
    : row.subscriptionStatus === 'CANCELLED'
      ? 'outline'
      : 'destructive'

  return (
    <div className="flex flex-col gap-1">
      <Badge variant={variant} className={cn(!row.hasAccess && 'bg-destructive/10 text-destructive')}>
        {row.hasAccess ? 'Accès OK' : 'Bloqué'}
      </Badge>
      <span className="text-xs text-muted-foreground">{STATUS_LABELS[row.subscriptionStatus]}</span>
    </div>
  )
}
