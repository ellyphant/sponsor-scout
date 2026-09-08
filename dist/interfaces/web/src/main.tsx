import '@mindstudio-ai/interface';
import { Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './global.css';
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <main className="fatal-error">
          <span className="eyebrow">SPONSOR SCOUT</span>
          <h1>The console couldn't render.</h1>
          <p>Your saved work remains in the database.</p>
          <pre>{this.state.error.message}</pre>
          <button className="button primary" onClick={() => window.location.reload()}>
            Reload console
          </button>
        </main>
      );
    return this.props.children;
  }
}
// Preserve the React root when Vite re-evaluates this entry during development.
// A production page still creates exactly one fresh root.
const root: ReturnType<typeof createRoot> =
  import.meta.hot?.data.reactRoot ?? createRoot(document.getElementById('root')!);
if (import.meta.hot) import.meta.hot.data.reactRoot = root;
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
