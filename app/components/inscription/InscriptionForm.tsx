"use client"

import { useCallback, useEffect, useState } from "react"

import { InscriptionPermisFields } from "@/app/components/inscription/InscriptionPermisFields"
import { InscriptionPhotoField } from "@/app/components/inscription/InscriptionPhotoField"
import { useVitrineMessages } from "@/app/components/vitrine/VitrineLocaleProvider"
import { formatVitrineMessage } from "@/lib/i18n/vitrine-messages"

type PublicAutoEcole = {
  id: string
  nom: string
  ville: string | null
  wilaya: string | null
}

type PublicCategoriePermis = {
  id: string
  code: string
  libelleFr: string
  libelleAr: string | null
  prixPermis: number
}

type FormState = {
  autoEcoleId: string
  categoriePermisId: string
  telephone: string
  prenom: string
  nom: string
  nin: string
  dateNaissance: string
  lieuNaissance: string
  domicile: string
  sexe: "masculin" | "feminin"
  groupeSanguin: string
  mairieEnregistrement: string
  nationalite: string
  prenomPere: string
  nomMere: string
  prenomMere: string
  nomJeuneFille: string
  situationFamiliale: string
  situationProfessionnelle: string
  situationProfessionnelleAutre: string
  nomAr: string
  prenomAr: string
  permisDejaObtenu: boolean
  numeroPermisObtenu: string
  datePermisObtenu: string
  permisDelivrePar: string
  categoriesPermisObtenues: string[]
  _honeypot: string
}

const GROUPE_SANGUIN = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const
const STEP_COUNT = 4

const initialForm: FormState = {
  autoEcoleId: "",
  categoriePermisId: "",
  telephone: "",
  prenom: "",
  nom: "",
  nin: "",
  dateNaissance: "",
  lieuNaissance: "",
  domicile: "",
  sexe: "masculin",
  groupeSanguin: "O+",
  mairieEnregistrement: "",
  nationalite: "Algérienne",
  prenomPere: "",
  nomMere: "",
  prenomMere: "",
  nomJeuneFille: "",
  situationFamiliale: "celibataire",
  situationProfessionnelle: "etudiant",
  situationProfessionnelleAutre: "",
  nomAr: "",
  prenomAr: "",
  permisDejaObtenu: false,
  numeroPermisObtenu: "",
  datePermisObtenu: "",
  permisDelivrePar: "",
  categoriesPermisObtenues: [],
  _honeypot: "",
}

type SuccessState = {
  autoEcoleNom: string
  prenom: string
  nom: string
}

function schoolLabel(ecole: PublicAutoEcole, sep: string) {
  const parts = [ecole.ville, ecole.wilaya].filter(Boolean)
  return parts.length ? `${ecole.nom}${sep}${parts.join(sep)}` : ecole.nom
}

function ageLabel(dateStr: string): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return "—"
  const at = new Date()
  let years = at.getFullYear() - d.getFullYear()
  let months = at.getMonth() - d.getMonth()
  if (at.getDate() < d.getDate()) months--
  if (months < 0) {
    years--
    months += 12
  }
  if (years < 0) return "—"
  if (months === 0) return `${years} ans`
  if (years === 0) return `${months} mois`
  return `${years} ans et ${months} mois`
}

async function uploadPublicPhoto(eleveId: string, nin: string, file: File) {
  const form = new FormData()
  form.append("photo", file)
  form.append("nin", nin)
  const res = await fetch(`/api/v1/public/inscriptions/${eleveId}/photo`, {
    method: "POST",
    body: form,
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error ?? "Échec du téléversement de la photo.")
  }
}

