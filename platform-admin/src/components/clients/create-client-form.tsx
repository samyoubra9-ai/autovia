import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { api, ApiClientError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Props = {
  onSuccess?: () => void
  redirectTo?: string
}

export function CreateClientForm({ onSuccess, redirectTo = '/clients' }: Props) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await api.createAdminAutoEcole({
        nomAutoEcole: String(fd.get('nomAutoEcole') ?? ''),
        ville: String(fd.get('ville') ?? '') || undefined,
        telephone: String(fd.get('telephone') ?? '') || undefined,
        email: String(fd.get('email') ?? ''),
        password: String(fd.get('password') ?? ''),
        prenom: String(fd.get('prenom') ?? ''),
        nom: String(fd.get('nom') ?? ''),
        adminNotes: String(fd.get('adminNotes') ?? '') || undefined,
      })
      toast.success(res.message)
      onSuccess?.()
      void navigate(redirectTo, { replace: true })
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'Erreur lors de la création.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-2xl space-y-6">
      <Alert>
        <AlertDescription>
          L&apos;accès <strong>backdash</strong> reste bloqué jusqu&apos;à ce que vous débloquiez le
          client (payé) ou activiez un essai de 15 jours.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Auto-école</CardTitle>
          <CardDescription>Informations de l&apos;établissement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomAutoEcole">Nom *</Label>
            <Input id="nomAutoEcole" name="nomAutoEcole" required placeholder="Auto-École Horizon" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ville">Ville</Label>
              <Input id="ville" name="ville" placeholder="Alger" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input id="telephone" name="telephone" type="tel" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compte owner</CardTitle>
          <CardDescription>Identifiants de connexion au backdash</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input id="prenom" name="prenom" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input id="nom" name="nom" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes internes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea id="adminNotes" name="adminNotes" rows={3} placeholder="Optionnel" />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Création…' : 'Créer le compte'}
        </Button>
        <Button type="button" variant="outline" onClick={() => void navigate(-1)}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
