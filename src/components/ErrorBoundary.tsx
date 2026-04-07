import React from 'react';
import { Button } from './Button';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  exportLogs = async () => {
    try { await window.api.logs.export(); } catch { /* ignore */ }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="h-full w-full flex items-center justify-center bg-bg p-8">
        <div className="max-w-lg w-full rounded-2xl border border-bg-border-strong bg-bg-card shadow-elevated p-8 text-center">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-danger/10 border border-danger/30 flex items-center justify-center text-danger text-2xl mb-5">
            ⚠
          </div>
          <h1 className="text-base font-semibold text-fg">Fetchwave hit an unexpected error</h1>
          <p className="text-sm text-fg-muted mt-2">
            The interface crashed but your downloads and settings are safe. Reloading the window
            should bring you right back.
          </p>
          <pre className="mt-5 max-h-40 overflow-auto text-left text-[11px] font-mono text-fg-dim bg-bg-soft border border-bg-border rounded-lg p-3">
            {this.state.error.message}
          </pre>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="secondary" onClick={this.exportLogs}>Export logs</Button>
            <Button onClick={this.reload}>Reload window</Button>
          </div>
        </div>
      </div>
    );
  }
}
