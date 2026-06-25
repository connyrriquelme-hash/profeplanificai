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
      <div className="error-boundary">
        <h2>Error en la aplicación</h2>
        <pre>{this.state.error?.message}</pre>
        <pre style={{ fontSize: 11, maxHeight: 300, overflow: 'auto' }}>{this.state.info?.componentStack}</pre>
        <button onClick={() => { this.setState({ hasError: false, error: undefined }); window.location.reload(); }}>
          Recargar página
        </button>
      </div>
    );
  }
}
