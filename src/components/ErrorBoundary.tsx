import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error; info?: ErrorInfo }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ info });
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center bg-white border border-[var(--border)] rounded-2xl shadow-sm p-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-2">Algo salió mal</h2>
          <p className="text-sm text-[var(--ink-mid)] mb-6">
            Esta sección tuvo un problema inesperado. Puedes intentar recargar la página; si el
            error persiste, contacta al soporte.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: '#B5471F' }}
          >
            Recargar página
          </button>
          {this.state.error?.message && (
            <p className="mt-4 text-xs text-gray-400 break-words">{this.state.error.message}</p>
          )}
        </div>
      </div>
    );
  }
}
