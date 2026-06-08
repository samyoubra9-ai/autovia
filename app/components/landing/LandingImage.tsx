"use client"

import Image from "next/image"

import { useVitrineMessages } from "@/app/components/vitrine/VitrineLocaleProvider"
import { LANDING_IMAGE_PATHS, type LandingImageKey } from "./landing-data"

type LandingImageProps = {
  imageKey: LandingImageKey
  className?: string
  priority?: boolean
  sizes?: string
}

export function LandingImage({
  imageKey,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: LandingImageProps) {
  const m = useVitrineMessages()
  const img = LANDING_IMAGE_PATHS[imageKey]
  const alt = m.images[imageKey]

  return (
    <Image
      src={img.src}
      alt={alt}
      width={img.width}
      height={img.height}
      className={className}
      priority={priority}
      sizes={sizes}
    />
  )
}
