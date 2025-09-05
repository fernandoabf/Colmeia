import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    const { error } = this.state
    const { children, fallback } = this.props
    if (error) {
      return fallback || (
        <div className="card" style={{ color: '#ef4444' }}>
          Ocorreu um erro ao carregar esta seção.
        </div>
      )
    }
    return children
  }
}


