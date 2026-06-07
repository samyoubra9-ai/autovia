export function listeExamenReferenceLine(referenceEnvoi: string | null | undefined): string | null {
  const ref = referenceEnvoi?.trim()
  return ref || null
}

export function listeExamenPageLabel(_pageIndex: number, _totalPages: number): string {
  return ""
}

export function listeExamenContinuationTitle(pageIndex: number, totalPages: number): string {
  if (totalPages <= 1) return "قائمة المرشحين — تتمة"
  return `قائمة المرشحين لإمتحان رخصة السياقة — تتمة (${pageIndex + 1}/${totalPages})`
}

export function listeExamenContinuationContext(params: {
  wilaya: string
  centreExamen: string
  dateExamen: string
  referenceEnvoi?: string | null
}): string {
  const parts = [
    `ولاية ${params.wilaya}`,
    `مركز ${params.centreExamen}`,
    `تاريخ الإمتحان ${params.dateExamen}`,
  ]
  const ref = listeExamenReferenceLine(params.referenceEnvoi)
  if (ref) parts.push(ref)
  return parts.join(" · ")
}

export function listeExamenMultiPageLegalNotice(_totalPages: number): string | null {
  return null
}

export function listeExamenFirstPageMultiHint(_totalPages: number): string | null {
  return null
}
