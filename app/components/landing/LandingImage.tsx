import Image from "next/image"

import { LANDING_IMAGES } from "./landing-data"

type ImageKey = keyof typeof LANDING_IMAGES

type LandingImageProps = {
  imageKey: ImageKey
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
  const img = LANDING_IMAGES[imageKey]
  return (
    <Image
      src={img.src}
      alt={img.alt}
      width={img.width}
      height={img.height}
      className={className}
      priority={priority}
      sizes={sizes}
    />
  )
}