export function InscriptionForm() {
  const m = useVitrineMessages()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialForm)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [schools, setSchools] = useState<PublicAutoEcole[]>([])
  const [schoolsLoading, setSchoolsLoading] = useState(true)
  const [schoolCategories, setSchoolCategories] = useState<PublicCategoriePermis[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessState | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/v1/public/auto-ecoles")
        const data = (await res.json()) as { autoEcoles?: PublicAutoEcole[] }
        if (!cancelled) setSchools(data.autoEcoles ?? [])
      } catch {
        if (!cancelled) setSchools([])
      } finally {
        if (!cancelled) setSchoolsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!form.autoEcoleId) {
      setSchoolCategories([])
      setCategoriesLoading(false)
      return
    }

    let cancelled = false
    setCategoriesLoading(true)
    setSchoolCategories([])

    ;(async () => {
      try {
        const res = await fetch(`/api/v1/public/auto-ecoles/${form.autoEcoleId}/categories`)
        const data = (await res.json()) as { categories?: PublicCategoriePermis[]; error?: string }
        if (cancelled) return
        if (!res.ok) {
          setSchoolCategories([])
          return
        }
        setSchoolCategories(data.categories ?? [])
        setForm((prev) => {
          if (!prev.categoriePermisId) return prev
          const stillValid = (data.categories ?? []).some((c) => c.id === prev.categoriePermisId)
          return stillValid ? prev : { ...prev, categoriePermisId: "" }
        })
      } catch {
        if (!cancelled) setSchoolCategories([])
      } finally {
        if (!cancelled) setCategoriesLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [form.autoEcoleId])

  const patch = useCallback((partial: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...partial }))
    setError(null)
  }, [])

  const validateStep = (index: number): string | null => {
    if (index === 0) {
      if (!form.autoEcoleId) return "Choisissez une auto-école."
      if (categoriesLoading) return m.inscription.loadingCategories
      if (schoolCategories.length === 0) return m.inscription.noCategories
      if (!form.categoriePermisId) return "Choisissez une catégorie de permis."
      return null
    }
    if (index === 1) {
      if (!photoFile) return m.inscription.errors.photoRequired
      if (!form.telephone.trim() || form.telephone.replace(/\D/g, "").length < 9) {
        return "Numéro de téléphone invalide."
      }
      if (!form.prenom.trim() || !form.nom.trim()) return "Nom et prénom requis."
      if (!form.nomAr.trim() || !form.prenomAr.trim()) {
        return m.inscription.errors.arabicNameRequired
      }
      if (form.nin.replace(/\D/g, "").length !== 18) {
        return "Le N.I.N doit comporter 18 chiffres."
      }
      if (!form.dateNaissance) return "Date de naissance requise."
      if (!form.lieuNaissance.trim()) return "Lieu de naissance requis."
      if (!form.domicile.trim()) return "Adresse de domicile requise."
      return null
    }
    if (index === 2) {
      if (!form.permisDejaObtenu) return null
      if (!form.numeroPermisObtenu.trim()) return "Le numéro de permis est requis."
      if (!form.datePermisObtenu) return "La date d'obtention du permis est requise."
      if (!form.permisDelivrePar.trim()) {
        return "Indiquez la mairie ou l'autorité de délivrance."
      }
      if (!form.categoriesPermisObtenues.length) {
        return "Sélectionnez au moins une catégorie obtenue."
      }
      return null
    }
    if (!form.mairieEnregistrement.trim()) {
      return "Mairie d'enregistrement requise."
    }
    if (!form.nationalite.trim()) return "Nationalité requise."
    if (
      form.situationProfessionnelle === "autre" &&
      !form.situationProfessionnelleAutre.trim()
    ) {
      return "Précisez votre situation professionnelle."
    }
    return null
  }

  const goNext = () => {
    const msg = validateStep(step)
    if (msg) {
      setError(msg)
      return
    }
    setStep((s) => Math.min(STEP_COUNT - 1, s + 1))
  }

  const goBack = () => {
    setError(null)
    setStep((s) => Math.max(0, s - 1))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const msg = validateStep(STEP_COUNT - 1)
    if (msg) {
      setError(msg)
      return
    }
    if (!photoFile) {
      setError(m.inscription.errors.photoRequired)
      return
    }

    const situationProfessionnelle =
      form.situationProfessionnelle === "autre"
        ? form.situationProfessionnelleAutre.trim()
        : form.situationProfessionnelle

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/public/inscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          nin: form.nin.replace(/\D/g, ""),
          situationProfessionnelle,
          statutFormation: "code",
          nomAr: form.nomAr.trim(),
          prenomAr: form.prenomAr.trim(),
          prenomPere: form.prenomPere.trim() || null,
          nomMere: form.nomMere.trim() || null,
          prenomMere: form.prenomMere.trim() || null,
          nomJeuneFille: form.sexe === "feminin" ? form.nomJeuneFille.trim() || null : null,
          numeroPermisObtenu: form.permisDejaObtenu ? form.numeroPermisObtenu.trim() : null,
          datePermisObtenu: form.permisDejaObtenu ? form.datePermisObtenu : null,
          permisDelivrePar: form.permisDejaObtenu ? form.permisDelivrePar.trim() : null,
          categoriesPermisObtenues: form.permisDejaObtenu
            ? form.categoriesPermisObtenues
            : [],
        }),
      })
      const data = (await res.json()) as {
        error?: string
        inscription?: SuccessState & { id: string }
      }
      if (!res.ok) {
        setError(data.error ?? m.inscription.errorGeneric)
        return
      }
      if (data.inscription) {
        try {
          await uploadPublicPhoto(data.inscription.id, form.nin.replace(/\D/g, ""), photoFile)
        } catch (photoErr) {
          setError(
            photoErr instanceof Error ? photoErr.message : m.inscription.errors.photoUpload,
          )
          return
        }
        setSuccess({
          autoEcoleNom: data.inscription.autoEcoleNom,
          prenom: data.inscription.prenom,
          nom: data.inscription.nom,
        })
      }
    } catch {
      setError(m.inscription.errorGeneric)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="ds-inscription-success" role="status">
        <div className="ds-inscription-success-icon" aria-hidden>
          ✓
        </div>
        <h3>{m.inscription.successTitle}</h3>
        <p>
          {formatVitrineMessage(m.inscription.successText, {
            autoEcole: success.autoEcoleNom,
          })}
        </p>
        <div className="ds-inscription-success-next">
          <h4>{m.inscription.successNextTitle}</h4>
          <ol>
            {m.inscription.successNextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <p className="ds-inscription-success-hint">{m.inscription.successHint}</p>
      </div>
    )
  }

  const steps = [
    m.inscription.steps.school,
    m.inscription.steps.identity,
    m.inscription.steps.permis,
    m.inscription.steps.civil,
  ]

  const permisLabels = {
    permisDejaObtenu: m.inscription.fields.permisDejaObtenu,
    permisDejaObtenuHint: m.inscription.fields.permisDejaObtenuHint,
    numeroPermisObtenu: m.inscription.fields.numeroPermisObtenu,
    datePermisObtenu: m.inscription.fields.datePermisObtenu,
    permisDelivrePar: m.inscription.fields.permisDelivrePar,
    categoriesPermisObtenues: m.inscription.fields.categoriesPermisObtenues,
  }

  return (
    <form className="ds-inscription-form" onSubmit={onSubmit} noValidate>
      <div className="ds-inscription-steps" aria-label="Étapes">
        {steps.map((label, index) => (
          <span
            key={label}
            className={`ds-inscription-step${index === step ? " ds-inscription-step--active" : ""}${index < step ? " ds-inscription-step--done" : ""}`}
          >
            <span className="ds-inscription-step-num">{index + 1}</span>
            {label}
          </span>
        ))}
      </div>

      <div className="ds-inscription-fields">
        {step === 0 ? (
          <>
            {schoolsLoading ? (
              <p className="ds-inscription-muted">{m.inscription.loadingSchools}</p>
            ) : schools.length === 0 ? (
              <p className="ds-inscription-muted">{m.inscription.noSchools}</p>
            ) : (
              <>
                <label className="ds-inscription-field">
                  <span>{m.inscription.fields.autoEcole}</span>
                  <select
                    required
                    value={form.autoEcoleId}
                    onChange={(e) =>
                      patch({ autoEcoleId: e.target.value, categoriePermisId: "" })
                    }
                  >
                    <option value="">{m.inscription.fields.autoEcolePlaceholder}</option>
                    {schools.map((ecole) => (
                      <option key={ecole.id} value={ecole.id}>
                        {schoolLabel(ecole, m.inscription.schoolLocationSep)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="ds-inscription-field">
                  <span>{m.inscription.fields.categorie}</span>
                  <select
                    required
                    disabled={
                      !form.autoEcoleId ||
                      categoriesLoading ||
                      schoolCategories.length === 0
                    }
                    value={form.categoriePermisId}
                    onChange={(e) => patch({ categoriePermisId: e.target.value })}
                  >
                    <option value="">
                      {!form.autoEcoleId
                        ? m.inscription.categorieSelectSchoolFirst
                        : categoriesLoading
                          ? m.inscription.loadingCategories
                          : schoolCategories.length === 0
                            ? m.inscription.noCategories
                            : m.inscription.fields.categoriePlaceholder}
                    </option>
                    {schoolCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.libelleFr} ({cat.code})
                      </option>
                    ))}
                  </select>
                  {form.autoEcoleId && !categoriesLoading && schoolCategories.length === 0 ? (
                    <span className="ds-inscription-muted">{m.inscription.noCategories}</span>
                  ) : null}
                </label>
              </>
            )}
          </>
        ) : null}

        {step === 1 ? (
          <>
            <InscriptionPhotoField
              prenom={form.prenom}
              nom={form.nom}
              label={m.inscription.fields.photo}
              hint={m.inscription.fields.photoHint}
              changeLabel={m.inscription.fields.photoChange}
              removeLabel={m.inscription.fields.photoRemove}
              disabled={submitting}
              file={photoFile}
              onFileChange={setPhotoFile}
            />
            <label className="ds-inscription-field">
              <span>{m.inscription.fields.telephone}</span>
              <input
                type="tel"
                autoComplete="tel"
                value={form.telephone}
                onChange={(e) => patch({ telephone: e.target.value })}
              />
            </label>
            <div className="ds-inscription-row">
              <label className="ds-inscription-field">
                <span>{m.inscription.fields.nom}</span>
                <input value={form.nom} onChange={(e) => patch({ nom: e.target.value })} />
              </label>
              <label className="ds-inscription-field">
                <span>{m.inscription.fields.prenom}</span>
                <input
                  value={form.prenom}
                  onChange={(e) => patch({ prenom: e.target.value })}
                />
              </label>
            </div>
            <div className="ds-inscription-row">
              <label className="ds-inscription-field">
                <span>{m.inscription.fields.nomAr}</span>
                <input
                  required
                  value={form.nomAr}
                  onChange={(e) => patch({ nomAr: e.target.value })}
                  dir="rtl"
                />
              </label>
              <label className="ds-inscription-field">
                <span>{m.inscription.fields.prenomAr}</span>
                <input
                  required
                  value={form.prenomAr}
                  onChange={(e) => patch({ prenomAr: e.target.value })}
                  dir="rtl"
                />
              </label>
            </div>
            <label className="ds-inscription-field">
              <span>{m.inscription.fields.nin}</span>
              <input
                inputMode="numeric"
                maxLength={18}
                className="ds-inscription-nin"
                value={form.nin}
                onChange={(e) =>
                  patch({ nin: e.target.value.replace(/\D/g, "").slice(0, 18) })
                }
              />
              <span className="ds-inscription-muted">
                {form.nin.length}/18 {m.inscription.fields.ninDigits}
              </span>
            </label>
            <div className="ds-inscription-row">
              <label className="ds-inscription-field">
                <span>{m.inscription.fields.dateNaissance}</span>
                <input
                  type="date"
                  value={form.dateNaissance}
                  onChange={(e) => patch({ dateNaissance: e.target.value })}
                />
              </label>
              <label className="ds-inscription-field">
                <span>{m.inscription.fields.age}</span>
                <input readOnly disabled value={ageLabel(form.dateNaissance)} />
                <span className="ds-inscription-muted">{m.inscription.fields.ageHint}</span>
              </label>
            </div>
            <label className="ds-inscription-field">
              <span>{m.inscription.fields.lieuNaissance}</span>
              <input
                value={form.lieuNaissance}
                onChange={(e) => patch({ lieuNaissance: e.target.value })}
              />
            </label>
            <label className="ds-inscription-field">
              <span>{m.inscription.fields.domicile}</span>
              <input
                value={form.domicile}
                onChange={(e) => patch({ domicile: e.target.value })}
              />
            </label>
            <fieldset className="ds-inscription-field">
              <legend>{m.inscription.fields.sexe}</legend>
              <div className="ds-inscription-radio-row">
                <label>
                  <input
                    type="radio"
                    name="sexe"
                    checked={form.sexe === "masculin"}
                    onChange={() => patch({ sexe: "masculin", nomJeuneFille: "" })}
                  />
                  {m.inscription.sexe.masculin}
                </label>
                <label>
                  <input
                    type="radio"
                    name="sexe"
                    checked={form.sexe === "feminin"}
                    onChange={() => patch({ sexe: "feminin" })}
                  />
                  {m.inscription.sexe.feminin}
                </label>
              </div>
            </fieldset>
            {form.sexe === "feminin" ? (
              <label className="ds-inscription-field">
                <span>{m.inscription.fields.nomJeuneFille}</span>
                <input
                  value={form.nomJeuneFille}
                  onChange={(e) => patch({ nomJeuneFille: e.target.value })}
                />
              </label>
            ) : null}
            <label className="ds-inscription-field">
              <span>{m.inscription.fields.groupeSanguin}</span>
              <select
                value={form.groupeSanguin}
                onChange={(e) => patch({ groupeSanguin: e.target.value })}
              >
                {GROUPE_SANGUIN.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {step === 2 ? (
          <InscriptionPermisFields
            value={{
              permisDejaObtenu: form.permisDejaObtenu,
              numeroPermisObtenu: form.numeroPermisObtenu,
              datePermisObtenu: form.datePermisObtenu,
              permisDelivrePar: form.permisDelivrePar,
              categoriesPermisObtenues: form.categoriesPermisObtenues,
            }}
            labels={permisLabels}
            onChange={(partial) => patch(partial)}
          />
        ) : null}

        {step === 3 ? (
          <>
            <label className="ds-inscription-field">
              <span>{m.inscription.fields.mairie}</span>
              <input
                value={form.mairieEnregistrement}
                onChange={(e) => patch({ mairieEnregistrement: e.target.value })}
              />
            </label>
            <label className="ds-inscription-field">
              <span>{m.inscription.fields.nationalite}</span>
              <input
                value={form.nationalite}
                onChange={(e) => patch({ nationalite: e.target.value })}
              />
            </label>
            <label className="ds-inscription-field">
              <span>{m.inscription.fields.prenomPere}</span>
              <input
                value={form.prenomPere}
                onChange={(e) => patch({ prenomPere: e.target.value })}
              />
            </label>
            <div className="ds-inscription-row">
              <label className="ds-inscription-field">
                <span>{m.inscription.fields.nomMere}</span>
                <input
                  value={form.nomMere}
                  onChange={(e) => patch({ nomMere: e.target.value })}
                />
              </label>
              <label className="ds-inscription-field">
                <span>{m.inscription.fields.prenomMere}</span>
                <input
                  value={form.prenomMere}
                  onChange={(e) => patch({ prenomMere: e.target.value })}
                />
              </label>
            </div>
            <div className="ds-inscription-row">
              <label className="ds-inscription-field">
                <span>{m.inscription.fields.situationFamiliale}</span>
                <select
                  value={form.situationFamiliale}
                  onChange={(e) => patch({ situationFamiliale: e.target.value })}
                >
                  {Object.entries(m.inscription.situationFamiliale).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ds-inscription-field">
                <span>{m.inscription.fields.situationProfessionnelle}</span>
                <select
                  value={form.situationProfessionnelle}
                  onChange={(e) => patch({ situationProfessionnelle: e.target.value })}
                >
                  {Object.entries(m.inscription.situationProfessionnelle).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {form.situationProfessionnelle === "autre" ? (
              <label className="ds-inscription-field">
                <span>{m.inscription.fields.situationProfessionnelleAutre}</span>
                <input
                  value={form.situationProfessionnelleAutre}
                  onChange={(e) =>
                    patch({ situationProfessionnelleAutre: e.target.value })
                  }
                />
              </label>
            ) : null}
          </>
        ) : null}
      </div>

      <input
        type="text"
        name="_honeypot"
        value={form._honeypot}
        onChange={(e) => patch({ _honeypot: e.target.value })}
        className="ds-inscription-honeypot"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />

      {error ? (
        <p className="ds-inscription-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="ds-inscription-actions">
        {step > 0 ? (
          <button type="button" className="ds-btn ds-btn-secondary" onClick={goBack}>
            {m.inscription.actions.back}
          </button>
        ) : (
          <span />
        )}
        {step < STEP_COUNT - 1 ? (
          <button
            type="button"
            className="ds-btn ds-btn-primary"
            onClick={goNext}
            disabled={schoolsLoading || (step === 0 && schools.length === 0)}
          >
            {m.inscription.actions.next}
          </button>
        ) : (
          <button type="submit" className="ds-btn ds-btn-primary" disabled={submitting}>
            {submitting ? m.inscription.actions.submitting : m.inscription.actions.submit}
          </button>
        )}
      </div>
    </form>
  )
}
