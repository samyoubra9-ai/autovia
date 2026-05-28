import { useSearchParams } from 'react-router-dom'
import { useClients } from '@/context/clients-provider'
import { AdminPageHeader } from '@/components/layout/admin-shell'
import { ClientsTable } from '@/components/clients/clients-table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

export function ClientsPage() {
  const { rows, loading, error, refresh, updateRow } = useClients()
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight') ?? undefined

  return (
    <>
      <AdminPageHeader
        title="Auto-écoles"
        description="Liste complète, filtres et gestion des accès backdash."
      />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <ClientsTable
          rows={rows}
          onRowUpdated={(row) => {
            updateRow(row)
            void refresh()
          }}
          highlightId={highlightId}
        />
      )}
    </>
  )
}
