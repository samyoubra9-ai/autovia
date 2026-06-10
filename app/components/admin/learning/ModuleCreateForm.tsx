"use client"

import { useState } from "react"

type ModuleCreateFormProps = {
  existingSlugs: string[]
  nextStep: number
  action: (formData: FormData) => Promise<{ error?: string; success?: string }>
}

export function ModuleCreateForm({
  existingSlugs,
  nextStep,
  action,
}: ModuleCreateFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const result = await action(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="admin-form-row">
        <div className="admin-field">
          <label htmlFor="titleFr">Titre FR *</label>
          <input id="titleFr" name="titleFr" required />
        </div>
        <div className="admin-field">
          <label htmlFor="slug">Slug URL</label>
          <input id="slug" name="slug" placeholder="ex. fondamentaux" />
        </div>
      </div>
      <div className="admin-form-row">
        <div className="admin-field admin-field--sm">
          <label htmlFor="step">Étape *</label>
          <input
            id="step"
            name="step"
            type="number"
            min={1}
            required
            defaultValue={nextStep}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="unlockAfterSlug">Débloqué après (slug)</label>
          <select id="unlockAfterSlug" name="unlockAfterSlug" defaultValue="">
            <option value="">— Premier module (libre) —</option>
            {existingSlugs.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="admin-field">
        <label htmlFor="subtitleFr">Sous-titre FR</label>
        <input id="subtitleFr" name="subtitleFr" />
      </div>
      <div className="admin-field">
        <label htmlFor="descriptionFr">Description FR</label>
        <textarea id="descriptionFr" name="descriptionFr" rows={3} />
      </div>
      <label className="admin-checkbox">
        <input type="checkbox" name="published" defaultChecked />
        Module publié
      </label>
      {error && <p className="admin-error">{error}</p>}
      <button type="submit" className="admin-btn admin-btn--primary" disabled={pending}>
        {pending ? "Création…" : "Créer le module"}
      </button>
    </form>
  )
}
