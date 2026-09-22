import { Component } from "react";

/**
 * Catches render-time errors anywhere below it and shows a recoverable
 * screen instead of React unmounting the tree and leaving a blank page.
 *
 * Must stay a class component — React has no hook equivalent of
 * componentDidCatch / getDerivedStateFromError.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Kept as console.error rather than a reporting service: there's no
    // backend to receive it, and swallowing it silently would make the
    // app harder to debug during evaluation.
    console.error("Unhandled UI error:", error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.assign("/");
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="setup-page">
        <div className="setup-card">
          <span className="setup-badge is-error">Something went wrong</span>
          <h1 className="setup-title">This page hit an unexpected error</h1>
          <p className="setup-lead">
            Your session is still active. Reloading usually clears it — if it keeps happening,
            please report it to the hostel office with the details below.
          </p>

          <div className="setup-actions">
            <button type="button" className="btn btn-primary" onClick={this.handleReload}>
              Reload page
            </button>
            <button type="button" className="btn btn-outline" onClick={this.handleHome}>
              Go to home
            </button>
          </div>

          <details className="setup-details">
            <summary>Technical details</summary>
            <pre>{String(error?.stack || error?.message || error)}</pre>
          </details>
        </div>
      </div>
    );
  }
}
