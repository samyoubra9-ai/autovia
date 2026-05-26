import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function PublicAppShell({
  children,
  className,
  backHref = "/",
  backLabel = "Accueil",
  maxWidth = "md",
}: {
  children: React.ReactNode
  className?: string
  backHref?: string
  backLabel?: string
  maxWidth?: "sm" | "md" | "lg"
}) {
  const maxW =
    maxWidth === "sm" ? "max-w-sm" : maxWidth === "lg" ? "max-w-lg" : "max-w-md"

  return (
    <div className={cn("app-ui min-h-svh bg-muted/40", className)}>
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className={cn("mx-auto flex h-14 items-center justify-between px-4", maxW)}>
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground">
            <Link href={backHref}>
              <ArrowLeft className="size-4" aria-hidden />
              {backLabel}
            </Link>
          </Button>
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Autovia
          </span>
        </div>
      </header>
      <main className={cn("mx-auto w-full px-4 py-8 sm:py-12", maxW)}>{children}</main>
    </div>
  )
}
