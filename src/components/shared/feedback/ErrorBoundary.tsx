import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/** Catches unhandled React render errors and shows a safe fallback UI */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-[13px] font-medium text-[#24323a] mb-1">
              Terjadi kesalahan
            </p>
            <p className="text-[12px] text-[#64748b] mb-4">
              {this.state.error?.message || 'Komponen tidak dapat dirender.'}
            </p>
            <Button size="sm" variant="outline" onClick={this.handleReset}>
              Coba lagi
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
