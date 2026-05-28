import { GraduationCap, Car, ClipboardList, Users, UserCircle } from 'lucide-react'
import type { SiteAdminAutoEcoleRow } from '@/types/admin'

export function ClientStatsGrid({ row }: { row: SiteAdminAutoEcoleRow }) {
  const items = [
    { label: 'Élèves', value: row.counts.eleves, icon: GraduationCap },
    { label: 'Moniteurs', value: row.counts.moniteurs, icon: UserCircle },
    { label: 'Véhicules', value: row.counts.vehicules, icon: Car },
    { label: 'Listes examen', value: row.counts.listesExamen, icon: ClipboardList },
    { label: 'Comptes', value: row.counts.users, icon: Users },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5"
        >
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold tabular-nums">{value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
