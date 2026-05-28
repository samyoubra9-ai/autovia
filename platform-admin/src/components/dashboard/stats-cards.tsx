import { Building2, Clock, ShieldCheck, ShieldOff, Sparkles, Users } from 'lucide-react'
import type { SiteAdminDashboardStats } from '@/types/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const items: {
  key: keyof SiteAdminDashboardStats
  label: string
  icon: typeof Building2
  hint?: string
}[] = [
  { key: 'total', label: 'Auto-écoles', icon: Building2 },
  { key: 'active', label: 'Accès actifs', icon: ShieldCheck, hint: 'Peuvent utiliser le backdash' },
  { key: 'blocked', label: 'Bloquées', icon: ShieldOff },
  { key: 'trial', label: 'En essai', icon: Clock },
  { key: 'newLast7Days', label: 'Nouveaux (7 j)', icon: Sparkles },
  { key: 'newLast30Days', label: 'Nouveaux (30 j)', icon: Users },
]

type Props = { stats: SiteAdminDashboardStats }

export function StatsCards({ stats }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map(({ key, label, icon: Icon, hint }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats[key]}</div>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
