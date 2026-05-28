import { Outlet } from 'react-router-dom'
import { AdminShell } from '@/components/layout/admin-shell'

/** Shell commun (sidebar, header, notifications). */
export function AdminAppLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  )
}
