"use client"

import { useState } from "react"

type ModuleEditFormProps = {
  initial: {
    titleFr: string
    titleKab: string
    subtitleFr: string
    subtitleKab: string
    descriptionFr: string
    descriptionKab: string
    published: boolean
  }
  action: (formData: FormData) => Promise<{ error?: string; success?: string }>
}

export function ModuleEditForm({ initial, action }: ModuleEditFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setPending(true)
    const result = await action(new FormData(e.currentTarget))
    if (result?.error) setError(result.error)
    if (result?.success) setSuccess(result.success)
    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="admin-form-row">
        <div className="admin-field">
          <label htmlFor="titleFr">Titre FR *</label>
          <input id="titleFr" name="titleFr" required defaultValue={initial.titleFr} />
        </div>
        <div className="admin-field">
          <label htmlFor="titleKab">Titre KAB</label>
          <input id="titleKab" name="titleKab" defaultValue={initial.titleKab} />
        </div>
      </div>
      <div className="admin-form-row">
        <div className="admin-field">
          <label htmlFor="subtitleFr">Sous-titre FR</label>
          <input id="subtitleFr" name="subtitleFr" defaultValue={initial.subtitleFr} />
        </div>
        <div className="admin-field">
          <label htmlFor="subtitleKab">Sous-titre KAB</label>
          <input id="subtitleKab" name="subtitleKab" defaultValue={initial.subtitleKab} />
        </div>
      </div>
      <div className="admin-field">
        <label htmlFor="descriptionFr">Description FR</label>
        <textarea
          id="descriptionFr"
          name="descriptionFr"
          rows={3}
          defaultValue={initial.descriptionFr}
        />
      </div>
      <div className="admin-field">
        <label htmlFor="descriptionKab">Description KAB</label>
        <textarea
          id="descriptionKab"
          name="descriptionKab"
          rows={3}
          defaultValue={initial.descriptionKab}
        />
      </div>
      <label className="admin-checkbox">
        <input type="checkbox" name="published" defaultChecked={initial.published} />
        Module publié
      </label>
      {error && <p className="admin-error">{error}</p>}
      {success && <p className="admin-success">{success}</p>}
      <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer le module"}
      </button>
    </form>
  )
}
