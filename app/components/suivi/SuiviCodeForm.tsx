"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { QrCode } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SuiviCodeForm() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = code.replace(/[\s-]/g, "").toUpperCase()
    if (normalized.length < 6) {
      setError("Code invalide (8 caractères minimum).")
      return
    }
    setError(null)
    setPending(true)
    router.push(`/suivi/${normalized}`)
  }

  return (
    <Card className="w-full border-border/80 shadow-md">
      <CardHeader className="pb-4">
        <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <QrCode className="size-5" aria-hidden />
        </div>
        <CardTitle className="text-base">Code de suivi</CardTitle>
        <CardDescription>
          Saisissez le code reçu par votre auto-école ou scannez le QR sur votre carte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="sr-only">
              Code de suivi
            </Label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="AB12-CD34"
              className="h-12 text-center font-mono text-lg tracking-[0.2em] uppercase"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!error}
            />
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Ouverture…" : "Voir mon dossier"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
