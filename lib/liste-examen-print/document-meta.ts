export function listeExamenReferenceLine(referenceEnvoi: string | null | undefined): string | null {
  const ref = referenceEnvoi?.trim()
  return ref || null
}

export function listeExamenPageLabel(pageIndex: number, totalPages: number): string {
  if (totalPages <= 1) return ""
  return `صفحة ${pageIndex + 1} / ${totalPages}`
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
  if (ref) parts.push(`الرقم ${ref}`)
  return parts.join(" · ")
}

export function listeExamenMultiPageLegalNotice(totalPages: number): string | null {
  if (totalPages <= 1) return null
  return `وثيقة من ${totalPages} صفحات — يُعتد بها مجتمعة فقط (الختم والإمضاء في الصفحة الأخيرة)`
}

export function listeExamenFirstPageMultiHint(totalPages: number): string | null {
  if (totalPages <= 1) return null
  return `يتواصل الجدول في الصفحة/الصفحات التالية — التوقيع والختم في الصفحة ${totalPages}`
}
