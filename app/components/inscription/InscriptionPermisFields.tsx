"use client"

import { CATEGORIES_PERMIS_OBTENUS } from "@/lib/api/permis-obtenu"

type PermisState = {
  permisDejaObtenu: boolean
  numeroPermisObtenu: string
  datePermisObtenu: string
  permisDelivrePar: string
  categoriesPermisObtenues: string[]
}

type Labels = {
  permisDejaObtenu: string
  permisDejaObtenuHint: string
  numeroPermisObtenu: string
  datePermisObtenu: string
  permisDelivrePar: string
  categoriesPermisObtenues: string
}

type InscriptionPermisFieldsProps = {
  value: PermisState
  labels: Labels
  onChange: (partial: Partial<PermisState>) => void
}

export function InscriptionPermisFields({
  value,
  labels,
  onChange,
}: InscriptionPermisFieldsProps) {
  const toggleCategory = (code: string) => {
    const selected = value.categoriesPermisObtenues
    const next = selected.includes(code)
      ? selected.filter((c) => c !== code)
      : [...selected, code]
    onChange({ categoriesPermisObtenues: next })
  }

  return (
    <div className="ds-inscription-permis-block">
      <label className="ds-inscription-checkbox-row">
        <input
          type="checkbox"
          checked={value.permisDejaObtenu}
          onChange={(e) => {
            const on = e.target.checked
            onChange(
              on
                ? { permisDejaObtenu: true }
                : {
                    permisDejaObtenu: false,
                    numeroPermisObtenu: "",
                    datePermisObtenu: "",
                    permisDelivrePar: "",
                    categoriesPermisObtenues: [],
                  },
            )
          }}
        />
        <span>
          <strong>{labels.permisDejaObtenu}</strong>
          <span className="ds-inscription-muted">{labels.permisDejaObtenuHint}</span>
        </span>
      </label>

      {value.permisDejaObtenu ? (
        <div className="ds-inscription-permis-details">
          <label className="ds-inscription-field">
            <span>{labels.numeroPermisObtenu}</span>
            <input
              value={value.numeroPermisObtenu}
              onChange={(e) => onChange({ numeroPermisObtenu: e.target.value })}
            />
          </label>
          <label className="ds-inscription-field">
            <span>{labels.datePermisObtenu}</span>
            <input
              type="date"
              value={value.datePermisObtenu}
              onChange={(e) => onChange({ datePermisObtenu: e.target.value })}
            />
          </label>
          <label className="ds-inscription-field">
            <span>{labels.permisDelivrePar}</span>
            <input
              value={value.permisDelivrePar}
              onChange={(e) => onChange({ permisDelivrePar: e.target.value })}
              placeholder="ex. Mairie de Alger Centre"
            />
          </label>
          <fieldset className="ds-inscription-field">
            <legend>{labels.categoriesPermisObtenues}</legend>
            <div className="ds-inscription-checkbox-grid">
              {CATEGORIES_PERMIS_OBTENUS.map((code) => (
                <label key={code} className="ds-inscription-checkbox-chip">
                  <input
                    type="checkbox"
                    checked={value.categoriesPermisObtenues.includes(code)}
                    onChange={() => toggleCategory(code)}
                  />
                  <span>{code}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}
    </div>
  )
}
