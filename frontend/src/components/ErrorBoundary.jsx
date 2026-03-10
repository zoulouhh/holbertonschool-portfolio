import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Frontend crash:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
          <div className="max-w-lg w-full bg-slate-800 border border-slate-700 rounded-xl p-6 text-center">
            <h1 className="text-xl font-semibold text-white mb-2">Une erreur est survenue</h1>
            <p className="text-slate-400 text-sm mb-4">
              L'application a rencontré une erreur inattendue. Recharge la page pour continuer.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors"
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
