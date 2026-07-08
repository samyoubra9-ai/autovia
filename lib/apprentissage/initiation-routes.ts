import type { InitiationContent } from "./initiation"

export function getInitiationHref() {
  return "/apprendre/initiation"
}

export function getInitiationMetadata(content: InitiationContent) {
  return {
    slug: content.slug,
    title: content.title,
    description: content.description,
  }
}
