import { Component } from "react";
import { SITE } from "../lib/site";

// Last line of defence: if a page throws while rendering, show a calm
// recovery screen instead of a blank white page.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    // A new deploy can remove the old JS chunks a long-open tab still asks
    // for; a reload picks up the new ones.
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-6 sm:p-8 text-center">
          <h1 className="font-display font-bold text-2xl text-ink">Something went wrong</h1>
          <p className="mt-3 text-slate-500">
            This page hit an unexpected error. Reloading usually fixes it — nothing you saved has been lost.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <a href="/" className="btn-secondary">Go to homepage</a>
          </div>
          <p className="mt-6 text-xs text-slate-400">
            Keeps happening? Email <a className="underline" href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>.
          </p>
        </div>
      </div>
    );
  }
}
