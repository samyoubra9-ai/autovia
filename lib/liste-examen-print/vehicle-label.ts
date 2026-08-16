const VEHICLE_ORDINAL_AR = [
  "الأولى",
  "الثانية",
  "الثالثة",
  "الرابعة",
  "الخامسة",
  "السادسة",
  "السابعة",
  "الثامنة",
  "التاسعة",
  "العاشرة",
  "الحادية عشرة",
  "الثانية عشرة",
  "الثالثة عشرة",
  "الرابعة عشرة",
  "الخامسة عشرة",
] as const

export function vehicleLabelAr(sectionIndex: number): string {
  const ord = VEHICLE_ORDINAL_AR[sectionIndex]
  if (ord) return `المركبة ${ord}`
  return `المركبة ${sectionIndex + 1}`
}
