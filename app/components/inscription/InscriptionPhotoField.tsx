"use client"

import { useEffect, useRef, useState } from "react"

type InscriptionPhotoFieldProps = {
  prenom: string
  nom: string
  label: string
  hint: string
  changeLabel: string
  removeLabel: string
  disabled?: boolean
  file: File | null
  onFileChange: (file: File | null) => void
}

const MAX_MB = 5

export function InscriptionPhotoField({
  prenom,
  nom,
  label,
  hint,
  changeLabel,
  removeLabel,
  disabled,
  file,
  onFileChange,
}: InscriptionPhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const initials =
    `${prenom?.trim().charAt(0) ?? ""}${nom?.trim().charAt(0) ?? ""}`.toUpperCase() || "?"

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pickFile = () => inputRef.current?.click()

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    e.target.value = ""
    if (!picked) return
    if (picked.size > MAX_MB * 1024 * 1024) {
      window.alert(`La photo ne doit pas dépasser ${MAX_MB} Mo.`)
      return
    }
    if (!picked.type.match(/^image\/(jpeg|png|webp)$/)) {
      window.alert("Format accepté : JPEG, PNG ou WebP.")
      return
    }
    onFileChange(picked)
  }

  return (
    <div className="ds-inscription-photo">
      <span className="ds-inscription-photo-label">{label}</span>
      <div className="ds-inscription-photo-row">
        <div className="ds-inscription-photo-preview" aria-hidden>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="" />
          ) : (
            <span className="ds-inscription-photo-initials">{initials}</span>
          )}
        </div>
        <div className="ds-inscription-photo-actions">
          <p className="ds-inscription-muted">{hint}</p>
          <div className="ds-inscription-photo-btns">
            <button
              type="button"
              className="ds-btn ds-btn-secondary ds-btn-sm"
              onClick={pickFile}
              disabled={disabled}
            >
              {file ? changeLabel : label}
            </button>
            {file ? (
              <button
                type="button"
                className="ds-btn ds-btn-secondary ds-btn-sm"
                onClick={() => onFileChange(null)}
                disabled={disabled}
              >
                {removeLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="ds-inscription-honeypot"
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  )
}
