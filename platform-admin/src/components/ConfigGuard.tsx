import { getConfigError } from '@/lib/env'

export function ConfigGuard({ children }: { children: React.ReactNode }) {
  const error = getConfigError()
  if (error) {
    return (
      <div className="sign-in-shell">
        <div className="sign-in-card">
          <h1>Configuration requise</h1>
          <p className="sign-in-error">{error}</p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
