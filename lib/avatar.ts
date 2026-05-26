/** Avatar texte : première lettre du nom de l'auto-école (pas de logo pour l'instant). */
export function getAutoEcoleAvatarLetter(nom: string): string {
  const trimmed = nom.trim()
  if (!trimmed) return "?"
  return trimmed.charAt(0).toUpperCase()
}

export function getAutoEcoleAvatarColor(nom: string): string {
  let hash = 0
  for (let i = 0; i < nom.length; i++) {
    hash = nom.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 65% 45%)`
}
