import { useClients } from '@/context/clients-provider'
import { AdminPageHeader } from '@/components/layout/admin-shell'
import { CreateClientForm } from '@/components/clients/create-client-form'

export function NewClientPage() {
  const { refresh } = useClients()

  return (
    <>
      <AdminPageHeader
        title="Nouveau compte auto-école"
        description="Création de l'établissement et du compte propriétaire (owner)."
      />
      <CreateClientForm onSuccess={() => void refresh()} redirectTo="/clients" />
    </>
  )
}
