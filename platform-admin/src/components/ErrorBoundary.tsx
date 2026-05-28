import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[platform-admin]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="sign-in-shell">
          <div className="sign-in-card">
            <h1>Erreur</h1>
            <p className="sign-in-error">{this.state.error.message}</p>
            <button
              type="button"
              className="auth-btn"
              style={{ width: '100%' }}
              onClick={() => window.location.reload()}
            >
              Recharger
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
