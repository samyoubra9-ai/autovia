import { cn } from "@/lib/utils"

export function AppBrand({
  subtitle,
  className,
}: {
  subtitle?: string
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground shadow-sm"
        aria-hidden
      >
        A
      </div>
      <div>
        <p className="text-lg font-bold tracking-tight text-foreground">Autovia</p>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  )
}
